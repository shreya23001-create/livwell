import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, OnInit, OnDestroy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';
import { AdminDataService } from '../../shared/services/admin-data.service';
import * as XLSX from 'xlsx';


interface LeadMessage {
  id: number;
  senderRole: 'customer' | 'agent';
  senderName: string;
  content: string;
  createdAt: string;
}


export type LeadStatus = string;

export interface AgentLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  category: string;
  budget: string;
  location: string;
  propertyType: string;
  propertyTitle: string;
  propertyId: number | null;
  projectId: number | null;
  projectTitle: string;
  source: string;
  notes: string;
  agentReply: string;
  lastContact: string;
  createdDate: string;
  customerId?: string | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  priority?: string;
}


const EMPTY_FORM = (): Partial<AgentLead> => ({
  name: '', email: '', phone: '', status: 'new', category: 'Buy',
  budget: '', location: '', propertyType: '', propertyTitle: '', propertyId: null,
  projectId: null, projectTitle: '',
  source: 'website', notes: '', agentReply: '',
  createdDate: new Date().toISOString().slice(0, 10),
  lastContact: new Date().toISOString().slice(0, 10),
  priority: 'medium',
});

@Component({
  selector: 'app-agent-leads',
  standalone: true,
  imports: [PhoneInputComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './agent-leads.component.html',
  styleUrl: './agent-leads.component.scss',
})
export class AgentLeadsComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private sb      = inject(SupabaseService).client;
  private toast   = inject(ToastService);
  private router  = inject(Router);
  dataSvc = inject(AdminDataService);

  private realtimeSub: any    = null;
  private msgRealtimeSub: any = null;

  leads        = signal<AgentLead[]>([]);
  search       = signal('');
  filterStatus = signal<LeadStatus | ''>('');
  filterType   = signal<'all' | 'property' | 'project'>('all');
  sortCol      = signal<keyof AgentLead>('createdDate');
  sortDir      = signal<'asc' | 'desc'>('desc');
  loading      = signal(true);

  page       = signal(1);
  pageSize   = 50;
  filterDateFrom = signal('');
  filterDateTo   = signal('');
  saving       = signal(false);
  saveError    = signal('');

  showModal       = signal(false);
  isEdit          = signal(false);
  editId          = signal<number | null>(null);
  form            = signal<Partial<AgentLead>>(EMPTY_FORM());
  formErrors      = signal<Record<string, string>>({});
  showDeleteModal = signal(false);
  deleteTarget    = signal<AgentLead | null>(null);
  quickStatusId   = signal<number | null>(null);

  // Messages
  modalMessages = signal<LeadMessage[]>([]);
  msgLoading    = signal(false);
  newMessage    = signal('');
  sendingMsg    = signal(false);

  readonly priorities = ['low', 'medium', 'high', 'urgent'];

  // ── Tabs ─────────────────────────────────────────────
  activeTab  = signal<'leads' | 'followup'>('leads');
  fuFilter   = signal<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  today      = new Date().toISOString().slice(0, 10);

  // All follow-up records from lead_follow_ups enriched with lead info
  allFollowUpRecords        = signal<any[]>([]);
  allFollowUpRecordsLoading = signal(false);

  // ── Edit follow-up modal ──────────────────────────────
  showEditFuModal  = signal(false);
  editFuRecord     = signal<any>(null);
  editFuDate       = signal('');
  editFuTime       = signal('');
  editFuRemarks    = signal('');
  editFuStatus     = signal('');
  savingEditFu     = signal(false);
  readonly fuStatusOptions = ['pending', 'done', 'missed', 'cancelled'];

  // ── Import ────────────────────────────────────────────
  importing = signal(false);

  downloadSampleExcel(): void {
    const today = new Date().toISOString().slice(0, 10);
    const sample = [
      { 'Name': 'Sample Lead A', 'Email': 'sample.a@example.com', 'Phone': '+971521110001', 'Status': 'New',       'Source': 'Website',  'Category': 'buy',    'Budget': 'AED 2,000,000', 'Location': 'Dubai Marina',     'Property Type': 'Apartment', 'Notes': '', 'Created Date': today },
      { 'Name': 'Sample Lead B', 'Email': 'sample.b@example.com', 'Phone': '+971521110002', 'Status': 'Contacted', 'Source': 'Referral', 'Category': 'rent',   'Budget': 'AED 120,000',   'Location': 'Business Bay',     'Property Type': 'Office',    'Notes': 'Needs office space', 'Created Date': today },
      { 'Name': 'Sample Lead C', 'Email': 'sample.c@example.com', 'Phone': '+971521110003', 'Status': 'New',       'Source': 'Cold Call','Category': 'invest', 'Budget': 'AED 5,000,000', 'Location': 'Downtown Dubai',   'Property Type': 'Villa',     'Notes': 'Investor', 'Created Date': today },
      { 'Name': 'Sample Lead D (dup of A)', 'Email': 'sample.d@example.com', 'Phone': '+971521110001', 'Status': 'New', 'Source': 'Website', 'Category': 'buy', 'Budget': 'AED 2,200,000', 'Location': 'JBR', 'Property Type': 'Apartment', 'Notes': 'Same phone as A — this row wins', 'Created Date': today },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'livwell-leads-sample.xlsx');
  }

  async importFromExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.importing.set(true);

    const buffer = await input.files[0].arrayBuffer();
    const wb     = XLSX.read(buffer, { type: 'array' });
    const rows   = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    input.value  = '';

    if (!rows.length) { this.toast.error('No data found in the file.'); this.importing.set(false); return; }

    const statusMap: Record<string, string> = Object.fromEntries(
      this.dataSvc.leadStatuses().map(s => [s.name.charAt(0).toUpperCase() + s.name.slice(1), s.name])
    );
    const sourceMap: Record<string, string> = {
      'Website': 'website', 'Referral': 'referral', 'Walk-in': 'walk_in',
      'Social Media': 'social_media', 'Portal': 'portal', 'Cold Call': 'cold_call',
    };
    const normalisePhone = (p: string) => p?.toString().replace(/[\s\-().+]/g, '') ?? '';
    const agentName  = this.auth.currentUser()?.name  ?? '';
    const agentEmail = this.auth.currentUser()?.email ?? '';
    const today      = new Date().toISOString().slice(0, 10);

    // Map rows
    const mapped = rows
      .filter(r => r['Name']?.toString().trim())
      .map(r => ({
        name:          r['Name']          || '',
        email:         r['Email']         || '',
        phone:         r['Phone']?.toString().trim() || '',
        status:        statusMap[r['Status']]  ?? 'new',
        source:        sourceMap[r['Source']]  ?? 'website',
        category:      (['buy','rent','invest'].includes(r['Category']) ? r['Category'] : 'buy'),
        budget:        r['Budget']        || '',
        location:      r['Location']      || '',
        propertyType:  r['Property Type'] || '',
        assignedAgent: agentName || 'Unassigned',
        notes:         r['Notes']         || '',
        createdDate:   r['Created Date']  || today,
        lastContact:   r['Created Date']  || today,
        followUpDate:  r['Follow-up Date'] || '',
        followUpNote:  r['Follow-up Note'] || '',
      }));

    // Dedup within file — last occurrence per phone wins
    const phoneToRow = new Map<string, typeof mapped[0]>();
    for (const r of mapped) {
      const key = normalisePhone(r.phone);
      if (key) phoneToRow.set(key, r);
    }
    const noPhone = mapped.filter(r => !normalisePhone(r.phone));
    const afterFileDedupe = [...phoneToRow.values(), ...noPhone];
    const fileDupeCount = mapped.length - afterFileDedupe.length;

    // Dedup against existing leads in DB
    const existingPhones = new Set(this.leads().map(l => normalisePhone(l.phone)).filter(Boolean));
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
      return;
    }

    // Insert into admin_leads
    const rows2insert = toImport.map(l => ({
      name: l.name, email: l.email || null, phone: l.phone || null,
      status: l.status, source: l.source, category: l.category,
      budget: l.budget || null, location: l.location || null,
      property_type: l.propertyType || null, notes: l.notes || null,
      assigned_agent: agentName, agent_email: agentEmail,
      created_at: l.createdDate ? new Date(l.createdDate).toISOString() : new Date().toISOString(),
      follow_up_date: l.followUpDate || null, follow_up_note: l.followUpNote || null,
    }));

    const { data: inserted, error } = await this.sb.from('admin_leads').insert(rows2insert).select('id, follow_up_date, follow_up_note, status');
    if (error) {
      this.toast.error('Import failed: ' + error.message);
      this.importing.set(false);
      return;
    }

    // Insert lead_follow_ups for any with follow_up_date
    const fuRows = (inserted ?? [])
      .filter((r: any) => r.follow_up_date)
      .map((r: any) => ({ lead_id: r.id, follow_up_date: r.follow_up_date, remarks: r.follow_up_note || null, status: r.status || 'new', created_by: agentName || agentEmail }));
    if (fuRows.length) await this.sb.from('lead_follow_ups').insert(fuRows);

    const dupeNames = dbDupes.map(r => r.name).join(', ');
    const parts = [
      `${toImport.length} lead(s) imported`,
      fileDupeCount ? `${fileDupeCount} in-file duplicate(s) skipped` : '',
      dbDupeCount   ? `${dbDupeCount} already in system skipped (${dupeNames})` : '',
    ].filter(Boolean);
    this.toast.success(parts.join(' · '));

    const user = this.auth.currentUser();
    if (user) await this.fetchLeads(user.email ?? '', user.name ?? '');
    this.importing.set(false);
  }

  followUps = computed(() =>
    this.leads().filter(l => l.followUpDate && !['won','lost'].includes(l.status)).sort((a, b) => (a.followUpDate ?? '').localeCompare(b.followUpDate ?? ''))
  );

  private get activeFollowUpRecords(): any[] {
    return this.allFollowUpRecords().filter(r => !['won','lost'].includes(r.lead?.status));
  }

  // Deduplicate records by lead — keep the "best" record per lead for each bucket.
  // all/overdue: most recent date (latest overdue); today: latest created; upcoming: earliest date.
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
      this.activeFollowUpRecords.filter(r => r.follow_up_date), 'latest'
    );
    return new Set(latest.filter(r => r.follow_up_date > this.today).map(r => r.lead_id));
  });

  overdueFollowUps  = computed(() => this.dedupeByLead(
    this.activeFollowUpRecords.filter(r =>
      r.follow_up_date && r.follow_up_date < this.today &&
      !this.leadsWithUpcoming().has(r.lead_id)
    ), 'latest'
  ));
  todayFollowUps    = computed(() => this.dedupeByLead(
    this.activeFollowUpRecords.filter(r =>
      r.follow_up_date === this.today &&
      !this.leadsWithUpcoming().has(r.lead_id)
    ), 'latest'
  ));
  upcomingFollowUps = computed(() => this.dedupeByLead(
    this.activeFollowUpRecords.filter(r => r.follow_up_date && r.follow_up_date > this.today), 'earliest'
  ));
  latestFollowUpPerLead = computed(() => this.dedupeByLead(
    this.activeFollowUpRecords.filter(r => r.follow_up_date), 'latest'
  ));

  filteredFollowUps = computed(() => {
    const f = this.fuFilter();
    if (f === 'overdue')  return this.overdueFollowUps();
    if (f === 'today')    return this.todayFollowUps();
    if (f === 'upcoming') return this.upcomingFollowUps();
    return this.latestFollowUpPerLead();
  });


  readonly leadStatusList = computed(() => this.dataSvc.leadStatuses().map(s => s.name as LeadStatus));
  get statuses(): LeadStatus[] { return this.leadStatusList(); }
  readonly categories = ['Buy', 'Rent'];
  readonly sources    = ['website', 'referral', 'walk_in', 'social_media', 'portal', 'cold_call'];
  readonly sourceLabel: Record<string, string> = {
    website: 'Website', referral: 'Referral', walk_in: 'Walk-in',
    social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call',
  };

  // Location dropdown
  locDropOpen  = signal(false);
  locSearch    = signal('');
  filteredLocations = computed(() => {
    const q = this.locSearch().toLowerCase();
    const locs = this.dataSvc.locations();
    return q ? locs.filter(l => l.toLowerCase().includes(q)) : locs;
  });

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.loc-dropdown-wrap')) {
      this.locDropOpen.set(false);
    }
  }

  selectLocation(loc: string) {
    this.updateForm({ location: loc });
    this.locDropOpen.set(false);
    this.locSearch.set('');
  }

  readonly statusTimeline = computed(() =>
    this.dataSvc.leadStatuses().map(s => ({
      status: s.name as LeadStatus,
      label:  s.name.charAt(0).toUpperCase() + s.name.slice(1),
      color:  s.color,
    }))
  );

  stats = computed(() => {
    const a = this.leads();
    const counts: Record<string, number> = { total: a.length };
    for (const s of this.dataSvc.leadStatuses()) {
      counts[s.name] = a.filter(l => l.status === s.name).length;
    }
    return counts;
  });

  filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const st   = this.filterStatus();
    const tp   = this.filterType();
    const from = this.filterDateFrom();
    const to   = this.filterDateTo();
    let list = this.leads().filter(l => {
      const mq   = !q  || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || (l.phone || '').toLowerCase().includes(q);
      const mst  = !st || l.status === st;
      const mtp  = tp === 'all' || (tp === 'property' ? !!l.propertyTitle : !!l.projectTitle);
      const date = l.createdDate?.slice(0, 10) ?? '';
      const mfrom = !from || date >= from;
      const mto   = !to   || date <= to;
      return mq && mst && mtp && mfrom && mto;
    });
    const col = this.sortCol();
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      const av = String(a[col]); const bv = String(b[col]);
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedLeads = computed(() => {
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
    const agentEmail = user.email;
    const agentName  = user.name;
    this.dataSvc.loadMasterData();
    await this.fetchLeads(agentEmail, agentName);
    this.loadAllFollowUps();
    this.subscribeRealtime(agentEmail, agentName);
  }

  async loadAllFollowUps(): Promise<void> {
    this.allFollowUpRecordsLoading.set(true);
    const leadIds = this.leads().map(l => l.id);
    if (!leadIds.length) { this.allFollowUpRecordsLoading.set(false); return; }
    const { data } = await this.sb
      .from('lead_follow_ups')
      .select('*')
      .in('lead_id', leadIds)
      .order('follow_up_date', { ascending: true });

    const leadsMap = new Map(this.leads().map(l => [l.id, l]));
    const records: any[] = (data ?? []).map(r => ({ ...r, lead: leadsMap.get(r.lead_id) ?? null }));

    // Leads that have a follow_up_date on admin_leads but no row in lead_follow_ups yet
    const leadsWithHistory = new Set((data ?? []).map((r: any) => r.lead_id));
    for (const lead of this.leads()) {
      if (lead.followUpDate && !leadsWithHistory.has(lead.id)) {
        records.push({
          id:             `fallback-${lead.id}`,
          lead_id:        lead.id,
          follow_up_date: lead.followUpDate,
          follow_up_time: null,
          remarks:        lead.followUpNote || null,
          status:         lead.status,
          created_by:     'Admin',
          created_at:     lead.createdDate,
          lead,
        });
      }
    }

    records.sort((a, b) => (a.follow_up_date ?? '').localeCompare(b.follow_up_date ?? ''));
    this.allFollowUpRecords.set(records);
    this.allFollowUpRecordsLoading.set(false);
  }

  ngOnDestroy(): void {
    if (this.realtimeSub)    this.sb.removeChannel(this.realtimeSub);
    if (this.msgRealtimeSub) this.sb.removeChannel(this.msgRealtimeSub);
  }

  private async fetchLeads(agentEmail: string, agentName: string): Promise<void> {
    const { data: byEmail } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, notes, agent_reply, assigned_agent, agent_email, created_at, location, property_type, property_title, property_id, project_id, project_title, budget, customer_id, follow_up_date, follow_up_note, priority')
      .eq('agent_email', agentEmail)
      .order('created_at', { ascending: false });

    const { data: byName } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, notes, agent_reply, assigned_agent, agent_email, created_at, location, property_type, property_title, property_id, project_id, project_title, budget, customer_id, follow_up_date, follow_up_note, priority')
      .eq('assigned_agent', agentName)
      .is('agent_email', null)
      .order('created_at', { ascending: false });

    const combined = [...(byEmail ?? []), ...(byName ?? [])];
    const seen = new Set<number>();
    const unique = combined.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
    this.leads.set(unique.map((r: any) => this.mapRow(r)));
    this.loading.set(false);
  }

  private subscribeRealtime(agentEmail: string, agentName: string): void {
    this.realtimeSub = this.sb
      .channel('agent-leads-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'admin_leads', filter: `agent_email=eq.${agentEmail}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            this.leads.update(list => [this.mapRow(payload.new), ...list]);
          } else if (payload.eventType === 'UPDATE') {
            this.leads.update(list => list.map(l => l.id === payload.new.id ? this.mapRow(payload.new) : l));
          } else if (payload.eventType === 'DELETE') {
            this.leads.update(list => list.filter(l => l.id !== payload.old.id));
          }
        })
      .subscribe();
  }

  private mapRow(r: any): AgentLead {
    return {
      id:            r.id,
      name:          r.name           || '',
      email:         r.email          || '',
      phone:         r.phone          || '',
      status:        (r.status        || 'new') as LeadStatus,
      category:      r.category       || 'Buy',
      budget:        r.budget         || '',
      location:      r.location       || '',
      propertyType:  r.property_type  || '',
      propertyTitle: r.property_title || '',
      propertyId:    r.property_id    ?? null,
      projectId:     r.project_id     ?? null,
      projectTitle:  r.project_title  || '',
      source:        r.source         || 'Website',
      notes:         r.notes          || '',
      agentReply:    r.agent_reply    || '',
      lastContact:   r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      createdDate:   r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      customerId:    r.customer_id    ?? null,
      followUpDate:  r.follow_up_date ?? null,
      followUpNote:  r.follow_up_note ?? null,
      priority:      r.priority       || 'medium',
    };
  }

  sort(col: keyof AgentLead): void {
    if (this.sortCol() === col) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
  }

  // ── Edit / Add Modal ─────────────────────────────────────
  openAdd(): void {
    this.form.set(EMPTY_FORM()); this.formErrors.set({}); this.isEdit.set(false);
    this.editId.set(null); this.modalMessages.set([]); this.newMessage.set('');
    this.showModal.set(true);
  }

  openEdit(l: AgentLead): void {
    this.form.set({ ...l }); this.formErrors.set({}); this.isEdit.set(true);
    this.editId.set(l.id); this.modalMessages.set([]); this.newMessage.set('');
    this.showModal.set(true);
    this.loadModalMessages(l.id);
  }

  closeModal(): void {
    this.showModal.set(false); this.saveError.set('');
    if (this.msgRealtimeSub) { this.sb.removeChannel(this.msgRealtimeSub); this.msgRealtimeSub = null; }
  }

  private async loadModalMessages(leadId: number): Promise<void> {
    this.msgLoading.set(true);
    const [leadRes, msgsRes] = await Promise.all([
      this.sb.from('admin_leads').select('notes, agent_reply, assigned_agent, created_at').eq('id', leadId).single(),
      this.sb.from('lead_messages').select('id, sender_role, sender_name, content, created_at').eq('lead_id', leadId).order('created_at', { ascending: true }),
    ]);
    const legacy: LeadMessage[] = [];
    if (leadRes.data?.notes) legacy.push({
      id: -(leadId * 10 + 1), senderRole: 'customer', senderName: 'Customer',
      content: leadRes.data.notes, createdAt: this.fmtDate(leadRes.data.created_at),
    });
    if (leadRes.data?.agent_reply) legacy.push({
      id: -(leadId * 10 + 2), senderRole: 'agent', senderName: leadRes.data.assigned_agent || 'Agent',
      content: leadRes.data.agent_reply, createdAt: this.fmtDate(leadRes.data.created_at),
    });
    const fresh = (msgsRes.data ?? []).map(this.mapMsg);
    this.modalMessages.set([...legacy, ...fresh]);
    this.msgLoading.set(false);
    this.subscribeModalMsgs(leadId);
  }

  private subscribeModalMsgs(leadId: number): void {
    if (this.msgRealtimeSub) this.sb.removeChannel(this.msgRealtimeSub);
    this.msgRealtimeSub = this.sb
      .channel(`agent-lead-msgs-${leadId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_messages', filter: `lead_id=eq.${leadId}` },
        (payload: any) => {
          const msg = this.mapMsg(payload.new);
          const exists = this.modalMessages().some(m => m.id === msg.id);
          if (!exists) this.modalMessages.update(list => [...list, msg]);
        })
      .subscribe();
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage().trim();
    const leadId = this.editId();
    if (!text || !leadId) return;
    const user = this.auth.currentUser();
    if (!user) return;
    this.sendingMsg.set(true);
    const { error } = await this.sb.from('lead_messages').insert({
      lead_id: leadId, sender_role: 'agent', sender_name: user.name || user.email, content: text,
    });
    if (!error) {
      this.newMessage.set('');
      await this.loadModalMessages(leadId);
      // Notify the customer — use customerId directly or look up by email
      const lead = this.leads().find(l => l.id === leadId);
      if (lead) {
        let custId = lead.customerId ?? null;
        if (!custId && lead.email) {
          const { data: prof } = await this.sb.from('profiles').select('id').eq('email', lead.email).maybeSingle();
          custId = prof?.id ?? null;
        }
        if (custId) {
          const { error: nErr } = await this.sb.from('notifications').insert({
            user_id: custId,
            title:   `Reply from ${user.name || 'your agent'}`,
            message: text.length > 120 ? text.slice(0, 120) + '…' : text,
            type:    lead.propertyTitle || lead.projectTitle || 'Enquiry',
            read:    false,
          });
          if (nErr) console.error('[notif insert error]', nErr);
        }
      }
    }
    this.sendingMsg.set(false);
  }

  onMsgEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  updateForm(p: Partial<AgentLead>): void { this.form.update(f => ({ ...f, ...p })); }

  async save(): Promise<void> {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.name?.trim())     e['name']     = 'Required.';
    if (f.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e['email'] = 'Enter a valid email.';
    if (!f.phone?.trim())    e['phone']    = 'Required.';
    else if (!/^\+?[\d\s\-()]+$/.test(f.phone.trim()) || (f.phone.replace(/\D/g, '').length < 7 || f.phone.replace(/\D/g, '').length > 15)) e['phone'] = 'Enter a valid phone number (7–15 digits).';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const agentName  = this.auth.currentUser()?.name  ?? '';
    const agentEmail = this.auth.currentUser()?.email ?? '';

    if (this.isEdit() && this.editId() !== null) {
      // Edit: never overwrite customer contact info
      const editPayload = {
        status: f.status || 'new', budget: f.budget!.trim(), location: f.location!.trim(),
        property_type: f.propertyType || '', source: f.source || 'website',
        notes: f.notes || '', agent_reply: f.agentReply || null,
        project_id: f.projectId || null, project_title: f.projectTitle || null,
        property_title: f.propertyTitle || null,
        assigned_agent: agentName, agent_email: agentEmail,
      };
      const { error } = await this.sb.from('admin_leads').update(editPayload).eq('id', this.editId()!);
      if (error) { this.toast.error('Failed to save. Please try again.'); this.saving.set(false); return; }
      this.leads.update(list => list.map(l => l.id === this.editId() ? { ...l, ...f, propertyType: f.propertyType || l.propertyType } as AgentLead : l));
    } else {
      const addPayload = {
        name: f.name!.trim(), email: f.email!.trim(), phone: f.phone!.trim(),
        status: f.status || 'new', budget: f.budget!.trim(), location: f.location!.trim(),
        property_type: f.propertyType || '', source: f.source || 'website',
        notes: f.notes || '', agent_reply: f.agentReply || null,
        project_id: f.projectId || null, project_title: f.projectTitle || null,
        property_title: f.propertyTitle || null,
        assigned_agent: agentName, agent_email: agentEmail,
      };
      const { data, error } = await this.sb.from('admin_leads').insert(addPayload).select().single();
      if (error) { this.saveError.set(error.message); this.toast.error('Failed to add lead: ' + error.message); this.saving.set(false); return; }
      if (data) this.leads.update(list => [this.mapRow(data), ...list]);
    }
    this.saving.set(false);
    this.showModal.set(false);
    this.toast.success(this.editId() !== null ? 'Lead updated.' : 'Lead added.');
  }

  async quickUpdateStatus(lead: AgentLead, newStatus: LeadStatus): Promise<void> {
    this.quickStatusId.set(null);
    const agentEmail = this.auth.currentUser()?.email ?? '';
    const { error } = await this.sb.from('admin_leads')
      .update({ status: newStatus, agent_email: agentEmail }).eq('id', lead.id);
    if (!error) {
      this.leads.update(list => list.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    }
  }

  confirmDelete(l: AgentLead): void { this.deleteTarget.set(l); this.showDeleteModal.set(true); }
  cancelDelete(): void { this.showDeleteModal.set(false); this.deleteTarget.set(null); }

  async doDelete(): Promise<void> {
    const t = this.deleteTarget();
    if (!t) return;
    await this.sb.from('admin_leads').delete().eq('id', t.id);
    this.leads.update(list => list.filter(l => l.id !== t.id));
    this.cancelDelete();
  }

  labelStatus(s: string): string {
    const found = this.dataSvc.leadStatuses().find(ls => ls.name === s);
    return found ? found.name.charAt(0).toUpperCase() + found.name.slice(1) : s;
  }

  formatPrice(n: number): string {
    if (!n) return 'AED —';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  // ── Open lead detail page ─────────────────────────────
  openDetail(l: AgentLead): void {
    this.router.navigate(['/agent/leads', l.id]);
  }

  openProfile(l: AgentLead): void {
    this.router.navigate(['/agent/leads', l.id]);
  }

  // ── Edit follow-up ────────────────────────────────────
  openEditFu(r: any): void {
    this.editFuRecord.set(r);
    this.editFuDate.set(r.follow_up_date ?? '');
    this.editFuTime.set(r.follow_up_time ?? '');
    this.editFuRemarks.set(r.remarks ?? '');
    this.editFuStatus.set(r.status ?? 'pending');
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
      // No real row exists — insert one and sync admin_leads
      const agentName = this.auth.currentUser()?.name || this.auth.currentUser()?.email || 'Agent';
      const res = await this.sb.from('lead_follow_ups').insert({
        lead_id:        rec.lead_id,
        follow_up_date: date,
        follow_up_time: time || null,
        remarks:        remarks || null,
        status,
        created_by:     agentName,
      });
      error = res.error;
      if (!error) {
        await this.sb.from('admin_leads')
          .update({ follow_up_date: date, follow_up_note: remarks || null })
          .eq('id', rec.lead_id);
      }
    } else {
      const res = await this.sb.from('lead_follow_ups').update({
        follow_up_date: date,
        follow_up_time: time || null,
        remarks:        remarks || null,
        status,
      }).eq('id', rec.id);
      error = res.error;
      if (!error) {
        // Also sync admin_leads.follow_up_date if this is the latest for that lead
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

  private fmtDate(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }) +
           ' · ' + new Date(ts).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
  }

  private mapMsg = (r: any): LeadMessage => ({
    id: r.id, senderRole: r.sender_role, senderName: r.sender_name,
    content: r.content, createdAt: this.fmtDate(r.created_at),
  });
}
