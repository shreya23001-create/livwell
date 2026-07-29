import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../shared/services/admin-data.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private dataSvc  = inject(AdminDataService);
  private sb       = inject(SupabaseService).client;

  readonly today    = new Date();
  readonly todayIso = new Date().toISOString().slice(0, 10);

  // ── Live signals from service ─────────────────────────
  leads = this.dataSvc.leads;
  users = this.dataSvc.users;

  propertiesCount     = signal(0);
  propertiesPublished = signal(0);
  projectsCount       = signal(0);
  projectsPublished   = signal(0);
  followUpTotal       = signal(0);
  followUpOverdue     = signal(0);
  followUpToday       = signal(0);

  constructor() {
    this.loadStats();
  }

  private async loadStats(): Promise<void> {
    const [propRes, projRes, fuRes] = await Promise.all([
      this.sb.from('properties').select('status'),
      this.sb.from('projects').select('status'),
      this.sb.from('admin_leads').select('follow_up_date, status').not('follow_up_date', 'is', null),
    ]);
    if (propRes.data) {
      this.propertiesCount.set(propRes.data.length);
      this.propertiesPublished.set(propRes.data.filter((p: any) => p.status === 'Published').length);
    }
    if (projRes.data) {
      this.projectsCount.set(projRes.data.length);
      this.projectsPublished.set(projRes.data.filter((p: any) => p.status === 'Published').length);
    }
    if (fuRes.data) {
      const active = fuRes.data.filter((l: any) => !['won', 'lost'].includes(l.status));
      this.followUpTotal.set(active.length);
      this.followUpOverdue.set(active.filter((l: any) => l.follow_up_date < this.todayIso).length);
      this.followUpToday.set(active.filter((l: any) => l.follow_up_date === this.todayIso).length);
    }
  }

  // ── KPIs ─────────────────────────────────────────────
  kpis = computed(() => {
    const leads   = this.leads();
    const users   = this.users();
    const active  = leads.filter(l => !['won','lost'].includes(l.status)).length;
    const agents  = users.filter(u => u.role === 'agent' && u.status === 'active').length;
    const won     = leads.filter(l => l.status === 'won').length;
    const conv    = leads.length > 0 ? ((won / leads.length) * 100).toFixed(1) : '0.0';
    const overdue = this.followUpOverdue();
    const todayCnt = this.followUpToday();
    const fuSub   = overdue > 0 ? `${overdue} overdue` : todayCnt > 0 ? `${todayCnt} due today` : 'All on track';

    return [
      { label: 'Total Properties', value: String(this.propertiesCount()), sub: `${this.propertiesPublished()} published`, icon: 'home',      color: 'blue'   },
      { label: 'Total Projects',   value: String(this.projectsCount()),   sub: `${this.projectsPublished()} published`,  icon: 'projects',  color: 'teal'   },
      { label: 'Active Leads',     value: String(active),                  sub: `${leads.filter(l=>l.status==='new').length} new today`,   icon: 'leads',   color: 'gold'   },
      { label: 'Active Agents',    value: String(agents),                  sub: `${users.filter(u=>u.role==='agent').length} total`,        icon: 'agents',  color: 'green'  },
      { label: 'Conversion Rate',  value: `${conv}%`,                      sub: `${won} deals won`,                                         icon: 'revenue', color: 'purple' },
      { label: 'Follow-Ups',       value: String(this.followUpTotal()),    sub: fuSub,                                                       icon: 'calendar', color: 'orange' },
    ];
  });

  // ── Lead sources breakdown ────────────────────────────
  leadSources = computed(() => {
    const leads = this.leads();
    if (!leads.length) return [];
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    const colors: Record<string, string> = {
      website: '#6366f1', portal: '#3b82f6', referral: '#10b981',
      social_media: '#8b5cf6', walk_in: '#f59e0b', cold_call: '#9ca3af',
    };
    const labels: Record<string, string> = {
      website: 'Website', portal: 'Portal', referral: 'Referral',
      social_media: 'Social Media', walk_in: 'Walk-in', cold_call: 'Cold Call',
    };
    const total = leads.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([src, count]) => ({
        label: labels[src] || src,
        pct:   Math.round((count / total) * 100),
        color: colors[src] || '#9ca3af',
      }));
  });

  // ── Recent leads ──────────────────────────────────────
  recentLeads = computed(() =>
    this.leads()
      .slice(0, 5)
      .map(l => ({
        name:   l.name,
        email:  l.email,
        status: this.statusLabel(l.status),
        agent:  l.assignedAgent,
        avatar: l.name.charAt(0).toUpperCase(),
        date:   l.createdDate,
      }))
  );

  // ── Top agents ────────────────────────────────────────
  topAgents = computed(() => {
    const leads = this.leads();
    return this.users()
      .filter(u => u.role === 'agent')
      .map(a => {
        const aLeads = leads.filter(l => l.assignedAgent === a.name);
        const won    = aLeads.filter(l => l.status === 'won').length;
        return { name: a.name, leads: aLeads.length, won, avatar: a.name.charAt(0).toUpperCase() };
      })
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 5);
  });

  // ── Lead pipeline breakdown ───────────────────────────
  pipeline = computed(() => {
    const leads = this.leads();
    const statuses = ['new','contacted','qualified','negotiating','won','lost'] as const;
    const colors: Record<string, string> = {
      new: '#f59e0b', contacted: '#3b82f6', qualified: '#10b981',
      negotiating: '#8b5cf6', won: '#6366f1', lost: '#ef4444',
    };
    const max = Math.max(...statuses.map(s => leads.filter(l => l.status === s).length), 1);
    return statuses.map(s => {
      const count = leads.filter(l => l.status === s).length;
      return { label: s.charAt(0).toUpperCase() + s.slice(1), count, pct: Math.round(count / max * 100), color: colors[s] };
    });
  });

  // ── Helpers ───────────────────────────────────────────
  statusLabel(s: string): string {
    const map: Record<string, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' };
    return map[s] || s;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { New: 'status--new', Contacted: 'status--contacted', Qualified: 'status--qualified', Won: 'status--won', Lost: 'status--lost' };
    return map[status] || '';
  }

  getLeadSourceOffset(index: number): number {
    const r = 40, circ = 2 * Math.PI * r;
    let offset = 0;
    const sources = this.leadSources();
    for (let i = 0; i < index; i++) offset += (sources[i].pct / 100) * circ;
    return -offset;
  }

  getLeadSourceDash(pct: number): string {
    const r = 40, circ = 2 * Math.PI * r;
    return `${(pct / 100) * circ} ${circ}`;
  }
}
