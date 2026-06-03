import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, AuditLog, AuditModule, AuditActorRole, AuditStatus } from '../../shared/services/admin-data.service';

type ModuleFilter = AuditModule | 'all';
type ActorFilter  = AuditActorRole | 'all';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit-logs.component.html',
  styleUrl: './admin-audit-logs.component.scss',
})
export class AdminAuditLogsComponent {
  private dataSvc = inject(AdminDataService);

  allLogs  = this.dataSvc.auditLogs;
  loading  = this.dataSvc.auditLoading;

  searchQuery  = signal('');
  moduleFilter = signal<ModuleFilter>('all');
  actorFilter  = signal<ActorFilter>('all');
  statusFilter = signal<AuditStatus | 'all'>('all');
  dateFrom     = signal('');
  dateTo       = signal('');
  currentPage  = signal(1);
  pageSize     = 20;
  expandedId   = signal<number | null>(null);

  readonly modules: { value: ModuleFilter; label: string }[] = [
    { value: 'all',      label: 'All Modules'   },
    { value: 'auth',     label: 'Authentication' },
    { value: 'property', label: 'Properties'     },
    { value: 'lead',     label: 'Leads'          },
    { value: 'user',     label: 'Users'          },
    { value: 'cms',      label: 'CMS'            },
    { value: 'config',   label: 'Configuration'  },
    { value: 'report',   label: 'Reports'        },
  ];

  filteredLogs = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const mod  = this.moduleFilter();
    const act  = this.actorFilter();
    const st   = this.statusFilter();
    const from = this.dateFrom();
    const to   = this.dateTo();

    return this.allLogs().filter(log => {
      if (mod !== 'all' && log.module    !== mod) return false;
      if (act !== 'all' && log.actorRole !== act) return false;
      if (st  !== 'all' && log.status    !== st)  return false;
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

  summaryStats = computed(() => {
    const logs = this.filteredLogs();
    return {
      total:   logs.length,
      success: logs.filter(l => l.status === 'success').length,
      warning: logs.filter(l => l.status === 'warning').length,
      error:   logs.filter(l => l.status === 'error').length,
    };
  });

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

  setModule(v: ModuleFilter)              { this.moduleFilter.set(v);  this.currentPage.set(1); }
  setActor(v: ActorFilter)                { this.actorFilter.set(v);   this.currentPage.set(1); }
  setStatus(v: AuditStatus | 'all')       { this.statusFilter.set(v);  this.currentPage.set(1); }
  onSearch(q: string)                     { this.searchQuery.set(q);   this.currentPage.set(1); }
  onDateFrom(v: string)                   { this.dateFrom.set(v);      this.currentPage.set(1); }
  onDateTo(v: string)                     { this.dateTo.set(v);        this.currentPage.set(1); }
  prevPage()                              { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage()                              { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  goPage(p: number)                       { this.currentPage.set(p); }
  toggleExpand(id: number)                { this.expandedId.set(this.expandedId() === id ? null : id); }

  refresh(): void { this.dataSvc.loadAuditLogs(); }

  clearFilters(): void {
    this.searchQuery.set(''); this.moduleFilter.set('all');
    this.actorFilter.set('all'); this.statusFilter.set('all');
    this.dateFrom.set(''); this.dateTo.set('');
    this.currentPage.set(1);
  }

  exportCsv(): void {
    const rows = this.filteredLogs();
    const header = 'Timestamp,Actor,Role,Action,Module,Detail,IP,Status';
    const lines  = rows.map(r =>
      `"${r.timestamp}","${r.actor}","${r.actorRole}","${r.action}","${r.module}","${r.detail.replace(/"/g, '""')}","${r.ip}","${r.status}"`
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  moduleLabel(m: AuditModule): string {
    return this.modules.find(x => x.value === m)?.label ?? m;
  }
}
