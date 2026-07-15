import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Enquiry {
  id: number;
  property: string;
  agent: string;
  date: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  message: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss',
})
export class CustomerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private sb = inject(SupabaseService).client;

  today = new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  showWelcome = signal(false);
  loading = signal(true);

  savedCount            = signal(0);
  totalEnquiries        = signal(0);
  projectEnqCount       = signal(0);
  recentEnquiries       = signal<Enquiry[]>([]);
  recentProjectEnqs     = signal<Enquiry[]>([]);

  constructor() {
    if (this.auth.newlyRegistered()) {
      this.showWelcome.set(true);
      this.auth.clearNewlyRegistered();
    }
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user?.email) { this.loading.set(false); return; }

    const [savedRes, leadsCountRes, leadsRes, savedProjCountRes, savedProjRowsRes] = await Promise.all([
      this.sb.from('saved_properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      this.sb.from('admin_leads').select('id', { count: 'exact', head: true }).eq('email', user.email),
      this.sb.from('admin_leads')
        .select('id, notes, status, assigned_agent, created_at, location, property_type, property_title, project_title, property_id')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(5),
      this.sb.from('saved_projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      this.sb.from('saved_projects')
        .select('id, project_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    this.savedCount.set(savedRes.count ?? 0);
    this.projectEnqCount.set(savedProjCountRes.count ?? 0);
    this.totalEnquiries.set(leadsCountRes.count ?? 0);

    if (leadsRes.data) {
      // For leads where property_title is missing but property_id exists, fetch titles from properties table
      const missingTitleIds = leadsRes.data
        .filter((r: any) => !r.property_title && !r.project_title && r.property_id)
        .map((r: any) => r.property_id);

      let propTitleMap: Record<number, string> = {};
      if (missingTitleIds.length) {
        const { data: props } = await this.sb
          .from('properties').select('id, title').in('id', missingTitleIds);
        (props ?? []).forEach((p: any) => { propTitleMap[p.id] = p.title; });
      }

      this.recentEnquiries.set(leadsRes.data.map((r: any) => ({
        id:       r.id,
        property: r.property_title || r.project_title || propTitleMap[r.property_id] || r.property_type || r.location || 'Enquiry',
        agent:    r.assigned_agent || 'Unassigned',
        date:     new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        status:   r.status || 'new',
        message:  r.notes || '',
      })));
    }

    // Load project details for saved projects
    const savedProjRows = savedProjRowsRes.data ?? [];
    if (savedProjRows.length) {
      const projectIds = savedProjRows.map((r: any) => r.project_id);
      const { data: projects } = await this.sb
        .from('projects')
        .select('id, title, developer, location, type, status, images')
        .in('id', projectIds);

      const projMap = new Map((projects ?? []).map((p: any) => [p.id, p]));
      this.recentProjectEnqs.set(savedProjRows.map((r: any) => {
        const p = projMap.get(r.project_id);
        return {
          id:       r.project_id,
          property: p?.title || 'Project',
          agent:    p?.developer || '',
          date:     new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
          status:   p?.status || 'Off-Plan',
          message:  '',
        };
      }));
    }

    this.loading.set(false);
  }

  dismissWelcome(): void { this.showWelcome.set(false); }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  firstName(): string {
    return this.auth.currentUser()?.name?.split(' ')[0] ?? 'there';
  }

  statusLabel(s: string): string {
    return { new: 'New', contacted: 'Contacted', qualified: 'Qualified', closed: 'Closed', available: 'Available', reserved: 'Reserved', sold: 'Sold' }[s] ?? s;
  }
}
