import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Module = 'all' | 'auth' | 'property' | 'lead' | 'user' | 'cms' | 'config' | 'report';
type Actor  = 'all' | 'admin' | 'agent' | 'customer' | 'system';

interface AuditLog {
  id:        number;
  timestamp: string;
  actor:     string;
  actorRole: 'admin' | 'agent' | 'customer' | 'system';
  action:    string;
  module:    Exclude<Module, 'all'>;
  detail:    string;
  ip:        string;
  status:    'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit-logs.component.html',
  styleUrl: './admin-audit-logs.component.scss',
})
export class AdminAuditLogsComponent {

  searchQuery   = signal('');
  moduleFilter  = signal<Module>('all');
  actorFilter   = signal<Actor>('all');
  statusFilter  = signal<'all' | 'success' | 'warning' | 'error'>('all');
  dateFrom      = signal('');
  dateTo        = signal('');
  currentPage   = signal(1);
  pageSize      = 20;

  expandedId    = signal<number | null>(null);

  readonly modules: { value: Module; label: string }[] = [
    { value: 'all',      label: 'All Modules'   },
    { value: 'auth',     label: 'Authentication' },
    { value: 'property', label: 'Properties'     },
    { value: 'lead',     label: 'Leads'          },
    { value: 'user',     label: 'Users'          },
    { value: 'cms',      label: 'CMS'            },
    { value: 'config',   label: 'Configuration'  },
    { value: 'report',   label: 'Reports'        },
  ];

  readonly allLogs: AuditLog[] = [
    { id: 1,  timestamp: '2026-05-20 09:42:11', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Login',                  module: 'auth',     detail: 'Successful login from Chrome / Windows',                                    ip: '192.168.1.10',  status: 'success' },
    { id: 2,  timestamp: '2026-05-20 09:45:03', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Publish Property',        module: 'property', detail: 'Published listing "Marina Heights 3BHK" (REF-2024-0182)',                   ip: '192.168.1.10',  status: 'success' },
    { id: 3,  timestamp: '2026-05-20 09:51:28', actor: 'system',                actorRole: 'system',  action: 'Auto Lead Assignment',    module: 'lead',     detail: 'Lead #1042 assigned to agent sarah.mansouri@livwell.ae (round-robin)',      ip: '—',             status: 'success' },
    { id: 4,  timestamp: '2026-05-20 10:03:44', actor: 'sarah.mansouri@livwell.ae', actorRole: 'agent', action: 'Update Lead Status',  module: 'lead',     detail: 'Lead #1042 status changed: New → Contacted',                               ip: '10.0.0.52',     status: 'success' },
    { id: 5,  timestamp: '2026-05-20 10:14:09', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Edit CMS Banner',         module: 'cms',      detail: 'Hero banner #3 "Summer Collection" — updated image and CTA text',          ip: '192.168.1.10',  status: 'success' },
    { id: 6,  timestamp: '2026-05-20 10:22:37', actor: 'unknown@test.com',      actorRole: 'customer', action: 'Failed Login',           module: 'auth',     detail: '3 consecutive failed login attempts — account locked for 30 minutes',      ip: '41.32.110.88',  status: 'error'   },
    { id: 7,  timestamp: '2026-05-20 10:35:52', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Create User',             module: 'user',     detail: 'New agent account created: Omar Al-Farsi (omar@livwell.ae)',              ip: '192.168.1.10',  status: 'success' },
    { id: 8,  timestamp: '2026-05-20 10:48:16', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Reassign Lead',           module: 'lead',     detail: 'Lead #1038 reassigned from ahmed.hassan to sarah.mansouri',               ip: '192.168.1.10',  status: 'success' },
    { id: 9,  timestamp: '2026-05-20 11:02:30', actor: 'system',                actorRole: 'system',  action: 'Escalation Alert',        module: 'lead',     detail: 'Lead #1044 uncontacted >1 hour — escalation alert sent to admin',         ip: '—',             status: 'warning' },
    { id: 10, timestamp: '2026-05-20 11:15:04', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Export Report',           module: 'report',   detail: 'Lead Summary Report exported to CSV (date range: May 1–20 2026)',          ip: '192.168.1.10',  status: 'success' },
    { id: 11, timestamp: '2026-05-20 11:28:19', actor: 'rania.khalid@livwell.ae', actorRole: 'agent', action: 'Upload Property Media', module: 'property', detail: 'Added 6 photos to listing "Downtown Studio" (REF-2024-0199)',              ip: '10.0.0.61',     status: 'success' },
    { id: 12, timestamp: '2026-05-20 11:44:55', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Delete Property',         module: 'property', detail: 'Deleted duplicate listing "JLT Office Space" (REF-2024-0155)',             ip: '192.168.1.10',  status: 'warning' },
    { id: 13, timestamp: '2026-05-20 12:01:08', actor: 'ahmed.hassan@livwell.ae', actorRole: 'agent', action: 'Schedule Viewing',       module: 'lead',     detail: 'Viewing scheduled for Lead #1039 — May 22, 2026 at 3:00 PM',              ip: '10.0.0.55',     status: 'success' },
    { id: 14, timestamp: '2026-05-20 12:18:33', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Edit Role Permissions',   module: 'config',   detail: 'Agent role — disabled "Delete Property" permission',                       ip: '192.168.1.10',  status: 'warning' },
    { id: 15, timestamp: '2026-05-20 12:35:47', actor: 'system',                actorRole: 'system',  action: 'Email Notification Sent', module: 'lead',     detail: 'Welcome email sent to new customer james.carter@email.com',               ip: '—',             status: 'success' },
    { id: 16, timestamp: '2026-05-20 13:04:22', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Suspend User',            module: 'user',     detail: 'Customer account suspended: test.spam@email.com (reason: spam activity)', ip: '192.168.1.10',  status: 'warning' },
    { id: 17, timestamp: '2026-05-20 13:22:09', actor: 'sarah.mansouri@livwell.ae', actorRole: 'agent', action: 'Add Note',            module: 'lead',     detail: 'Internal note added to Lead #1042 (visible to admin only)',               ip: '10.0.0.52',     status: 'success' },
    { id: 18, timestamp: '2026-05-20 13:40:55', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Update CMS Page',         module: 'cms',      detail: 'About Us page — updated hero heading and stats section copy',             ip: '192.168.1.10',  status: 'success' },
    { id: 19, timestamp: '2026-05-20 14:03:11', actor: 'system',                actorRole: 'system',  action: 'Database Backup',         module: 'config',   detail: 'Scheduled daily backup completed — 847 MB, stored offsite',               ip: '—',             status: 'success' },
    { id: 20, timestamp: '2026-05-20 14:18:44', actor: 'omar.farsi@livwell.ae', actorRole: 'agent',   action: 'Login',                  module: 'auth',     detail: 'First login — password change prompted',                                   ip: '10.0.0.72',     status: 'success' },
    { id: 21, timestamp: '2026-05-20 14:35:02', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Unpublish Property',      module: 'property', detail: 'Listing "Palm Villa 5BR" (REF-2024-0177) unpublished — price review',      ip: '192.168.1.10',  status: 'success' },
    { id: 22, timestamp: '2026-05-20 14:52:30', actor: 'sarah.mansouri@livwell.ae', actorRole: 'agent', action: 'Mark Lead Won',       module: 'lead',     detail: 'Lead #1031 marked as Won — deal value AED 2.4M, commission logged',       ip: '10.0.0.52',     status: 'success' },
    { id: 23, timestamp: '2026-05-20 15:10:18', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Create User',             module: 'user',     detail: 'New admin account created: ops@livwell.ae (role: Admin)',                  ip: '192.168.1.10',  status: 'success' },
    { id: 24, timestamp: '2026-05-20 15:28:04', actor: 'system',                actorRole: 'system',  action: 'Auto Lead Assignment',    module: 'lead',     detail: 'Lead #1047 assigned to ahmed.hassan (property agent match)',              ip: '—',             status: 'success' },
    { id: 25, timestamp: '2026-05-20 15:45:39', actor: 'admin@livwell.ae',      actorRole: 'admin',   action: 'Logout',                 module: 'auth',     detail: 'Admin session ended',                                                      ip: '192.168.1.10',  status: 'success' },
  ];

  filteredLogs = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const mod = this.moduleFilter();
    const act = this.actorFilter();
    const st  = this.statusFilter();
    const from = this.dateFrom();
    const to   = this.dateTo();

    return this.allLogs.filter(log => {
      if (mod !== 'all' && log.module !== mod) return false;
      if (act !== 'all' && log.actorRole !== act) return false;
      if (st  !== 'all' && log.status !== st)   return false;
      if (from && log.timestamp < from) return false;
      if (to   && log.timestamp > to + ' 23:59:59') return false;
      if (q && !log.actor.toLowerCase().includes(q) &&
               !log.action.toLowerCase().includes(q) &&
               !log.detail.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredLogs().length / this.pageSize)));

  pagedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredLogs().slice(start, start + this.pageSize);
  });

  readonly summaryStats = computed(() => {
    const logs = this.filteredLogs();
    return {
      total:   logs.length,
      success: logs.filter(l => l.status === 'success').length,
      warning: logs.filter(l => l.status === 'warning').length,
      error:   logs.filter(l => l.status === 'error').length,
    };
  });

  setModule(v: Module)  { this.moduleFilter.set(v);  this.currentPage.set(1); }
  setActor(v: Actor)    { this.actorFilter.set(v);   this.currentPage.set(1); }
  setStatus(v: 'all' | 'success' | 'warning' | 'error') { this.statusFilter.set(v); this.currentPage.set(1); }
  onSearch(q: string)   { this.searchQuery.set(q);   this.currentPage.set(1); }
  onDateFrom(v: string) { this.dateFrom.set(v);      this.currentPage.set(1); }
  onDateTo(v: string)   { this.dateTo.set(v);        this.currentPage.set(1); }

  prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  goPage(p: number) { this.currentPage.set(p); }

  toggleExpand(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.moduleFilter.set('all');
    this.actorFilter.set('all');
    this.statusFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  exportCsv() {
    const rows = this.filteredLogs();
    const header = 'Timestamp,Actor,Role,Action,Module,Detail,IP,Status';
    const lines = rows.map(r =>
      `"${r.timestamp}","${r.actor}","${r.actorRole}","${r.action}","${r.module}","${r.detail.replace(/"/g, '""')}","${r.ip}","${r.status}"`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  moduleLabel(m: Exclude<Module,'all'>): string {
    return this.modules.find(x => x.value === m)?.label ?? m;
  }

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });
}
