import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../shared/services/admin-data.service';
import * as XLSX from 'xlsx';

interface AgentRow { name: string; leads: number; won: number; conversion: number; }

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reports.component.html',
  styleUrl:    './admin-reports.component.scss',
})
export class AdminReportsComponent {

  dataSvc = inject(AdminDataService);

  period = signal<'week' | 'month' | 'quarter' | 'year'>('month');

  // ── Filter controls ───────────────────────────────────
  filterAgent  = signal('');
  filterStatus = signal('');
  filterDateFrom = signal('');
  filterDateTo   = signal('');

  agentNames = computed(() => {
    const agents = this.dataSvc.users().filter(u => u.role === 'agent');
    return agents.map(a => a.name).sort();
  });

  statusOptions = computed(() => this.dataSvc.leadStatuses().map(s => s.name));

  filteredLeads = computed(() => {
    const agent  = this.filterAgent();
    const status = this.filterStatus();
    const from   = this.filterDateFrom();
    const to     = this.filterDateTo();
    return this.dataSvc.leads().filter(l => {
      const contactDate = l.lastContact || l.createdDate || '';
      if (agent  && l.assignedAgent !== agent)    return false;
      if (status && l.status        !== status)   return false;
      if (from   && contactDate < from)            return false;
      if (to     && contactDate > to)              return false;
      return true;
    });
  });

  hasActiveFilters = computed(() =>
    !!(this.filterAgent() || this.filterStatus() || this.filterDateFrom() || this.filterDateTo())
  );

  clearFilters(): void {
    this.filterAgent.set('');
    this.filterStatus.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  exportFiltered(): void {
    const leads = this.filteredLeads();
    const rows = leads.map(l => ({
      'Name':           l.name,
      'Email':          l.email,
      'Phone':          l.phone,
      'Status':         l.status,
      'Source':         l.source,
      'Category':       l.category,
      'Budget':         l.budget,
      'Location':       l.location,
      'Property Type':  l.propertyType,
      'Assigned Agent': l.assignedAgent,
      'Notes':          l.notes,
      'Created Date':   l.createdDate,
      'Last Contact':   l.lastContact,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `livwell-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── KPIs (computed from filtered data) ───────────────
  kpis = computed(() => {
    const leads = this.filteredLeads();
    const users = this.dataSvc.users();
    const agents = users.filter(u => u.role === 'agent' && u.status === 'active');
    const wonLeads = leads.filter(l => l.status === 'won').length;
    const totalLeads = leads.length;
    const conversion = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

    return [
      { label: 'Total Leads',     value: String(totalLeads),       sub: 'All time',        trend: 'up'   as const, trendVal: `${leads.filter(l => l.status === 'new').length} new`,  color: 'blue'   },
      { label: 'Won Leads',       value: String(wonLeads),          sub: 'Closed deals',    trend: 'up'   as const, trendVal: `${wonLeads}`,                                           color: 'green'  },
      { label: 'Active Leads',    value: String(leads.filter(l => !['won','lost'].includes(l.status)).length), sub: 'In pipeline', trend: 'up' as const, trendVal: `${leads.filter(l => l.status === 'new').length} new`, color: 'blue' },
      { label: 'Conversion Rate', value: `${conversion}%`,          sub: 'Leads → Won',     trend: 'up'   as const, trendVal: `${conversion}%`,                                        color: 'purple' },
      { label: 'Lost Leads',      value: String(leads.filter(l => l.status === 'lost').length), sub: 'Not converted', trend: 'down' as const, trendVal: `${leads.filter(l=>l.status==='lost').length}`, color: 'red' },
      { label: 'Active Agents',   value: String(agents.length),     sub: 'Currently active', trend: 'flat' as const, trendVal: `${users.filter(u=>u.role==='agent').length} total`,   color: 'gray'   },
    ];
  });

  // ── Lead pipeline (dynamic) ───────────────────────────
  leadsByStatus = computed(() => {
    const leads = this.filteredLeads();
    const counts = {
      new:         leads.filter(l => l.status === 'new').length,
      contacted:   leads.filter(l => l.status === 'contacted').length,
      qualified:   leads.filter(l => l.status === 'qualified').length,
      negotiating: leads.filter(l => l.status === 'negotiating').length,
      won:         leads.filter(l => l.status === 'won').length,
      lost:        leads.filter(l => l.status === 'lost').length,
    };
    const max = Math.max(...Object.values(counts), 1);
    return [
      { label: 'New',         value: counts.new,         pct: Math.round(counts.new         / max * 100), color: '#f59e0b' },
      { label: 'Contacted',   value: counts.contacted,   pct: Math.round(counts.contacted   / max * 100), color: '#3b82f6' },
      { label: 'Qualified',   value: counts.qualified,   pct: Math.round(counts.qualified   / max * 100), color: '#10b981' },
      { label: 'Negotiating', value: counts.negotiating, pct: Math.round(counts.negotiating / max * 100), color: '#8b5cf6' },
      { label: 'Won',         value: counts.won,         pct: Math.round(counts.won         / max * 100), color: '#6366f1' },
      { label: 'Lost',        value: counts.lost,        pct: Math.round(counts.lost        / max * 100), color: '#ef4444' },
    ];
  });

  totalLeadsPipeline = computed(() => this.filteredLeads().length);

  // ── Leads by source (dynamic) ─────────────────────────
  leadsBySource = computed(() => {
    const leads = this.filteredLeads();
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    const labels: Record<string, string> = {
      website: 'Website', referral: 'Referral', walk_in: 'Walk-in',
      social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call',
    };
    const colors: Record<string, string> = {
      website: '#3b82f6', portal: '#8b5cf6', referral: '#10b981',
      social_media: '#f59e0b', walk_in: '#6366f1', cold_call: '#6b7280',
    };
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([src, val]) => ({
        label: labels[src] || src,
        value: val,
        pct:   Math.round(val / max * 100),
        color: colors[src] || '#6b7280',
      }));
  });

  // ── Users by role (dynamic) ───────────────────────────
  usersByRole = computed(() => {
    const users = this.dataSvc.users();
    const counts: Record<string, number> = {};
    users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
    const labels: Record<string, string> = { super_admin: 'Super Admin', admin: 'Admin', agent: 'Agent', customer: 'Customer' };
    const colors: Record<string, string> = { super_admin: '#7c3aed', admin: '#6366f1', agent: '#10b981', customer: '#3b82f6' };
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([role, val]) => ({
        label: labels[role] || role,
        value: val,
        pct:   Math.round(val / max * 100),
        color: colors[role] || '#6b7280',
      }));
  });

  // ── Top agents (dynamic) ──────────────────────────────
  topAgents = computed((): AgentRow[] => {
    const leads  = this.filteredLeads();
    const agents = this.dataSvc.users().filter(u => u.role === 'agent');

    return agents.map(a => {
      const agentLeads = leads.filter(l => l.assignedAgent === a.name);
      const won  = agentLeads.filter(l => l.status === 'won').length;
      const conv = agentLeads.length > 0 ? Math.round((won / agentLeads.length) * 100) : 0;
      return { name: a.name, leads: agentLeads.length, won, conversion: conv };
    }).sort((a, b) => b.leads - a.leads);
  });

  maxAgentLeads = computed(() => Math.max(...this.topAgents().map(a => a.leads), 1));

  // ── Leads by category (dynamic) ───────────────────────
  leadsByCategory = computed(() => {
    const leads = this.filteredLeads();
    const buy    = leads.filter(l => l.category === 'buy').length;
    const rent   = leads.filter(l => l.category === 'rent').length;
    const invest = leads.filter(l => l.category === 'invest').length;
    const max = Math.max(buy, rent, invest, 1);
    return [
      { label: 'Buy',    value: buy,    pct: Math.round(buy    / max * 100), color: '#3b82f6' },
      { label: 'Rent',   value: rent,   pct: Math.round(rent   / max * 100), color: '#10b981' },
      { label: 'Invest', value: invest, pct: Math.round(invest / max * 100), color: '#8b5cf6' },
    ];
  });
}
