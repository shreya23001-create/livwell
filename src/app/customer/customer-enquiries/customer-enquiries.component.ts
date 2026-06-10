import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

type EnqStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost' | 'closed';

interface Message {
  id: number;
  senderRole: 'customer' | 'agent';
  senderName: string;
  content: string;
  createdAt: string;
}

interface Enquiry {
  id: number;
  property: string;
  propertyId: number | null;
  location: string;
  budget: string;
  agent: string;
  agentInitials: string;
  date: string;
  status: EnqStatus;
}

@Component({
  selector: 'app-customer-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-enquiries.component.html',
  styleUrl: './customer-enquiries.component.scss',
})
export class CustomerEnquiriesComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  private realtimeSub: any = null;
  private msgRealtimeSub: any = null;

  filterStatus = signal('all');
  expandedId   = signal<number | null>(null);
  loading      = signal(true);
  enquiries    = signal<Enquiry[]>([]);

  // Messages per lead id
  messages     = signal<Record<number, Message[]>>({});
  msgLoading   = signal<Record<number, boolean>>({});
  newMessage   = signal<Record<number, string>>({});
  sending      = signal<Record<number, boolean>>({});

  readonly statusSteps: EnqStatus[] = ['new', 'contacted', 'qualified', 'negotiating', 'won'];

  filtered = computed(() => {
    const s = this.filterStatus();
    return s === 'all' ? this.enquiries() : this.enquiries().filter(e => e.status === s);
  });

  stats = computed(() => ({
    total:       this.enquiries().length,
    new:         this.enquiries().filter(e => e.status === 'new').length,
    contacted:   this.enquiries().filter(e => e.status === 'contacted').length,
    qualified:   this.enquiries().filter(e => e.status === 'qualified').length,
    negotiating: this.enquiries().filter(e => e.status === 'negotiating').length,
    won:         this.enquiries().filter(e => e.status === 'won').length,
  }));

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user?.email) { this.loading.set(false); return; }
    await this.fetchEnquiries(user.email);
    this.subscribeLeadRealtime(user.email);
    this.subscribeMsgRealtime();
  }

  ngOnDestroy(): void {
    if (this.realtimeSub)    this.sb.removeChannel(this.realtimeSub);
    if (this.msgRealtimeSub) this.sb.removeChannel(this.msgRealtimeSub);
  }

  private async fetchEnquiries(email: string): Promise<void> {
    const { data } = await this.sb
      .from('admin_leads')
      .select('id, status, assigned_agent, created_at, location, property_type, property_title, property_id, budget, notes, agent_reply')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (data) this.enquiries.set(data.map((r: any) => this.mapRow(r)));
    // Pre-seed legacy messages from notes/agent_reply for each enquiry
    if (data) {
      const seeded: Record<number, Message[]> = {};
      data.forEach((r: any) => {
        const msgs: Message[] = [];
        if (r.notes) msgs.push({
          id: -(r.id * 10 + 1), senderRole: 'customer',
          senderName: 'You',
          content: r.notes,
          createdAt: new Date(r.created_at).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }) +
                     ' · ' + new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }),
        });
        if (r.agent_reply) msgs.push({
          id: -(r.id * 10 + 2), senderRole: 'agent',
          senderName: r.assigned_agent || 'Agent',
          content: r.agent_reply,
          createdAt: new Date(r.created_at).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }) +
                     ' · ' + new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }),
        });
        if (msgs.length) seeded[r.id] = msgs;
      });
      this.messages.update(m => ({ ...seeded, ...m }));
    }
    this.loading.set(false);
  }

  async toggleExpand(id: number): Promise<void> {
    if (this.expandedId() === id) { this.expandedId.set(null); return; }
    this.expandedId.set(id);
    // Always re-fetch to get latest messages
    await this.fetchMessages(id);
  }

  async fetchMessages(leadId: number): Promise<void> {
    this.msgLoading.update(m => ({ ...m, [leadId]: true }));
    const { data } = await this.sb
      .from('lead_messages')
      .select('id, sender_role, sender_name, content, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    // Keep legacy seeded messages (negative ids) + append real messages
    const legacy = (this.messages()[leadId] ?? []).filter(m => m.id < 0);
    const fresh  = (data ?? []).map(this.mapMsg);
    this.messages.update(m => ({ ...m, [leadId]: [...legacy, ...fresh] }));
    this.msgLoading.update(m => ({ ...m, [leadId]: false }));
  }

  async sendMessage(leadId: number): Promise<void> {
    const text = (this.newMessage()[leadId] || '').trim();
    if (!text) return;
    const user = this.auth.currentUser();
    if (!user) return;

    this.sending.update(s => ({ ...s, [leadId]: true }));
    const { error } = await this.sb.from('lead_messages').insert({
      lead_id:     leadId,
      sender_role: 'customer',
      sender_name: user.name || user.email,
      content:     text,
    });

    if (!error) {
      this.newMessage.update(n => ({ ...n, [leadId]: '' }));
      await this.fetchMessages(leadId);
    }
    this.sending.update(s => ({ ...s, [leadId]: false }));
  }

  onEnterKey(event: KeyboardEvent, leadId: number): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(leadId);
    }
  }

  setNewMessage(leadId: number, value: string): void {
    this.newMessage.update(n => ({ ...n, [leadId]: value }));
  }

  private subscribeLeadRealtime(email: string): void {
    this.realtimeSub = this.sb
      .channel('customer-enquiries-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'admin_leads', filter: `email=eq.${email}` },
        (payload: any) => {
          if (payload.eventType === 'UPDATE')
            this.enquiries.update(list => list.map(e => e.id === payload.new.id ? this.mapRow(payload.new) : e));
          else if (payload.eventType === 'INSERT')
            this.enquiries.update(list => [this.mapRow(payload.new), ...list]);
          else if (payload.eventType === 'DELETE')
            this.enquiries.update(list => list.filter(e => e.id !== payload.old.id));
        })
      .subscribe();
  }

  private subscribeMsgRealtime(): void {
    this.msgRealtimeSub = this.sb
      .channel('customer-messages-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_messages' },
        (payload: any) => {
          const msg = this.mapMsg(payload.new);
          const leadId = payload.new.lead_id;
          // Only add if we already loaded messages for this lead and it's not our own insert
          if (this.messages()[leadId]) {
            const exists = this.messages()[leadId].some(m => m.id === msg.id);
            if (!exists) this.messages.update(m => ({ ...m, [leadId]: [...(m[leadId] ?? []), msg] }));
          }
        })
      .subscribe();
  }

  private mapRow(r: any): Enquiry {
    const agent = r.assigned_agent || '';
    return {
      id:            r.id,
      property:      r.property_title || r.property_type || 'General Enquiry',
      propertyId:    r.property_id    ?? null,
      location:      r.location       || '',
      budget:        r.budget         || '',
      agent:         agent || 'Unassigned',
      agentInitials: agent ? agent.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'UA',
      date:          new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
      status:        (r.status || 'new') as EnqStatus,
    };
  }

  private mapMsg = (r: any): Message => ({
    id:         r.id,
    senderRole: r.sender_role,
    senderName: r.sender_name,
    content:    r.content,
    createdAt:  new Date(r.created_at).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }) +
                ' · ' + new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }),
  });

  statusLabel(s: string): string {
    return ({ new: 'New', contacted: 'Contacted', qualified: 'Qualified',
              negotiating: 'Negotiating', won: 'Won', lost: 'Lost', closed: 'Closed' } as Record<string, string>)[s] ?? s;
  }

  stepIndex(status: EnqStatus): number { return this.statusSteps.indexOf(status); }
}
