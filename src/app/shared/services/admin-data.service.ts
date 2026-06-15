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
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  propertiesCount?: number;
  leadsCount?: number;
  password?: string;
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

// ── Master Data ───────────────────────────────────────────
export interface MasterStatus { name: string; color: string; }

@Injectable({ providedIn: 'root' })
export class AdminDataService {

  // ── Master Data Signals ───────────────────────────────
  readonly categories   = signal<string[]>(['Sale', 'Rent', 'Off-Plan']);
  readonly propTypes    = signal<string[]>(['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Office', 'Shop', 'Warehouse', 'Plot']);
  readonly propStatuses = signal<MasterStatus[]>([
    { name: 'Draft', color: '#6b7280' }, { name: 'Pending Review', color: '#f59e0b' },
    { name: 'Published', color: '#10b981' }, { name: 'Archived', color: '#8b5cf6' },
    { name: 'Sold', color: '#3b82f6' }, { name: 'Rented', color: '#6366f1' },
  ]);
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
  private cachedIp: string | null = null;

  constructor() {
    this.loadMasterData();
    this.loadUsers();
    this.loadLeads();
    this.loadCms();
    this.loadAuditLogs();
  }

  // ── Master Data (Supabase) ────────────────────────────
  async loadMasterData(): Promise<void> {
    try {
      const { data } = await this.sb
        .from('master_data')
        .select('*')
        .order('sort_order');
      if (data) {
        this.categories.set(
          data.filter((r: any) => r.type === 'category').map((r: any) => r.name)
        );
        this.propTypes.set(
          data.filter((r: any) => r.type === 'property_type').map((r: any) => r.name)
        );
        this.propStatuses.set(
          data.filter((r: any) => r.type === 'status').map((r: any) => ({
            name:  r.name,
            color: r.color || '#6b7280',
          }))
        );
      }
    } catch { /* table not created yet — defaults remain */ }
  }

  async addMasterItem(type: 'category' | 'property_type' | 'status', name: string, color?: string): Promise<string | null> {
    const order = type === 'category'
      ? this.categories().length + 1
      : type === 'property_type'
        ? this.propTypes().length + 1
        : this.propStatuses().length + 1;
    const { error } = await this.sb.from('master_data').insert({ type, name, color: color || null, sort_order: order });
    if (error) return error.message;
    await this.loadMasterData();
    return null;
  }

  async removeMasterItem(type: 'category' | 'property_type' | 'status', name: string): Promise<string | null> {
    // Optimistic update immediately
    if (type === 'category')      this.categories.update(l => l.filter(x => x !== name));
    if (type === 'property_type') this.propTypes.update(l => l.filter(x => x !== name));
    if (type === 'status')        this.propStatuses.update(l => l.filter(x => x.name !== name));

    const { error } = await this.sb.from('master_data').delete().eq('type', type).eq('name', name);
    if (error) {
      // Revert on failure by reloading
      await this.loadMasterData();
      return error.message;
    }
    return null;
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
      .from('profiles')
      .select('id, name, email, phone, role, status, created_at')
      .order('created_at', { ascending: false });

    this.dbLog('loadUsers', error, data);
    if (error) {
      this.usersError.set(error.message);
    } else if (data) {
      this.users.set(data.map((p: any) => ({
        id:              p.id,
        name:            p.name    || '',
        email:           p.email   || '',
        phone:           p.phone   || '',
        role:            p.role    || 'customer',
        status:          p.status  || 'active',
        joinedDate:      (p.created_at || '').slice(0, 10),
        lastActive:      (p.created_at || '').slice(0, 10),
        propertiesCount: 0,
        leadsCount:      0,
        password:        '',
      })));
    }
    this.usersLoading.set(false);
  }

  async saveUser(u: Partial<AdminUser>, editingId: string | null): Promise<string | null> {
    const payload: any = {
      name:   u.name?.trim(),
      email:  u.email?.trim(),
      phone:  u.phone?.trim() || null,
      role:   u.role          || 'customer',
      status: u.status        || 'active',
    };
    let error: any;
    if (editingId !== null) {
      ({ error } = await this.sb.from('profiles').update(payload).eq('id', editingId));
      if (error) { console.error('[saveUser] update error:', error); return error.message; }
    }
    await this.loadUsers();
    return null;
  }

  async deleteUser(id: string): Promise<void> {
    await this.sb.from('profiles').delete().eq('id', id);
    await this.loadUsers();
  }

  async toggleUserStatus(id: string, currentStatus: UserStatus): Promise<void> {
    const next: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await this.sb.from('profiles').update({ status: next }).eq('id', id);
    await this.loadUsers();
  }

  async importUsers(users: Omit<AdminUser, 'id'>[]): Promise<string | null> {
    // Import requires auth accounts — not supported via bulk insert into profiles alone
    return 'Bulk import is not supported. Please add users one at a time via Add User.';
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

  private async getClientIp(): Promise<string> {
    if (this.cachedIp) return this.cachedIp;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      this.cachedIp = data.ip ?? '—';
    } catch {
      this.cachedIp = '—';
    }
    return this.cachedIp!;
  }

  async log(actor: string, actorRole: AuditActorRole, action: string, module: AuditModule, detail: string, status: AuditStatus = 'success'): Promise<void> {
    const ip = await this.getClientIp();
    await this.sb.from('audit_logs').insert({ actor, actor_role: actorRole, action, module, detail, status, ip });
    this.loadAuditLogs();
  }
}
