import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface LeadMessage {
  id: number;
  senderRole: 'customer' | 'agent';
  senderName: string;
  content: string;
  createdAt: string;
}

interface SavedProperty {
  id: number;
  property_id: number;
  created_at: string;
  property?: {
    id: number; title: string; type: string; price: number;
    location: string; images: string[]; status: string; listing_type: string;
  };
}

interface ActivityLog {
  id: number;
  action: string;
  detail: string;
  timestamp: string;
  icon: 'status' | 'message' | 'save' | 'view' | 'create';
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';

interface LeadDetail {
  id: number; name: string; email: string; phone: string;
  status: LeadStatus; category: string; budget: string;
  location: string; propertyType: string; propertyTitle: string;
  propertyId: number | null; projectId: number | null; projectTitle: string;
  source: string; notes: string; agentReply: string;
  createdDate: string; lastContact: string;
  customerId?: string | null; assignedAgent: string;
}

@Component({
  selector: 'app-lead-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lead-profile.component.html',
  styleUrl: './lead-profile.component.scss',
})
export class LeadProfileComponent implements OnInit, OnDestroy {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);
  private sb     = inject(SupabaseService).client;

  private msgSub: any = null;

  lead            = signal<LeadDetail | null>(null);
  loading         = signal(true);
  messages        = signal<LeadMessage[]>([]);
  savedProperties = signal<SavedProperty[]>([]);
  property        = signal<any | null>(null);
  project         = signal<any | null>(null);
  projectLoading  = signal(false);
  activity        = signal<ActivityLog[]>([]);
  activeTab       = signal<'chat' | 'activity'>('chat');
  newMsg          = signal('');
  sending         = signal(false);
  msgLoading      = signal(false);
  propLoading     = signal(false);
  updatingStatus  = signal(false);

  propViewCount   = signal<number>(0);
  propSaveCount   = signal<number>(0);
  daysActive      = signal<number>(0);

  readonly statusTimeline: { status: LeadStatus; label: string }[] = [
    { status: 'new',         label: 'New Lead'    },
    { status: 'contacted',   label: 'Contacted'   },
    { status: 'qualified',   label: 'Qualified'   },
    { status: 'negotiating', label: 'Negotiating' },
  ];

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/agent/leads']); return; }
    await this.loadLead(id);
  }

  ngOnDestroy(): void {
    if (this.msgSub) this.sb.removeChannel(this.msgSub);
  }

  private async loadLead(id: number): Promise<void> {
    this.loading.set(true);
    const { data } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, notes, agent_reply, assigned_agent, created_at, location, property_type, property_title, property_id, project_id, project_title, budget, customer_id, category')
      .eq('id', id)
      .maybeSingle();

    if (!data) { this.router.navigate(['/agent/leads']); return; }

    const lead: LeadDetail = {
      id:            data.id,
      name:          data.name           || '',
      email:         data.email          || '',
      phone:         data.phone          || '',
      status:        (data.status        || 'new') as LeadStatus,
      category:      data.category       || 'Buy',
      budget:        data.budget         || '',
      location:      data.location       || '',
      propertyType:  data.property_type  || '',
      propertyTitle: data.property_title || '',
      propertyId:    data.property_id    ?? null,
      projectId:     data.project_id     ?? null,
      projectTitle:  data.project_title  || '',
      source:        data.source         || 'Website',
      notes:         data.notes          || '',
      agentReply:    data.agent_reply    || '',
      createdDate:   data.created_at ? new Date(data.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      lastContact:   data.created_at ? new Date(data.created_at).toISOString().slice(0, 10) : '',
      customerId:    data.customer_id    ?? null,
      assignedAgent: data.assigned_agent || '',
    };
    this.lead.set(lead);
    this.loading.set(false);

    const created = data.created_at ? new Date(data.created_at) : new Date();
    const days = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86_400_000));
    this.daysActive.set(days);

    await Promise.all([
      this.loadMessages(lead),
      this.loadSavedProperties(lead),
      this.loadProperty(lead),
      this.loadProject(lead),
    ]);
    this.buildActivity();
    this.subscribeMsgs(lead.id);
  }

  private async loadMessages(lead: LeadDetail): Promise<void> {
    this.msgLoading.set(true);
    const [leadRes, msgsRes] = await Promise.all([
      this.sb.from('admin_leads').select('notes, agent_reply, assigned_agent, created_at').eq('id', lead.id).single(),
      this.sb.from('lead_messages').select('id, sender_role, sender_name, content, created_at').eq('lead_id', lead.id).order('created_at', { ascending: true }),
    ]);
    const legacy: LeadMessage[] = [];
    if (leadRes.data?.notes) legacy.push({
      id: -(lead.id * 10 + 1), senderRole: 'customer', senderName: lead.name || 'Customer',
      content: leadRes.data.notes, createdAt: this.fmtDate(leadRes.data.created_at),
    });
    if (leadRes.data?.agent_reply) legacy.push({
      id: -(lead.id * 10 + 2), senderRole: 'agent', senderName: leadRes.data.assigned_agent || 'Agent',
      content: leadRes.data.agent_reply, createdAt: this.fmtDate(leadRes.data.created_at),
    });
    const fresh = (msgsRes.data ?? []).map(this.mapMsg);
    this.messages.set([...legacy, ...fresh]);
    this.msgLoading.set(false);
  }

  private async loadSavedProperties(lead: LeadDetail): Promise<void> {
    let userId = lead.customerId;
    if (!userId) {
      const { data: prof } = await this.sb.from('profiles').select('id').eq('email', lead.email).maybeSingle();
      userId = prof?.id ?? null;
    }
    if (!userId) return;

    const agentName = this.auth.currentUser()?.name ?? '';

    const { data } = await this.sb
      .from('saved_properties')
      .select('id, property_id, created_at, properties(id, title, type, price, location, images, status, listing_type, agent_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const mapped = (data as any[]).map(r => ({
        ...r,
        property: Array.isArray(r.properties) ? r.properties[0] ?? null : r.properties,
      }));
      const filtered = agentName
        ? mapped.filter(r => r.property?.agent_name === agentName)
        : mapped;
      this.savedProperties.set(filtered);
    }
  }

  private async loadProperty(lead: LeadDetail): Promise<void> {
    if (!lead.propertyId) return;
    this.propLoading.set(true);
    const [propRes, savesRes] = await Promise.all([
      this.sb
        .from('properties')
        .select('id, title, type, price, location, images, status, listing_type, area_sqft, bedrooms, bathrooms, community, views')
        .eq('id', lead.propertyId)
        .maybeSingle(),
      this.sb
        .from('saved_properties')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', lead.propertyId),
    ]);
    if (propRes.data) {
      this.property.set(propRes.data);
      this.propViewCount.set(propRes.data.views || 0);
    }
    this.propSaveCount.set(savesRes.count ?? 0);
    this.propLoading.set(false);
  }

  private async loadProject(lead: LeadDetail): Promise<void> {
    if (!lead.projectId) return;
    this.projectLoading.set(true);
    const { data } = await this.sb
      .from('projects')
      .select('id, title, developer, location, type, price_from, price_label, beds, completion_date, images, status, badge, is_luxury')
      .eq('id', lead.projectId)
      .maybeSingle();
    if (data) this.project.set(data);
    this.projectLoading.set(false);
  }

  private buildActivity(): void {
    const lead = this.lead();
    if (!lead) return;
    const log: ActivityLog[] = [];
    let n = 1;
    log.push({ id: n++, action: 'Lead Created', detail: `Enquiry via ${lead.source}`, timestamp: lead.createdDate, icon: 'create' });
    if (lead.propertyTitle) log.push({ id: n++, action: 'Property Interest', detail: lead.propertyTitle, timestamp: lead.createdDate, icon: 'view' });
    this.messages().forEach(m => {
      log.push({ id: n++, action: m.senderRole === 'agent' ? 'Agent Replied' : 'Customer Message', detail: m.content.slice(0, 90) + (m.content.length > 90 ? '…' : ''), timestamp: m.createdAt, icon: 'message' });
    });
    if (lead.status !== 'new') log.push({ id: n++, action: 'Status Updated', detail: `Changed to: ${this.labelStatus(lead.status)}`, timestamp: lead.lastContact, icon: 'status' });
    this.savedProperties().forEach(s => {
      log.push({ id: n++, action: 'Property Saved', detail: s.property?.title || 'Property #' + s.property_id, timestamp: new Date(s.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }), icon: 'save' });
    });
    this.activity.set(log.reverse());
  }

  private subscribeMsgs(leadId: number): void {
    this.msgSub = this.sb
      .channel(`lead-profile-msgs-${leadId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_messages', filter: `lead_id=eq.${leadId}` },
        (payload: any) => {
          const msg = this.mapMsg(payload.new);
          if (!this.messages().some(m => m.id === msg.id)) {
            this.messages.update(list => [...list, msg]);
            this.buildActivity();
          }
        })
      .subscribe();
  }

  async sendMessage(): Promise<void> {
    const text = this.newMsg().trim();
    const lead = this.lead();
    const user = this.auth.currentUser();
    if (!text || !lead || !user) return;
    this.sending.set(true);
    const { error } = await this.sb.from('lead_messages').insert({
      lead_id: lead.id, sender_role: 'agent', sender_name: user.name || user.email, content: text,
    });
    if (!error) {
      this.newMsg.set('');
      await this.loadMessages(lead);
      this.buildActivity();
    }
    this.sending.set(false);
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  async updateStatus(newStatus: LeadStatus): Promise<void> {
    const lead = this.lead();
    if (!lead || lead.status === newStatus) return;
    this.updatingStatus.set(true);
    const agentEmail = this.auth.currentUser()?.email ?? '';
    const { error } = await this.sb.from('admin_leads').update({ status: newStatus, agent_email: agentEmail }).eq('id', lead.id);
    if (!error) {
      this.lead.update(l => l ? { ...l, status: newStatus } : l);
      this.buildActivity();
    }
    this.updatingStatus.set(false);
  }

  getStatusIndex(s: LeadStatus): number {
    return ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'].indexOf(s);
  }

  labelStatus(s: string, lead?: LeadDetail | null): string {
    if (s === 'won' && lead?.assignedAgent) return `Won by ${lead.assignedAgent}`;
    return ({ new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' } as Record<string, string>)[s] ?? s;
  }

  formatPrice(n: number): string {
    if (!n) return 'AED —';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  goBack(): void { this.router.navigate(['/agent/leads']); }

  private fmtDate(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }) +
           ' · ' + new Date(ts).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
  }

  private mapMsg = (r: any): LeadMessage => ({
    id: r.id, senderRole: r.sender_role, senderName: r.sender_name,
    content: r.content, createdAt: this.fmtDate(r.created_at),
  });
}
