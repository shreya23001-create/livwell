import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

export interface AgentCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string;
  properties: string[];
  projects: string[];
  budget: string;
  status: 'active' | 'inactive' | 'closed';
  enquiries: number;
  lastActive: string;
  notes: string;
}

@Component({
  selector: 'app-agent-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-customers.component.html',
  styleUrl: './agent-customers.component.scss',
})
export class AgentCustomersComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  customers    = signal<AgentCustomer[]>([]);
  search       = signal('');
  filterStatus = signal<'active' | 'inactive' | 'closed' | ''>('');
  loading      = signal(true);

  page     = signal(1);
  pageSize = 50;

  stats = computed(() => {
    const a = this.customers();
    return {
      total:     a.length,
      active:    a.filter(c => c.status === 'active').length,
      closed:    a.filter(c => c.status === 'closed').length,
      enquiries: a.reduce((s, c) => s + c.enquiries, 0),
    };
  });

  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const st = this.filterStatus();
    return this.customers().filter(c => {
      const mq  = !q  || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.interest.toLowerCase().includes(q);
      const mst = !st || c.status === st;
      return mq && mst;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedCustomers = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  pageNumbers(): (number | null)[] {
    const total = this.totalPages();
    const cur   = this.page();
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(2, cur - delta); i <= Math.min(total - 1, cur + delta); i++) range.push(i);
    const pages: (number | null)[] = [1];
    if (range.length && range[0] > 2) pages.push(null);
    pages.push(...range);
    if (range.length && range[range.length - 1] < total - 1) pages.push(null);
    if (total > 1) pages.push(total);
    return pages;
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user) { this.loading.set(false); return; }
    const agentName  = user.name;
    const agentEmail = user.email;

    const [byEmail, byName] = await Promise.all([
      this.sb.from('admin_leads')
        .select('id, name, email, phone, status, property_type, property_title, project_title, location, budget, notes, created_at')
        .eq('agent_email', agentEmail)
        .order('created_at', { ascending: false }),
      this.sb.from('admin_leads')
        .select('id, name, email, phone, status, property_type, property_title, project_title, location, budget, notes, created_at')
        .eq('assigned_agent', agentName)
        .is('agent_email', null)
        .order('created_at', { ascending: false }),
    ]);
    const seen = new Set<number>();
    const combined = [...(byEmail.data ?? []), ...(byName.data ?? [])].filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
    const data = combined;

    if (data.length >= 0) {
      // Group by email — one customer entry per unique email, count enquiries
      const map = new Map<string, AgentCustomer>();
      data.forEach((r: any) => {
        const key = (r.email || r.id).toString();
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.enquiries++;
          if (r.created_at > existing.lastActive) existing.lastActive = new Date(r.created_at).toLocaleString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
          if (r.property_title && !existing.properties.includes(r.property_title)) existing.properties.push(r.property_title);
          if (r.project_title  && !existing.projects.includes(r.project_title))   existing.projects.push(r.project_title);
          if (!existing.budget && r.budget) existing.budget = r.budget;
          const rank = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
          if (rank.indexOf(r.status) > rank.indexOf(existing.status === 'closed' ? 'won' : existing.status === 'active' ? 'contacted' : 'new')) {
            existing.status = r.status === 'won' || r.status === 'lost' ? 'closed' : 'active';
          }
        } else {
          map.set(key, {
            id:         r.id,
            name:       r.name  || 'Unknown',
            email:      r.email || '',
            phone:      r.phone || '',
            interest:   r.property_title || r.project_title || [r.property_type, r.location].filter(Boolean).join(' · ') || 'General',
            properties: r.property_title ? [r.property_title] : [],
            projects:   r.project_title  ? [r.project_title]  : [],
            budget:     r.budget || '',
            status:     r.status === 'won' || r.status === 'lost' ? 'closed' : 'active',
            enquiries:  1,
            lastActive: new Date(r.created_at).toLocaleString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            notes:      r.notes || '',
          });
        }
      });
      this.customers.set(Array.from(map.values()));
    }
    this.loading.set(false);
  }
}
