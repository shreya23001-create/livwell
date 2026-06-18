import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { AdminDataService, LeadStatus, LeadSource, LeadCategory, Lead } from '../../shared/services/admin-data.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

export type { LeadStatus, LeadSource, LeadCategory, Lead };


const EMPTY_FORM = (): Partial<Lead> => ({
  name: '', email: '', phone: '', status: 'new', source: 'website', category: 'buy',
  budget: '', location: '', propertyType: '', assignedAgent: 'Unassigned', notes: '',
  createdDate: new Date().toISOString().slice(0, 10),
  lastContact: new Date().toISOString().slice(0, 10),
});

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-leads.component.html',
  styleUrl: './admin-leads.component.scss',
})
export class AdminLeadsComponent implements OnInit {

  dataSvc        = inject(AdminDataService);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private route  = inject(ActivatedRoute);
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

  // ── Import / Export ───────────────────────────────────
  importing     = signal(false);
  importError   = signal('');
  importSuccess = signal('');

  // Agent names from admin_users table (role=agent) + Unassigned
  agents = computed(() => [
    'Unassigned',
    ...this.dataSvc.users().filter(u => u.role === 'agent').map(u => u.name),
  ]);
  readonly statuses: LeadStatus[]     = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
  readonly sources:  LeadSource[]     = ['website', 'referral', 'walk_in', 'social_media', 'portal', 'cold_call'];
  readonly categories: LeadCategory[] = ['buy', 'rent', 'invest'];

  // ── Computed ──────────────────────────────────────────
  stats = computed(() => {
    const all = this.leads();
    return {
      total:       all.length,
      new:         all.filter(l => l.status === 'new').length,
      qualified:   all.filter(l => l.status === 'qualified').length,
      negotiating: all.filter(l => l.status === 'negotiating').length,
      won:         all.filter(l => l.status === 'won').length,
    };
  });

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const st  = this.filterStatus();
    const src = this.filterSource();
    const ag  = this.filterAgent();
    const col = this.sortCol();
    const dir = this.sortDir();

    let list = this.leads().filter(l => {
      const matchQ   = !q   || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q) || l.location.toLowerCase().includes(q);
      const matchSt  = !st  || l.status === st;
      const matchSrc = !src || l.source === src;
      const matchAg  = !ag  || l.assignedAgent === ag;
      return matchQ && matchSt && matchSrc && matchAg;
    });

    return [...list].sort((a, b) => {
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
    this.showModal.set(true);
  }

  openEdit(lead: Lead): void {
    this.form.set({ ...lead });
    this.formErrors.set({});
    this.saveError.set('');
    this.isEdit.set(true);
    this.editId.set(lead.id);
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
    if (!f.budget?.trim())   errs['budget']   = 'Budget is required.';
    if (!f.location?.trim()) errs['location'] = 'Location is required.';
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const isEdit = this.editId() !== null;
    const err = await this.dataSvc.saveLead(f, this.editId());
    this.saving.set(false);
    if (err) { this.toast.error(err); return; }
    this.showModal.set(false);
    this.toast.success(`Lead "${f.name}" ${isEdit ? 'updated' : 'created'} successfully.`);
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
      }));

    const err = await this.dataSvc.importLeads(toImport);
    if (err) this.toast.error('Import failed: ' + err);
    else     this.toast.success(`${toImport.length} lead(s) imported successfully.`);

    this.importing.set(false);
    input.value = '';
  }

  // ── Helpers ───────────────────────────────────────────
  labelStatus(s: LeadStatus): string {
    return { new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' }[s];
  }

  labelSource(s: LeadSource): string {
    return { website: 'Website', referral: 'Referral', walk_in: 'Walk-in', social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call' }[s];
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
  }
}
