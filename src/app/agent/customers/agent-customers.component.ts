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

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user) { this.loading.set(false); return; }
    const agentName  = user.name;
    const agentEmail = user.email;

    const [byEmail, byName] = await Promise.all([
      this.sb.from('admin_leads')
        .select('id, name, email, phone, status, property_type, location, budget, notes, created_at')
        .eq('agent_email', agentEmail)
        .order('created_at', { ascending: false }),
      this.sb.from('admin_leads')
        .select('id, name, email, phone, status, property_type, location, budget, notes, created_at')
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
          // keep latest date
          if (r.created_at > existing.lastActive) existing.lastActive = r.created_at;
          // promote status: won > negotiating > qualified > contacted > new
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
            interest:   [r.property_type, r.location].filter(Boolean).join(' · ') || 'General',
            budget:     r.budget || '',
            status:     r.status === 'won' || r.status === 'lost' ? 'closed' : 'active',
            enquiries:  1,
            lastActive: r.created_at,
            notes:      r.notes || '',
          });
        }
      });
      this.customers.set(Array.from(map.values()));
    }
    this.loading.set(false);
  }
}
