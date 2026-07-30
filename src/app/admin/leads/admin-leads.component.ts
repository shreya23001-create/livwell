import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';
import { AdminDataService, LeadStatus, LeadSource, LeadCategory, Lead } from '../../shared/services/admin-data.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { EmailService } from '../../shared/services/email.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';

export type { LeadStatus, LeadSource, LeadCategory, Lead };


const EMPTY_FORM = (): Partial<Lead> => ({
  name: '', email: '', phone: '', status: 'new', source: 'website', category: 'buy',
  budget: '', location: '', propertyType: '', assignedAgent: 'Unassigned', notes: '',
  createdDate: new Date().toISOString().slice(0, 10),
  lastContact: new Date().toISOString().slice(0, 10),
  followUpDate: '', followUpNote: '',
});

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [PhoneInputComponent, CommonModule, FormsModule, RichEditorComponent, RouterModule],
  templateUrl: './admin-leads.component.html',
  styleUrl: './admin-leads.component.scss',
})
export class AdminLeadsComponent implements OnInit {

  dataSvc        = inject(AdminDataService);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private route  = inject(ActivatedRoute);
  private emailSvc = inject(EmailService);
  private sb       = inject(SupabaseService).client;
  leads   = this.dataSvc.leads;
  loading = this.dataSvc.leadsLoading;

  search       = signal('');
  filterStatus = signal<LeadStatus | ''>('');
  filterSource = signal<LeadSource | ''>('');
  filterAgent  = signal('');
  sortCol      = signal<keyof Lead>('createdDate');
  sortDir      = signal<'asc' | 'desc'>('desc');
  page         = signal(1);
  pageSize     = 10;

  // ── Date filter — default: rolling last 1 month ───────
  private static defaultDateFrom(): string {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10);
  }
  private static defaultDateTo(): string {
    return new Date().toISOString().slice(0, 10);
  }
  filterDateFrom = signal(AdminLeadsComponent.defaultDateFrom());
  filterDateTo   = signal(AdminLeadsComponent.defaultDateTo());

  // ── Modal ─────────────────────────────────────────────
  showModal       = signal(false);
  isEdit          = signal(false);
  editId          = signal<number | null>(null);
  form            = signal<Partial<Lead>>(EMPTY_FORM());
  formErrors      = signal<Record<string, string>>({});
  saveError       = signal('');
  saving          = signal(false);
  showDeleteModal = signal(false);
  deleteTarget    = signal<Lead | null>(null);

  // ── View Modal (from notification) ───────────────────
  showViewModal     = signal(false);
  viewLead          = signal<Lead | null>(null);
  viewTab           = signal<'overview' | 'followup' | 'activity'>('overview');
  viewFollowUps     = signal<any[]>([]);
  viewFollowUpsLoad = signal(false);

  leadAuditLogs = computed(() => {
    const lead = this.viewLead();
    if (!lead) return [];
    const name = lead.name.toLowerCase();
    return this.dataSvc.auditLogs().filter(log =>
      log.module === 'lead' && log.detail.toLowerCase().includes(name)
    );
  });

  // ── Tabs ─────────────────────────────────────────────
  activeTab    = signal<'dashboard' | 'leads' | 'followup'>('dashboard');
  fuFilter     = signal<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  // ── Edit Follow-up Modal ──────────────────────────────
  showEditFuModal = signal(false);
  editFuRecord    = signal<any>(null);
  editFuDate      = signal('');
  editFuTime      = signal('');
  editFuRemarks   = signal('');
  editFuStatus    = signal('new');
  savingEditFu    = signal(false);
  readonly fuStatusOptions = ['new','contacted','qualified','negotiating','won','lost','pending','missed'];

  openEditFu(r: any): void {
    this.editFuRecord.set(r);
    this.editFuDate.set(r.follow_up_date ?? '');
    this.editFuTime.set(r.follow_up_time ?? '');
    this.editFuRemarks.set(r.remarks ?? '');
    this.editFuStatus.set(r.status ?? 'new');
    this.showEditFuModal.set(true);
  }

  closeEditFuModal(): void { this.showEditFuModal.set(false); this.editFuRecord.set(null); }

  async saveEditFu(): Promise<void> {
    const rec = this.editFuRecord();
    if (!rec) return;
    const date    = this.editFuDate().trim();
    const time    = this.editFuTime().trim();
    const remarks = this.editFuRemarks().trim();
    const status  = this.editFuStatus();
    if (!date) { this.toast.error('Date is required.'); return; }
    this.savingEditFu.set(true);
    const isFallback = rec.id?.toString().startsWith('fallback-');
    let error: any = null;
    if (isFallback) {
      const res = await this.sb.from('lead_follow_ups').insert({
        lead_id: rec.lead_id, follow_up_date: date,
        follow_up_time: time || null, remarks: remarks || null,
        status, created_by: 'Admin',
      });
      error = res.error;
      if (!error) {
        await this.sb.from('admin_leads')
          .update({ follow_up_date: date, follow_up_note: remarks || null })
          .eq('id', rec.lead_id);
      }
    } else {
      const res = await this.sb.from('lead_follow_ups').update({
        follow_up_date: date, follow_up_time: time || null,
        remarks: remarks || null, status,
      }).eq('id', rec.id);
      error = res.error;
      if (!error) {
        const latest = this.allFollowUpRecords()
          .filter(x => x.lead_id === rec.lead_id)
          .sort((a, b) => (b.follow_up_date ?? '').localeCompare(a.follow_up_date ?? ''))[0];
        if (latest?.id === rec.id) {
          await this.sb.from('admin_leads')
            .update({ follow_up_date: date, follow_up_note: remarks || null })
            .eq('id', rec.lead_id);
        }
      }
    }
    if (error) {
      this.toast.error('Failed to save follow-up.');
    } else {
      this.toast.success('Follow-up saved.');
      this.showEditFuModal.set(false);
      this.editFuRecord.set(null);
      await this.loadAllFollowUps();
    }
    this.savingEditFu.set(false);
  }

  // Raw rows fetched from DB — enriched reactively via computed below
  private rawFollowUpRows = signal<any[]>([]);
  allFollowUpRecordsLoading = signal(false);

  allFollowUpRecords = computed(() => {
    const rows = this.rawFollowUpRows();
    const leadsMap = new Map(this.leads().map(l => [l.id, l]));
    const records: any[] = rows.map(r => ({ ...r, lead: leadsMap.get(r.lead_id) ?? null }));
    // Fallback: leads with follow_up_date on admin_leads but no row in lead_follow_ups
    const leadsWithHistory = new Set(rows.map(r => r.lead_id));
    for (const lead of this.leads()) {
      if (lead.followUpDate && !leadsWithHistory.has(lead.id)) {
        records.push({
          id: `fallback-${lead.id}`, lead_id: lead.id,
          follow_up_date: lead.followUpDate, follow_up_time: null,
          remarks: lead.followUpNote || null, status: lead.status,
          created_by: 'Admin', created_at: lead.createdDate, lead,
        });
      }
    }
    return records.sort((a, b) => (a.follow_up_date ?? '').localeCompare(b.follow_up_date ?? ''));
  });

  // ── Dashboard computed ────────────────────────────────
  today = new Date().toISOString().slice(0, 10);

  private dedupeByLead(records: any[], prefer: 'latest' | 'earliest'): any[] {
    const byLead = new Map<number, any>();
    for (const r of records) {
      const existing = byLead.get(r.lead_id);
      const rd = r.follow_up_date ?? '';
      const ed = existing?.follow_up_date ?? '';
      const wins = prefer === 'latest'
        ? (rd > ed || (rd === ed && (r.created_at ?? '') > (existing?.created_at ?? '')))
        : (rd < ed || (rd === ed && (r.created_at ?? '') > (existing?.created_at ?? '')));
      if (!existing || wins) byLead.set(r.lead_id, r);
    }
    return Array.from(byLead.values())
      .sort((a, b) => (a.follow_up_date ?? '').localeCompare(b.follow_up_date ?? ''));
  }

  // Lead IDs whose latest follow-up is upcoming — exclude from overdue/today
  private leadsWithUpcoming = computed(() => {
    const latest = this.dedupeByLead(
      this.allFollowUpRecords().filter(r => r.follow_up_date), 'latest'
    );
    return new Set(latest.filter(r => r.follow_up_date > this.today).map(r => r.lead_id));
  });

  overdueFollowUps = computed(() => this.dedupeByLead(
    this.allFollowUpRecords().filter(r =>
      r.follow_up_date && r.follow_up_date < this.today &&
      !this.leadsWithUpcoming().has(r.lead_id)
    ), 'latest'
  ));

  todayFollowUps = computed(() => this.dedupeByLead(
    this.allFollowUpRecords().filter(r =>
      r.follow_up_date === this.today &&
      !this.leadsWithUpcoming().has(r.lead_id)
    ), 'latest'
  ));

  upcomingFollowUps = computed(() => this.dedupeByLead(
    this.allFollowUpRecords().filter(r => r.follow_up_date && r.follow_up_date > this.today), 'earliest'
  ));

  latestFollowUpPerLead = computed(() => this.dedupeByLead(
    this.allFollowUpRecords().filter(r => r.follow_up_date), 'latest'
  ));

  filteredFollowUps = computed(() => {
    const f = this.fuFilter();
    if (f === 'overdue')  return this.overdueFollowUps();
    if (f === 'today')    return this.todayFollowUps();
    if (f === 'upcoming') return this.upcomingFollowUps();
    return this.latestFollowUpPerLead();
  });

  followUps = computed(() =>
    this.leads()
      .filter(l => l.followUpDate)
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
  );

  conversionRate = computed(() => {
    const all = this.leads().length;
    if (!all) return 0;
    const won = this.leads().filter(l => l.status === 'won').length;
    return Math.round((won / all) * 100);
  });

  topAgents = computed(() => {
    const map: Record<string, { total: number; won: number }> = {};
    for (const l of this.leads()) {
      const ag = l.assignedAgent || 'Unassigned';
      if (!map[ag]) map[ag] = { total: 0, won: 0 };
      map[ag].total++;
      if (l.status === 'won') map[ag].won++;
    }
    return Object.entries(map)
      .filter(([ag]) => ag !== 'Unassigned')
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  sourceBreakdown = computed(() => {
    const map: Record<string, number> = {};
    for (const l of this.leads()) {
      const src = l.source || 'website';
      map[src] = (map[src] || 0) + 1;
    }
    return Object.entries(map).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  });

  categoryBreakdown = computed(() => {
    const map: Record<string, number> = { buy: 0, rent: 0, invest: 0 };
    for (const l of this.leads()) map[l.category || 'buy']++;
    const total = this.leads().length || 1;
    return Object.entries(map).map(([cat, count]) => ({ cat, count, pct: Math.round(count / total * 100) }));
  });

  pipelineStages = computed(() => {
    const order: LeadStatus[] = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
    const total = this.leads().length || 1;
    return order.map(s => ({
      status: s,
      count: this.leads().filter(l => l.status === s).length,
      pct: Math.round(this.leads().filter(l => l.status === s).length / total * 100),
      color: this.dataSvc.leadStatuses().find(x => x.name === s)?.color ?? '#6b7280',
    }));
  });

  leadsThisMonth = computed(() => {
    const m = new Date().toISOString().slice(0, 7);
    return this.leads().filter(l => (l.createdDate || '').startsWith(m)).length;
  });

  activeLeads = computed(() =>
    this.leads().filter(l => !['won','lost'].includes(l.status)).length
  );

  // ── Multi-select location ─────────────────────────────
  selectedLocations = signal<string[]>([]);
  locationDropdownOpen = signal(false);

  toggleLocation(loc: string): void {
    this.selectedLocations.update(prev => {
      const next = prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc];
      this.updateForm({ location: next.join(', ') });
      return next;
    });
  }

  closeLocationDropdown(): void { this.locationDropdownOpen.set(false); }

  onLocationFocusOut(event: FocusEvent): void {
    const current = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (!related || !current.contains(related)) this.locationDropdownOpen.set(false);
  }

  // ── Import / Export ───────────────────────────────────
  importing     = signal(false);
  importError   = signal('');
  importSuccess = signal('');

  // Agent names from admin_users table (role=agent) + Unassigned
  agents = computed(() => [
    'Unassigned',
    ...this.dataSvc.users().filter(u => u.role === 'agent').map(u => u.name),
  ]);
  readonly leadStatusList = computed(() => this.dataSvc.leadStatuses().map(s => s.name));
  get statuses(): string[] { return this.leadStatusList(); }
  readonly sources:  LeadSource[]     = ['website', 'referral', 'walk_in', 'social_media', 'portal', 'cold_call'];
  readonly categories: LeadCategory[] = ['buy', 'rent', 'invest'];

  // ── Computed ──────────────────────────────────────────
  filteredList = computed(() => {
    const q    = this.search().toLowerCase();
    const st   = this.filterStatus();
    const src  = this.filterSource();
    const ag   = this.filterAgent();
    const from = this.filterDateFrom();
    const to   = this.filterDateTo();
    return this.leads().filter(l => {
      const matchQ    = !q   || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q) || l.location.toLowerCase().includes(q);
      const matchSt   = !st  || l.status === st;
      const matchSrc  = !src || l.source === src;
      const matchAg   = !ag  || l.assignedAgent === ag;
      const date      = l.createdDate || '';
      const matchFrom = q || !from || date >= from;
      const matchTo   = q || !to   || date <= to;
      return matchQ && matchSt && matchSrc && matchAg && matchFrom && matchTo;
    });
  });

  stats = computed(() => {
    const list = this.filteredList();
    const counts: Record<string, number> = { total: list.length };
    for (const s of this.dataSvc.leadStatuses()) {
      counts[s.name] = list.filter(l => l.status === s.name).length;
    }
    return counts;
  });

  statusColor(name: string): string {
    return this.dataSvc.leadStatuses().find(s => s.name === name)?.color ?? '#6b7280';
  }

  countByStatus(status: string): number {
    return this.leads().filter(l => l.status === status).length;
  }

  isPastStage(stage: string, currentStatus: string): boolean {
    const order = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
    const si = order.indexOf(stage);
    const ci = order.indexOf(currentStatus);
    return si < ci && currentStatus !== 'lost';
  }

  filtered = computed(() => {
    const col = this.sortCol();
    const dir = this.sortDir();
    return [...this.filteredList()].sort((a, b) => {
      const av = (a[col] ?? '') as string;
      const bv = (b[col] ?? '') as string;
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  paginated  = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    return this.filtered().slice((p - 1) * this.pageSize, p * this.pageSize);
  });

  // ── Sort / Filter ─────────────────────────────────────
  sort(col: keyof Lead): void {
    if (this.sortCol() === col) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
    this.page.set(1);
  }
  onSearch(): void { this.page.set(1); }
  onFilter(): void { this.page.set(1); }

  ngOnInit(): void {
    this.loadAllFollowUps();
    const leadIdParam = this.route.snapshot.queryParamMap.get('lead');
    if (leadIdParam) {
      const id = Number(leadIdParam);
      setTimeout(() => {
        const lead = this.leads().find(l => l.id === id);
        if (lead) this.openView(lead);
      }, 800);
    }
  }

  async loadAllFollowUps(): Promise<void> {
    this.allFollowUpRecordsLoading.set(true);
    const { data } = await this.sb
      .from('lead_follow_ups')
      .select('*')
      .order('follow_up_date', { ascending: true });
    this.rawFollowUpRows.set(data ?? []);
    this.allFollowUpRecordsLoading.set(false);
  }

  // ── Modal ─────────────────────────────────────────────
  openAdd(): void {
    this.form.set(EMPTY_FORM());
    this.formErrors.set({});
    this.saveError.set('');
    this.isEdit.set(false);
    this.editId.set(null);
    this.selectedLocations.set([]);
    this.locationDropdownOpen.set(false);
    this.showModal.set(true);
  }

  openEdit(lead: Lead): void {
    this.form.set({ ...lead });
    this.formErrors.set({});
    this.saveError.set('');
    this.isEdit.set(true);
    this.editId.set(lead.id);
    this.selectedLocations.set(lead.location ? lead.location.split(', ').filter(Boolean) : []);
    this.locationDropdownOpen.set(false);
    this.showModal.set(true);
  }

  openView(lead: Lead): void {
    this.viewLead.set(lead);
    this.viewTab.set('overview');
    this.viewFollowUps.set([]);
    this.showViewModal.set(true);
    this.loadViewFollowUps(lead.id);
  }

  private async loadViewFollowUps(leadId: number): Promise<void> {
    this.viewFollowUpsLoad.set(true);
    const { data, error } = await this.sb
      .from('lead_follow_ups')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    this.viewFollowUps.set(data ?? []);
    this.viewFollowUpsLoad.set(false);
  }

  closeViewModal(): void { this.showViewModal.set(false); }

  closeModal(): void { this.showModal.set(false); }

  async saveLead(): Promise<void> {
    const f = this.form();
    const errs: Record<string, string> = {};
    if (!f.name?.trim())     errs['name']     = 'Name is required.';
    if (f.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'Enter a valid email.';
    if (!f.phone?.trim())    errs['phone']    = 'Phone is required.';
    else if (!/^\+?[\d\s\-()]+$/.test(f.phone.trim()) || (f.phone.replace(/\D/g, '').length < 7 || f.phone.replace(/\D/g, '').length > 15)) errs['phone'] = 'Enter a valid phone number (7–15 digits).';
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const isEdit = this.editId() !== null;

    // Capture previous agent before saving (to detect assignment change)
    const prevLead = isEdit ? this.leads().find(l => l.id === this.editId()) : null;
    const prevAgent = prevLead?.assignedAgent ?? 'Unassigned';
    const newAgent  = f.assignedAgent ?? 'Unassigned';
    const agentChanged = isEdit && newAgent !== 'Unassigned' && newAgent !== prevAgent;

    const err = await this.dataSvc.saveLead(f, this.editId());
    this.saving.set(false);
    if (err) { this.toast.error(err); return; }
    this.showModal.set(false);
    this.toast.success(`Lead "${f.name}" ${isEdit ? 'updated' : 'created'} successfully.`);

    // Send email to newly assigned agent
    if (agentChanged) {
      const { data: agentProf } = await this.sb.from('profiles').select('email').eq('name', newAgent).eq('role', 'agent').maybeSingle();
      if (agentProf?.email) {
        this.emailSvc.send('agent_new_lead', {
          to_email:       agentProf.email,
          agent_name:     newAgent,
          customer_name:  f.name?.trim() ?? '',
          customer_phone: f.phone?.trim() ?? '',
          customer_email: f.email?.trim() ?? '',
          property_title: [f.propertyType, f.location].filter(Boolean).join(' — ') || 'Lead enquiry',
          message:        f.notes?.trim() ?? '',
        });
      }
    }

    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.logLeadAction(actor, role, isEdit ? 'Update Lead' : 'Add Lead', `Lead "${f.name}" ${isEdit ? 'updated' : 'created'}`);
  }

  confirmDelete(lead: Lead): void { this.deleteTarget.set(lead); this.showDeleteModal.set(true); }
  cancelDelete(): void { this.showDeleteModal.set(false); this.deleteTarget.set(null); }

  async doDelete(): Promise<void> {
    const t = this.deleteTarget();
    if (!t) return;
    await this.dataSvc.deleteLead(t.id);
    this.showDeleteModal.set(false);
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.logLeadAction(actor, role, 'Delete Lead', `Lead "${t.name}" deleted`, 'warning');
    this.deleteTarget.set(null);
  }

  updateForm(patch: Partial<Lead>): void { this.form.update(f => ({ ...f, ...patch })); }

  // ── Export ────────────────────────────────────────────
  exportToExcel(): void {
    const rows = this.leads().map(l => ({
      'Name':           l.name,
      'Email':          l.email,
      'Phone':          l.phone,
      'Status':         this.labelStatus(l.status),
      'Source':         this.labelSource(l.source),
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
    XLSX.writeFile(wb, `livwell-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  downloadSampleExcel(): void {
    const today = new Date().toISOString().slice(0, 10);
    const sample = [
      { 'Name': 'Sample Lead A', 'Email': 'sample.a@example.com', 'Phone': '+971521110001', 'Status': 'New', 'Source': 'Website', 'Category': 'buy', 'Budget': 'AED 2,000,000', 'Location': 'Dubai Marina', 'Property Type': 'Apartment', 'Assigned Agent': 'Unassigned', 'Notes': 'Looking for 2BR', 'Created Date': today, 'Last Contact': today },
      { 'Name': 'Sample Lead B', 'Email': 'sample.b@example.com', 'Phone': '+971521110002', 'Status': 'Contacted', 'Source': 'Referral', 'Category': 'rent', 'Budget': 'AED 120,000', 'Location': 'Business Bay', 'Property Type': 'Office', 'Assigned Agent': 'Unassigned', 'Notes': 'Needs office space', 'Created Date': today, 'Last Contact': today },
      { 'Name': 'Sample Lead C', 'Email': 'sample.c@example.com', 'Phone': '+971521110003', 'Status': 'New', 'Source': 'Cold Call', 'Category': 'invest', 'Budget': 'AED 5,000,000', 'Location': 'Downtown Dubai', 'Property Type': 'Villa', 'Assigned Agent': 'Unassigned', 'Notes': 'Investor looking for ROI', 'Created Date': today, 'Last Contact': today },
      { 'Name': 'Sample Lead D (dup phone)', 'Email': 'sample.d@example.com', 'Phone': '+971521110001', 'Status': 'New', 'Source': 'Website', 'Category': 'buy', 'Budget': 'AED 1,800,000', 'Location': 'JBR', 'Property Type': 'Apartment', 'Assigned Agent': 'Unassigned', 'Notes': 'Same phone as Lead A — this row will be used', 'Created Date': today, 'Last Contact': today },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'livwell-leads-sample.xlsx');
  }

  // ── Import ────────────────────────────────────────────
  async importFromExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.importing.set(true);
    this.importError.set('');
    this.importSuccess.set('');

    const buffer = await input.files[0].arrayBuffer();
    const wb     = XLSX.read(buffer, { type: 'array' });
    const rows   = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];

    if (!rows.length) {
      this.toast.error('No data found in the file.');
      this.importing.set(false);
      input.value = '';
      return;
    }

    const statusMap: Record<string, LeadStatus> = {
      'New': 'new', 'Contacted': 'contacted', 'Qualified': 'qualified',
      'Negotiating': 'negotiating', 'Won': 'won', 'Lost': 'lost',
    };
    const sourceMap: Record<string, LeadSource> = {
      'Website': 'website', 'Referral': 'referral', 'Walk-in': 'walk_in',
      'Social Media': 'social_media', 'Portal': 'portal', 'Cold Call': 'cold_call',
    };

    const normalisePhone = (p: string) => p.replace(/[\s\-().+]/g, '');

    // Step 1: map all valid rows
    const mapped = rows
      .filter(r => r['Name']?.toString().trim())
      .map(r => ({
        name:          r['Name']           || '',
        email:         r['Email']          || '',
        phone:         r['Phone']?.toString().trim() || '',
        status:        statusMap[r['Status']]   ?? 'new',
        source:        sourceMap[r['Source']]   ?? 'website',
        category:      (['buy','rent','invest'].includes(r['Category']) ? r['Category'] : 'buy') as LeadCategory,
        budget:        r['Budget']         || '',
        location:      r['Location']       || '',
        propertyType:  r['Property Type']  || '',
        assignedAgent: r['Assigned Agent'] || 'Unassigned',
        notes:         r['Notes']          || '',
        createdDate:   r['Created Date']   || new Date().toISOString().slice(0, 10),
        lastContact:   r['Last Contact']   || new Date().toISOString().slice(0, 10),
        followUpDate:  r['Follow-up Date'] || '',
        followUpNote:  r['Follow-up Note'] || '',
      }));

    // Step 2: deduplicate within the file by phone (keep last occurrence)
    const phoneToRow = new Map<string, typeof mapped[0]>();
    for (const r of mapped) {
      const key = normalisePhone(r.phone);
      if (key) phoneToRow.set(key, r); // overwrite keeps last
    }
    const noPhone = mapped.filter(r => !normalisePhone(r.phone));
    const afterFileDedupe = [...phoneToRow.values(), ...noPhone];
    const fileDupeCount = mapped.length - afterFileDedupe.length;

    // Step 3: deduplicate against existing leads in DB by phone
    const existingPhones = new Set(
      this.leads().map(l => normalisePhone(l.phone)).filter(Boolean)
    );
    const dbDupes  = afterFileDedupe.filter(r =>  existingPhones.has(normalisePhone(r.phone)));
    const toImport = afterFileDedupe.filter(r => !existingPhones.has(normalisePhone(r.phone)));
    const dbDupeCount = dbDupes.length;

    if (!toImport.length) {
      const dupeNames = dbDupes.map(r => r.name).join(', ');
      const msg = [
        fileDupeCount ? `${fileDupeCount} duplicate(s) removed from file` : '',
        dbDupeCount   ? `${dbDupeCount} already in system (${dupeNames})` : '',
      ].filter(Boolean).join(' · ');
      this.toast.error(`Nothing to import. ${msg}.`);
      this.importing.set(false);
      input.value = '';
      return;
    }

    const err = await this.dataSvc.importLeads(toImport);
    if (err) {
      this.toast.error('Import failed: ' + err);
    } else {
      const dupeNames = dbDupes.map(r => r.name).join(', ');
      const parts = [
        `${toImport.length} lead(s) imported`,
        fileDupeCount ? `${fileDupeCount} in-file duplicate(s) skipped` : '',
        dbDupeCount   ? `${dbDupeCount} already in system skipped (${dupeNames})` : '',
      ].filter(Boolean);
      this.toast.success(parts.join(' · '));
    }

    this.importing.set(false);
    input.value = '';
  }

  // ── Helpers ───────────────────────────────────────────
  labelStatus(s: string): string {
    const found = this.dataSvc.leadStatuses().find(ls => ls.name === s);
    return found ? found.name.charAt(0).toUpperCase() + found.name.slice(1) : s;
  }

  labelSource(s: string): string {
    return ({ website: 'Website', referral: 'Referral', walk_in: 'Walk-in', social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call' } as Record<string,string>)[s] ?? s;
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
  }
}
