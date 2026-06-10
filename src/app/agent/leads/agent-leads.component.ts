import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface LeadMessage {
  id: number;
  senderRole: 'customer' | 'agent';
  senderName: string;
  content: string;
  createdAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';

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
  source: string;
  notes: string;
  agentReply: string;
  lastContact: string;
  createdDate: string;
}

const EMPTY_FORM = (): Partial<AgentLead> => ({
  name: '', email: '', phone: '', status: 'new', category: 'Buy',
  budget: '', location: '', propertyType: '', propertyTitle: '', propertyId: null,
  source: 'Website', notes: '', agentReply: '',
  createdDate: new Date().toISOString().slice(0, 10),
  lastContact: new Date().toISOString().slice(0, 10),
});

@Component({
  selector: 'app-agent-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-leads.component.html',
  styleUrl: './agent-leads.component.scss',
})
export class AgentLeadsComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  private realtimeSub: any = null;
  private msgRealtimeSub: any = null;

  leads        = signal<AgentLead[]>([]);
  search       = signal('');
  filterStatus = signal<LeadStatus | ''>('');
  sortCol      = signal<keyof AgentLead>('createdDate');
  sortDir      = signal<'asc' | 'desc'>('desc');
  loading      = signal(true);
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
  modalMessages  = signal<LeadMessage[]>([]);
  msgLoading     = signal(false);
  newMessage     = signal('');
  sendingMsg     = signal(false);

  readonly statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
  readonly categories = ['Buy', 'Rent', 'Invest'];
  readonly sources    = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Portal', 'Cold Call'];

  stats = computed(() => {
    const a = this.leads();
    return {
      total:  a.length,
      new:    a.filter(l => l.status === 'new').length,
      active: a.filter(l => ['contacted', 'qualified', 'negotiating'].includes(l.status)).length,
      won:    a.filter(l => l.status === 'won').length,
    };
  });

  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const st = this.filterStatus();
    let list = this.leads().filter(l => {
      const mq  = !q  || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
      const mst = !st || l.status === st;
      return mq && mst;
    });
    const col = this.sortCol();
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      const av = String(a[col]); const bv = String(b[col]);
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  });

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user) { this.loading.set(false); return; }
    // Match by email (unique) OR name — email is stored in agent_email column if present, else fall back to name
    const agentEmail = user.email;
    const agentName  = user.name;
    await this.fetchLeads(agentEmail, agentName);
    this.subscribeRealtime(agentEmail, agentName);
  }

  ngOnDestroy(): void {
    if (this.realtimeSub)    this.sb.removeChannel(this.realtimeSub);
    if (this.msgRealtimeSub) this.sb.removeChannel(this.msgRealtimeSub);
  }

  private async fetchLeads(agentEmail: string, agentName: string): Promise<void> {
    // Try matching by email first, then by name — handles both old and new leads
    const { data: byEmail } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, notes, agent_reply, assigned_agent, agent_email, created_at, location, property_type, property_title, property_id, budget')
      .eq('agent_email', agentEmail)
      .order('created_at', { ascending: false });

    const { data: byName } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, notes, agent_reply, assigned_agent, agent_email, created_at, location, property_type, property_title, property_id, budget')
      .eq('assigned_agent', agentName)
      .is('agent_email', null)
      .order('created_at', { ascending: false });

    const combined = [...(byEmail ?? []), ...(byName ?? [])];
    // Deduplicate by id
    const seen = new Set<number>();
    const unique = combined.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
    this.leads.set(unique.map((r: any) => this.mapRow(r)));
    this.loading.set(false);
  }

  private subscribeRealtime(agentEmail: string, agentName: string): void {
    this.realtimeSub = this.sb
      .channel('agent-leads-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_leads', filter: `agent_email=eq.${agentEmail}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            this.leads.update(list => [this.mapRow(payload.new), ...list]);
          } else if (payload.eventType === 'UPDATE') {
            this.leads.update(list =>
              list.map(l => l.id === payload.new.id ? this.mapRow(payload.new) : l)
            );
          } else if (payload.eventType === 'DELETE') {
            this.leads.update(list => list.filter(l => l.id !== payload.old.id));
          }
        }
      )
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
      source:        r.source         || 'Website',
      notes:         r.notes          || '',
      agentReply:    r.agent_reply    || '',
      lastContact:   r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      createdDate:   r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
    };
  }

  sort(col: keyof AgentLead): void {
    if (this.sortCol() === col) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
  }

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

    // Fetch lead for legacy notes/agent_reply + new messages in parallel
    const [leadRes, msgsRes] = await Promise.all([
      this.sb.from('admin_leads').select('notes, agent_reply, assigned_agent, created_at').eq('id', leadId).single(),
      this.sb.from('lead_messages').select('id, sender_role, sender_name, content, created_at').eq('lead_id', leadId).order('created_at', { ascending: true }),
    ]);

    const legacy: LeadMessage[] = [];
    if (leadRes.data?.notes) legacy.push({
      id: -(leadId * 10 + 1), senderRole: 'customer', senderName: 'Customer',
      content: leadRes.data.notes,
      createdAt: this.fmtDate(leadRes.data.created_at),
    });
    if (leadRes.data?.agent_reply) legacy.push({
      id: -(leadId * 10 + 2), senderRole: 'agent', senderName: leadRes.data.assigned_agent || 'Agent',
      content: leadRes.data.agent_reply,
      createdAt: this.fmtDate(leadRes.data.created_at),
    });

    const fresh = (msgsRes.data ?? []).map(this.mapMsg);
    this.modalMessages.set([...legacy, ...fresh]);
    this.msgLoading.set(false);
    this.subscribeModalMsgs(leadId);
  }

  private fmtDate(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }) +
           ' · ' + new Date(ts).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
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
      lead_id:     leadId,
      sender_role: 'agent',
      sender_name: user.name || user.email,
      content:     text,
    });

    if (!error) {
      this.newMessage.set('');
      await this.loadModalMessages(leadId);
    }
    this.sendingMsg.set(false);
  }

  onMsgEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  private mapMsg = (r: any): LeadMessage => ({
    id:         r.id,
    senderRole: r.sender_role,
    senderName: r.sender_name,
    content:    r.content,
    createdAt:  this.fmtDate(r.created_at),
  });
  updateForm(p: Partial<AgentLead>): void { this.form.update(f => ({ ...f, ...p })); }

  async save(): Promise<void> {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.name?.trim())     e['name']     = 'Required.';
    if (!f.email?.trim())    e['email']    = 'Required.';
    if (!f.phone?.trim())    e['phone']    = 'Required.';
    if (!f.budget?.trim())   e['budget']   = 'Required.';
    if (!f.location?.trim()) e['location'] = 'Required.';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const agentName  = this.auth.currentUser()?.name  ?? '';
    const agentEmail = this.auth.currentUser()?.email ?? '';
    const payload = {
      name:           f.name!.trim(),
      email:          f.email!.trim(),
      phone:          f.phone!.trim(),
      status:         f.status || 'new',
      budget:         f.budget!.trim(),
      location:       f.location!.trim(),
      property_type:  f.propertyType || '',
      source:         f.source || 'Website',
      notes:          f.notes || '',
      agent_reply:    f.agentReply || null,
      assigned_agent: agentName,
      agent_email:    agentEmail,
    };

    if (this.isEdit() && this.editId() !== null) {
      const { error } = await this.sb.from('admin_leads').update(payload).eq('id', this.editId()!);
      if (error) { this.saveError.set('Failed to save. Please try again.'); this.saving.set(false); return; }
      this.leads.update(list =>
        list.map(l => l.id === this.editId()
          ? { ...l, ...f, propertyType: f.propertyType || l.propertyType } as AgentLead
          : l)
      );
    } else {
      const { data, error } = await this.sb.from('admin_leads').insert(payload).select().single();
      if (error) { this.saveError.set('Failed to add lead. Please try again.'); this.saving.set(false); return; }
      if (data) this.leads.update(list => [this.mapRow(data), ...list]);
    }

    this.saving.set(false);
    this.showModal.set(false);
  }

  async quickUpdateStatus(lead: AgentLead, newStatus: LeadStatus): Promise<void> {
    this.quickStatusId.set(null);
    const agentEmail = this.auth.currentUser()?.email ?? '';
    const { error } = await this.sb.from('admin_leads')
      .update({ status: newStatus, agent_email: agentEmail })
      .eq('id', lead.id);
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
    return ({ new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' } as Record<string, string>)[s] ?? s;
  }
}
