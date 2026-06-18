import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface RecentLead { name: string; interest: string; status: string; date: string; isProject: boolean; }
interface MyProperty { id: number; name: string; location: string; price: string; type: string; status: string; }
interface MyProject  { id: number; name: string; developer: string; location: string; price: string; type: string; badge: string; }

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
})
export class AgentDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private sb = inject(SupabaseService).client;

  readonly today = new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  loading        = signal(true);
  totalLeads     = signal(0);
  newLeads       = signal(0);
  activeDeals    = signal(0);
  wonLeads       = signal(0);
  myPropCount    = signal(0);
  myProjectCount = signal(0);
  recentLeads    = signal<RecentLead[]>([]);
  myProperties   = signal<MyProperty[]>([]);
  myProjects     = signal<MyProject[]>([]);

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
  firstName(): string { return this.auth.currentUser()?.name?.split(' ')[0] ?? 'there'; }
  conversionRate(): string {
    const t = this.totalLeads(), w = this.wonLeads();
    return t ? Math.round((w / t) * 100) + '%' : '0%';
  }
  conversionPct(): number {
    const t = this.totalLeads(), w = this.wonLeads();
    return t ? Math.round((w / t) * 100) : 0;
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user) { this.loading.set(false); return; }
    const agentName  = user.name;
    const agentEmail = user.email;

    const [byEmailRes, byNameRes, propsRes, projectsRes] = await Promise.all([
      this.sb.from('admin_leads')
        .select('id, name, status, location, property_type, property_title, project_title, budget, created_at')
        .eq('agent_email', agentEmail)
        .order('created_at', { ascending: false }),
      this.sb.from('admin_leads')
        .select('id, name, status, location, property_type, property_title, project_title, budget, created_at')
        .eq('assigned_agent', agentName)
        .is('agent_email', null)
        .order('created_at', { ascending: false }),
      this.sb.from('properties')
        .select('id, title, location, type, listing_type, price, status')
        .eq('agent_name', agentName)
        .order('created_at', { ascending: false })
        .limit(4),
      this.sb.from('projects')
        .select('id, title, developer, location, type, price_from, price_label, badge')
        .eq('agent_name', agentName)
        .eq('status', 'Published')
        .order('created_at', { ascending: false })
        .limit(4),
    ]);

    const seen = new Set<number>();
    const leadsAll = [...(byEmailRes.data ?? []), ...(byNameRes.data ?? [])].filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

    this.totalLeads.set(leadsAll.length);
    this.newLeads.set(leadsAll.filter((l: any) => l.status === 'new').length);
    this.activeDeals.set(leadsAll.filter((l: any) => ['contacted', 'qualified', 'negotiating'].includes(l.status)).length);
    this.wonLeads.set(leadsAll.filter((l: any) => l.status === 'won').length);

    this.recentLeads.set(leadsAll.slice(0, 5).map((l: any) => ({
      name:      l.name || 'Unknown',
      interest:  l.property_title || l.project_title || [l.property_type, l.location].filter(Boolean).join(' · ') || 'General Enquiry',
      status:    l.status || 'new',
      date:      new Date(l.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }),
      isProject: !l.property_title && !!l.project_title,
    })));

    const props = propsRes.data ?? [];
    this.myPropCount.set(props.length);
    this.myProperties.set(props.map((p: any) => ({
      id: p.id, name: p.title || '', location: p.location || '',
      price: 'AED ' + Number(p.price).toLocaleString(),
      type: p.type || '', status: p.listing_type === 'Rent' ? 'rent' : 'sale',
    })));

    const projects = projectsRes.data ?? [];
    this.myProjectCount.set(projects.length);
    this.myProjects.set(projects.map((p: any) => ({
      id: p.id, name: p.title || '', developer: p.developer || '',
      location: p.location || '',
      price: p.price_label || (p.price_from ? 'AED ' + Number(p.price_from).toLocaleString() : 'On Request'),
      type: p.type || '', badge: p.badge || '',
    })));

    this.loading.set(false);
  }

  labelStatus(s: string): string {
    return ({ new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' } as Record<string, string>)[s] ?? s;
  }
}
