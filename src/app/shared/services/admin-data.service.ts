import { Injectable, signal, inject } from '@angular/core';
import { UserRole, UserStatus } from '../models/user.model';
import { SupabaseService } from './supabase.service';

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

  constructor() {
    this.loadUsers();
    this.loadLeads();
  }

  private log(tag: string, error: any, data: any): void {
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

    this.log('loadUsers', error, data);
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

    this.log('loadLeads', error, data);
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
}
