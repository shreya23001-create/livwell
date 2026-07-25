import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  imports: [PhoneInputComponent, CommonModule, FormsModule, RichEditorComponent],
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
  showViewModal = signal(false);
  viewLead      = signal<Lead | null>(null);

  // ── Tabs ─────────────────────────────────────────────
  activeTab = signal<'dashboard' | 'leads'>('dashboard');

  // ── Dashboard computed ────────────────────────────────
  today = new Date().toISOString().slice(0, 10);

  followUps = computed(() =>
    this.leads()
      .filter(l => l.followUpDate)
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
  );

  overdueFollowUps = computed(() =>
    this.followUps().filter(l => l.followUpDate < this.today)
  );

  todayFollowUps = computed(() =>
    this.followUps().filter(l => l.followUpDate === this.today)
  );

  upcomingFollowUps = computed(() =>
    this.followUps().filter(l => l.followUpDate > this.today)
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
    const q   = this.search().toLowerCase();
    const st  = this.filterStatus();
    const src = this.filterSource();
    const ag  = this.filterAgent();
    return this.leads().filter(l => {
      const matchQ   = !q   || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q) || l.location.toLowerCase().includes(q);
      const matchSt  = !st  || l.status === st;
      const matchSrc = !src || l.source === src;
      const matchAg  = !ag  || l.assignedAgent === ag;
      return matchQ && matchSt && matchSrc && matchAg;
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
    const leadIdParam = this.route.snapshot.queryParamMap.get('lead');
    if (leadIdParam) {
      const id = Number(leadIdParam);
      setTimeout(() => {
        const lead = this.leads().find(l => l.id === id);
        if (lead) this.openView(lead);
      }, 800);
    }
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
    this.showViewModal.set(true);
  }

  closeViewModal(): void { this.showViewModal.set(false); }

  closeModal(): void { this.showModal.set(false); }

  async saveLead(): Promise<void> {
    const f = this.form();
    const errs: Record<string, string> = {};
    if (!f.name?.trim())     errs['name']     = 'Name is required.';
    if (!f.email?.trim())    errs['email']    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'Enter a valid email.';
    if (!f.phone?.trim())    errs['phone']    = 'Phone is required.';
    else if (!/^\+?[\d\s\-()]+$/.test(f.phone.trim()) || (f.phone.replace(/\D/g, '').length < 7 || f.phone.replace(/\D/g, '').length > 15)) errs['phone'] = 'Enter a valid phone number (7–15 digits).';
    if (!f.location?.trim()) errs['location'] = 'Location is required.';
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
    const sample = [
      { 'Name': 'John Smith', 'Email': 'john@example.com', 'Phone': '+971501234567', 'Status': 'New', 'Source': 'Website', 'Category': 'buy', 'Budget': 'AED 2,000,000', 'Location': 'Dubai Marina', 'Property Type': 'Apartment', 'Assigned Agent': 'Unassigned', 'Notes': 'Looking for 2BR', 'Created Date': '2026-06-01', 'Last Contact': '2026-06-01' },
      { 'Name': 'Sara Ali', 'Email': 'sara@example.com', 'Phone': '+971509876543', 'Status': 'Contacted', 'Source': 'Referral', 'Category': 'rent', 'Budget': 'AED 120,000', 'Location': 'Business Bay', 'Property Type': 'Office', 'Assigned Agent': 'Unassigned', 'Notes': '', 'Created Date': '2026-06-02', 'Last Contact': '2026-06-03' },
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

    const toImport = rows
      .filter(r => r['Name']?.toString().trim())
      .map(r => ({
        name:          r['Name']           || '',
        email:         r['Email']          || '',
        phone:         r['Phone']          || '',
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

    const err = await this.dataSvc.importLeads(toImport);
    if (err) this.toast.error('Import failed: ' + err);
    else     this.toast.success(`${toImport.length} lead(s) imported successfully.`);

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
