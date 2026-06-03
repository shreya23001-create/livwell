import { Injectable, signal, inject } from '@angular/core';
import { UserRole, UserStatus } from '../models/user.model';
import { SupabaseService } from './supabase.service';

export type BannerStatus      = 'active' | 'inactive';
export type AnnouncementType  = 'info' | 'success' | 'warning';
export type AuditModule       = 'auth' | 'property' | 'lead' | 'user' | 'cms' | 'config' | 'report';
export type AuditStatus       = 'success' | 'warning' | 'error';
export type AuditActorRole    = 'admin' | 'agent' | 'customer' | 'system';

export interface CmsBanner {
  id: number; title: string; subtitle: string;
  ctaText: string; ctaLink: string;
  status: BannerStatus; order: number;
  imageUrl?: string; locationTag?: string;
  startingPrice?: string; paymentPlan?: string;
}

export interface CmsAnnouncement {
  id: number; title: string; body: string;
  type: AnnouncementType; active: boolean; expiresOn: string;
}

export interface CmsPage {
  id: string; label: string; heading: string; subheading: string; body: string;
}

export interface AuditLog {
  id: number; timestamp: string;
  actor: string; actorRole: AuditActorRole;
  action: string; module: AuditModule;
  detail: string; ip: string; status: AuditStatus;
}

export type LeadStatus   = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';
export type LeadSource   = 'website' | 'referral' | 'walk_in' | 'social_media' | 'portal' | 'cold_call';
export type LeadCategory = 'buy' | 'rent' | 'invest';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  propertiesCount?: number;
  leadsCount?: number;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  category: LeadCategory;
  budget: string;
  location: string;
  propertyType: string;
  assignedAgent: string;
  notes: string;
  createdDate: string;
  lastContact: string;
}

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private sb = inject(SupabaseService).client;

  readonly users        = signal<AdminUser[]>([]);
  readonly leads        = signal<Lead[]>([]);
  readonly usersLoading = signal(true);
  readonly leadsLoading = signal(true);
  readonly usersError   = signal('');
  readonly leadsError   = signal('');

  // ── CMS Signals ───────────────────────────────────────
  readonly banners       = signal<CmsBanner[]>([]);
  readonly announcements = signal<CmsAnnouncement[]>([]);
  readonly pages         = signal<CmsPage[]>([]);
  readonly cmsLoading    = signal(true);

  // ── Audit Signals ─────────────────────────────────────
  readonly auditLogs     = signal<AuditLog[]>([]);
  readonly auditLoading  = signal(true);

  constructor() {
    this.loadUsers();
    this.loadLeads();
    this.loadCms();
    this.loadAuditLogs();
  }

  private dbLog(tag: string, error: any, data: any): void {
    if (error) console.error(`[AdminData] ${tag} ERROR:`, error);
    else       console.log(`[AdminData] ${tag} OK — ${data?.length ?? 0} rows`);
  }

  // ── Users (admin_users table) ─────────────────────────
  async loadUsers(): Promise<void> {
    this.usersLoading.set(true);
    this.usersError.set('');
    const { data, error } = await this.sb
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    this.dbLog('loadUsers', error, data);
    if (error) {
      this.usersError.set(error.message);
    } else if (data) {
      this.users.set(data.map((p: any) => ({
        id:              p.id,
        name:            p.name             || '',
        email:           p.email            || '',
        phone:           p.phone            || '',
        role:            p.role             || 'customer',
        status:          p.status           || 'active',
        joinedDate:      p.joined_date      || (p.created_at || '').slice(0, 10),
        lastActive:      p.last_active      || (p.created_at || '').slice(0, 10),
        propertiesCount: p.properties_count || 0,
        leadsCount:      p.leads_count      || 0,
      })));
    }
    this.usersLoading.set(false);
  }

  async saveUser(u: Partial<AdminUser>, editingId: number | null): Promise<string | null> {
    const payload: any = {
      name:        u.name?.trim(),
      email:       u.email?.trim(),
      phone:       u.phone?.trim()  || null,
      role:        u.role           || 'customer',
      status:      u.status         || 'active',
      joined_date: u.joinedDate     || new Date().toISOString().slice(0, 10),
      last_active: u.lastActive     || new Date().toISOString().slice(0, 10),
    };

    let error: any;
    if (editingId !== null) {
      ({ error } = await this.sb.from('admin_users').update(payload).eq('id', editingId));
    } else {
      ({ error } = await this.sb.from('admin_users').insert(payload));
    }

    if (error) return error.message;
    await this.loadUsers();
    return null;
  }

  async deleteUser(id: number): Promise<void> {
    await this.sb.from('admin_users').delete().eq('id', id);
    await this.loadUsers();
  }

  async toggleUserStatus(id: number, currentStatus: UserStatus): Promise<void> {
    const next: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await this.sb.from('admin_users').update({ status: next }).eq('id', id);
    await this.loadUsers();
  }

  async importUsers(users: Omit<AdminUser, 'id'>[]): Promise<string | null> {
    const rows = users.map(u => ({
      name:        u.name,
      email:       u.email,
      phone:       u.phone      || null,
      role:        u.role       || 'customer',
      status:      u.status     || 'active',
      joined_date: u.joinedDate || new Date().toISOString().slice(0, 10),
      last_active: u.lastActive || new Date().toISOString().slice(0, 10),
    }));
    const { error } = await this.sb.from('admin_users').insert(rows);
    if (error) return error.message;
    await this.loadUsers();
    return null;
  }

  // ── Leads (admin_leads table) ─────────────────────────
  async loadLeads(): Promise<void> {
    this.leadsLoading.set(true);
    this.leadsError.set('');
    const { data, error } = await this.sb
      .from('admin_leads')
      .select('*')
      .order('created_at', { ascending: false });

    this.dbLog('loadLeads', error, data);
    if (error) {
      this.leadsError.set(error.message);
    } else if (data) {
      this.leads.set(data.map((r: any) => ({
        id:            r.id,
        name:          r.name           || '',
        email:         r.email          || '',
        phone:         r.phone          || '',
        status:        r.status         || 'new',
        source:        r.source         || 'website',
        category:      r.category       || 'buy',
        budget:        r.budget         || '',
        location:      r.location       || '',
        propertyType:  r.property_type  || '',
        assignedAgent: r.assigned_agent || 'Unassigned',
        notes:         r.notes          || '',
        createdDate:   (r.created_at    || '').slice(0, 10),
        lastContact:   r.last_contact   || (r.created_at || '').slice(0, 10),
      })));
    }
    this.leadsLoading.set(false);
  }

  async saveLead(l: Partial<Lead>, editingId: number | null): Promise<string | null> {
    const payload = {
      name:           l.name?.trim(),
      email:          l.email?.trim(),
      phone:          l.phone?.trim()        || null,
      status:         l.status               || 'new',
      source:         l.source               || 'website',
      category:       l.category             || 'buy',
      budget:         l.budget?.trim()       || null,
      location:       l.location?.trim()     || null,
      property_type:  l.propertyType?.trim() || null,
      assigned_agent: l.assignedAgent        || 'Unassigned',
      notes:          l.notes?.trim()        || null,
      last_contact:   l.lastContact          || null,
    };

    let error: any;
    if (editingId !== null) {
      ({ error } = await this.sb.from('admin_leads').update(payload).eq('id', editingId));
    } else {
      ({ error } = await this.sb.from('admin_leads').insert(payload));
    }

    if (error) return error.message;
    await this.loadLeads();
    return null;
  }

  async deleteLead(id: number): Promise<void> {
    await this.sb.from('admin_leads').delete().eq('id', id);
    await this.loadLeads();
  }

  // Convenience: log a lead action (called by components after save/delete)
  async logLeadAction(actor: string, actorRole: AuditActorRole, action: string, detail: string, status: AuditStatus = 'success'): Promise<void> {
    await this.log(actor, actorRole, action, 'lead', detail, status);
  }

  async logUserAction(actor: string, actorRole: AuditActorRole, action: string, detail: string, status: AuditStatus = 'success'): Promise<void> {
    await this.log(actor, actorRole, action, 'user', detail, status);
  }

  async importLeads(leads: Omit<Lead, 'id'>[]): Promise<string | null> {
    const rows = leads.map(l => ({
      name:           l.name,
      email:          l.email,
      phone:          l.phone          || null,
      status:         l.status         || 'new',
      source:         l.source         || 'website',
      category:       l.category       || 'buy',
      budget:         l.budget         || null,
      location:       l.location       || null,
      property_type:  l.propertyType   || null,
      assigned_agent: l.assignedAgent  || 'Unassigned',
      notes:          l.notes          || null,
      last_contact:   l.lastContact    || null,
    }));
    const { error } = await this.sb.from('admin_leads').insert(rows);
    if (error) return error.message;
    await this.loadLeads();
    return null;
  }

  // ── CMS ───────────────────────────────────────────────
  async loadCms(): Promise<void> {
    this.cmsLoading.set(true);
    try {
    const [b, a, p] = await Promise.all([
      this.sb.from('cms_banners').select('*').order('sort_order'),
      this.sb.from('cms_announcements').select('*').order('created_at', { ascending: false }),
      this.sb.from('cms_pages').select('*').order('id'),
    ]);
    if (b.data) this.banners.set(b.data.map((r: any) => ({
      id:            r.id,
      title:         r.title,
      subtitle:      r.subtitle      || '',
      ctaText:       r.cta_text      || '',
      ctaLink:       r.cta_link      || '',
      status:        r.status,
      order:         r.sort_order,
      imageUrl:      r.image_url     || '',
      locationTag:   r.location_tag  || '',
      startingPrice: r.starting_price || '',
      paymentPlan:   r.payment_plan  || '',
    })));
    if (a.data) this.announcements.set(a.data.map((r: any) => ({
      id: r.id, title: r.title, body: r.body,
      type: r.type, active: r.active,
      expiresOn: r.expires_on || '',
    })));
    if (p.data) this.pages.set(p.data.map((r: any) => ({
      id: r.id, label: r.label, heading: r.heading || '',
      subheading: r.subheading || '', body: r.body || '',
    })));
    } catch (e) {
      console.warn('[AdminData] CMS tables not found — run cms-and-audit-tables.sql in Supabase');
    } finally {
      this.cmsLoading.set(false);
    }
  }

  async saveBanner(f: Partial<CmsBanner>, editingId: number | null): Promise<string | null> {
    const payload = { title: f.title, subtitle: f.subtitle, cta_text: f.ctaText, cta_link: f.ctaLink, status: f.status, sort_order: f.order };
    const { error } = editingId
      ? await this.sb.from('cms_banners').update(payload).eq('id', editingId)
      : await this.sb.from('cms_banners').insert(payload);
    if (error) return error.message;
    await this.loadCms();
    return null;
  }

  async deleteBanner(id: number): Promise<void> {
    await this.sb.from('cms_banners').delete().eq('id', id);
    await this.loadCms();
  }

  async toggleBannerStatus(id: number, current: BannerStatus): Promise<void> {
    await this.sb.from('cms_banners').update({ status: current === 'active' ? 'inactive' : 'active' }).eq('id', id);
    await this.loadCms();
  }

  async saveAnnouncement(f: Partial<CmsAnnouncement>, editingId: number | null): Promise<string | null> {
    const payload = { title: f.title, body: f.body, type: f.type, active: f.active, expires_on: f.expiresOn || null };
    const { error } = editingId
      ? await this.sb.from('cms_announcements').update(payload).eq('id', editingId)
      : await this.sb.from('cms_announcements').insert(payload);
    if (error) return error.message;
    await this.loadCms();
    return null;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await this.sb.from('cms_announcements').delete().eq('id', id);
    await this.loadCms();
  }

  async toggleAnnouncement(id: number, current: boolean): Promise<void> {
    await this.sb.from('cms_announcements').update({ active: !current }).eq('id', id);
    await this.loadCms();
  }

  async savePage(id: string, f: { heading: string; subheading: string; body: string }): Promise<string | null> {
    const { error } = await this.sb.from('cms_pages').update({ ...f, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return error.message;
    await this.loadCms();
    return null;
  }

  // ── Audit Logs ────────────────────────────────────────
  async loadAuditLogs(): Promise<void> {
    this.auditLoading.set(true);
    try {
      const { data } = await this.sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (data) this.auditLogs.set(data.map((r: any) => ({
        id:        r.id,
        timestamp: r.created_at?.replace('T', ' ').slice(0, 19) ?? '',
        actor:     r.actor,
        actorRole: r.actor_role,
        action:    r.action,
        module:    r.module,
        detail:    r.detail || '',
        ip:        r.ip || '—',
        status:    r.status,
      })));
    } catch (e) {
      console.warn('[AdminData] audit_logs table not found — run cms-and-audit-tables.sql');
    } finally {
      this.auditLoading.set(false);
    }
  }

  async log(actor: string, actorRole: AuditActorRole, action: string, module: AuditModule, detail: string, status: AuditStatus = 'success'): Promise<void> { // public audit log method
    await this.sb.from('audit_logs').insert({ actor, actor_role: actorRole, action, module, detail, status });
    // Refresh only if audit logs are already loaded (non-blocking)
    this.loadAuditLogs();
  }
}
