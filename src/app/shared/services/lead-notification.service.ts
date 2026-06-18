import { Injectable, signal, inject, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface LeadNotif {
  id: number;
  name: string;
  property_title: string | null;
  project_title:  string | null;
  created_at: string;
  agent_email: string | null;
  kind?: 'lead' | 'message';
  message?: string | null;
  lead_id?: number | null;
}

const LS_KEY = 'lw_lead_notif_seen';

@Injectable({ providedIn: 'root' })
export class LeadNotificationService {
  private sb   = inject(SupabaseService).client;
  private auth = inject(AuthService);

  private _leads  = signal<LeadNotif[]>([]);
  private _seenAt = signal<number>(this.loadSeenAt());
  private timer: any;

  leads     = this._leads.asReadonly();
  unreadCount = computed(() =>
    this._leads().filter(l => new Date(l.created_at).getTime() > this._seenAt()).length
  );

  async start(): Promise<void> {
    await this.auth.waitForSession();
    await this.fetch();
    this.timer = setInterval(() => this.fetch(), 60 * 1000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async fetch(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    if (user.role === 'agent') {
      // 1. New leads assigned to this agent
      const { data: leadsData } = await this.sb
        .from('admin_leads')
        .select('id, name, property_title, project_title, created_at, agent_email')
        .eq('status', 'new')
        .eq('agent_email', user.email)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(50);

      // 2. Recent customer messages on leads assigned to this agent
      // Join via admin_leads to get only this agent's leads
      const { data: agentLeads } = await this.sb
        .from('admin_leads')
        .select('id, property_title, project_title, name')
        .eq('agent_email', user.email);

      const agentLeadIds = (agentLeads ?? []).map((l: any) => l.id);
      const leadInfoMap: Record<number, { name: string; property_title: string; project_title: string }> = {};
      (agentLeads ?? []).forEach((l: any) => {
        leadInfoMap[l.id] = { name: l.name, property_title: l.property_title, project_title: l.project_title };
      });

      let msgNotifs: LeadNotif[] = [];
      if (agentLeadIds.length > 0) {
        const { data: msgsData } = await this.sb
          .from('lead_messages')
          .select('id, lead_id, sender_name, content, created_at')
          .eq('sender_role', 'customer')
          .in('lead_id', agentLeadIds)
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(50);

        msgNotifs = (msgsData ?? []).map((m: any) => ({
          id:            -(m.id),            // negative to avoid collision with lead ids
          name:          m.sender_name || 'Customer',
          property_title: leadInfoMap[m.lead_id]?.property_title || null,
          project_title:  leadInfoMap[m.lead_id]?.project_title  || null,
          created_at:    m.created_at,
          agent_email:   null,
          kind:          'message' as const,
          message:       m.content || null,
          lead_id:       m.lead_id,
        }));
      }

      const leads: LeadNotif[] = (leadsData ?? []).map((r: any) => ({
        ...r, kind: 'lead' as const,
      }));

      // Merge and sort newest first
      const merged = [...leads, ...msgNotifs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      this._leads.set(merged);
    } else {
      // admin/super_admin: show all recent leads
      const { data } = await this.sb
        .from('admin_leads')
        .select('id, name, property_title, project_title, created_at, agent_email')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) this._leads.set((data as any[]).map(r => ({ ...r, kind: 'lead' as const })));
    }
  }

  markAllRead(): void {
    const now = Date.now();
    this._seenAt.set(now);
    try { localStorage.setItem(LS_KEY, String(now)); } catch {}
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private loadSeenAt(): number {
    try { return Number(localStorage.getItem(LS_KEY) ?? '0'); } catch { return 0; }
  }
}
