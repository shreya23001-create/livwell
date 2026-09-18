import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { UserRole, UserStatus } from '../../shared/models/user.model';
import { AdminDataService, AdminUser } from '../../shared/services/admin-data.service';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';
import { EmailService } from '../../shared/services/email.service';
import { environment } from '../../../environments/environment';

export type { AdminUser };

const EMPTY_FORM = (): Partial<AdminUser> => ({
  name: '', email: '', phone: '', role: 'agent', status: 'active',
  joinedDate: new Date().toISOString().slice(0, 10),
  lastActive:  new Date().toISOString().slice(0, 10),
  propertiesCount: 0, leadsCount: 0,
  designation: '', avatar_url: '', whatsapp_number: '',
});

interface UserForm extends Partial<AdminUser> { password?: string; }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [PhoneInputComponent, CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent {

  dataSvc = inject(AdminDataService);
  private auth    = inject(AuthService);
  private sb      = inject(SupabaseService).client;
  private toast   = inject(ToastService);
  private emailSvc = inject(EmailService);

  showPassword    = signal(false);
  uploadingAvatar = signal(false);
  avatarPreview   = signal<string | null>(null);
  avatarDragOver  = signal(false);

  // ── Details Popup ─────────────────────────────────────
  detailsUser    = signal<AdminUser | null>(null);
  detailsLoading = signal(false);
  detailsData    = signal<{
    properties: any[];
    projects: any[];
    leads: any[];
    members: any[];
    enquiries: any[];
  } | null>(null);

  async openDetails(u: AdminUser): Promise<void> {
    this.detailsUser.set(u);
    this.detailsData.set(null);
    this.detailsLoading.set(true);

    if (u.role === 'agent' || u.role === 'admin') {
      const [propsRes, projRes, leadsEmailRes, leadsNameRes, membersRes] = await Promise.all([
        this.sb.from('properties').select('id, title, type, listing_type, status, price, location').eq('agent_name', u.name).order('created_at', { ascending: false }),
        this.sb.from('projects').select('id, name, type, status, location').eq('agent_name', u.name).order('created_at', { ascending: false }),
        this.sb.from('admin_leads').select('id, name, status, property_title, created_at').eq('agent_email', u.email).order('created_at', { ascending: false }),
        this.sb.from('admin_leads').select('id, name, status, property_title, created_at').eq('assigned_agent', u.name).is('agent_email', null).order('created_at', { ascending: false }),
        this.sb.from('profiles').select('id, name, email, role, created_at').eq('created_by', u.id).order('created_at', { ascending: false }),
      ]);
      this.detailsData.set({
        properties: propsRes.data ?? [],
        projects:   projRes.data ?? [],
        leads:      [...(leadsEmailRes.data ?? []), ...(leadsNameRes.data ?? [])],
        members:    membersRes.data ?? [],
        enquiries:  [],
      });
    } else {
      const [enqRes, propsRes, projRes] = await Promise.all([
        this.sb.from('admin_leads').select('id, name, status, property_title, project_title, created_at').eq('email', u.email).order('created_at', { ascending: false }),
        this.sb.from('properties').select('id, title, type, status').eq('created_by', u.id).order('created_at', { ascending: false }),
        this.sb.from('projects').select('id, name, type, status').eq('created_by', u.id).order('created_at', { ascending: false }),
      ]);
      this.detailsData.set({
        properties: propsRes.data ?? [],
        projects:   projRes.data ?? [],
        leads:      [],
        members:    [],
        enquiries:  enqRes.data ?? [],
      });
    }
    this.detailsLoading.set(false);
  }

  closeDetails(): void {
    this.detailsUser.set(null);
    this.detailsData.set(null);
  }

  users   = this.dataSvc.users;
  loading = this.dataSvc.usersLoading;

  // ── Filters ───────────────────────────────────────────
  search       = signal('');
  filterRole   = signal<UserRole | ''>('');
  filterStatus = signal<UserStatus | ''>('');
  sortField    = signal<keyof AdminUser>('joinedDate');
  sortDir      = signal<'asc' | 'desc'>('desc');
  page         = signal(1);
  readonly pageSize = 10;

  // ── Modal ─────────────────────────────────────────────
  modalOpen    = signal(false);
  editingId    = signal<string | null>(null);
  form         = signal<UserForm>(EMPTY_FORM());
  formErrors   = signal<Record<string, string>>({});
  saveError    = signal('');
  saving       = signal(false);
  deleteTarget = signal<AdminUser | null>(null);

  // ── Import / Export ───────────────────────────────────
  importing     = signal(false);
  importError   = signal('');
  importSuccess = signal('');

  // ── Computed ──────────────────────────────────────────
  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const r  = this.filterRole();
    const s  = this.filterStatus();
    const sf = this.sortField();
    const sd = this.sortDir();

    let list = this.users().filter(u => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q);
      const matchR = !r || u.role === r;
      const matchS = !s || u.status === s;
      return matchQ && matchR && matchS;
    });

    return [...list].sort((a, b) => {
      const av = (a[sf] ?? '') as any;
      const bv = (b[sf] ?? '') as any;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sd === 'asc' ? cmp : -cmp;
    });
  });

  paginated  = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  stats = computed(() => {
    const all = this.users();
    return {
      total:     all.length,
      admins:    all.filter(u => u.role === 'super_admin' || u.role === 'admin').length,
      agents:    all.filter(u => u.role === 'agent').length,
      customers: all.filter(u => u.role === 'customer').length,
      suspended: all.filter(u => u.status === 'suspended' || u.status === 'locked').length,
    };
  });

  hasFilters = computed(() => !!(this.search() || this.filterRole() || this.filterStatus()));

  // ── Sort / Filter ─────────────────────────────────────
  sort(field: keyof AdminUser): void {
    if (this.sortField() === field) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }
  onSearch(): void { this.page.set(1); }
  onFilter(): void { this.page.set(1); }
  clearFilters(): void { this.search.set(''); this.filterRole.set(''); this.filterStatus.set(''); this.page.set(1); }

  // ── Modal ─────────────────────────────────────────────
  openAdd(): void {
    this.form.set({ ...EMPTY_FORM(), password: '' });
    this.formErrors.set({});
    this.saveError.set('');
    this.avatarPreview.set(null);
    this.editingId.set(null);
    this.showPassword.set(false);
    this.modalOpen.set(true);
  }

  openEdit(u: AdminUser): void {
    this.form.set({ ...u, password: '' }); // always blank — filled only if admin wants to change it
    this.formErrors.set({});
    this.saveError.set('');
    this.avatarPreview.set(u.avatar_url || null);
    this.editingId.set(u.id);
    this.showPassword.set(false);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); this.avatarPreview.set(null); }

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadAvatar(input.files[0]);
    input.value = '';
  }

  onAvatarDrop(event: DragEvent): void {
    event.preventDefault();
    this.avatarDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadAvatar(file);
  }

  private async uploadAvatar(file: File): Promise<void> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { this.toast.error('Only JPG, PNG, or WebP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024)  { this.toast.error('Image must be under 5 MB.'); return; }
    this.uploadingAvatar.set(true);
    const preview = URL.createObjectURL(file);
    this.avatarPreview.set(preview);
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await this.sb.storage
        .from('imagesFolder')
        .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: true });
      if (error) { this.toast.error('Upload failed: ' + error.message); this.avatarPreview.set(null); return; }
      const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
      URL.revokeObjectURL(preview);
      this.avatarPreview.set(pub.publicUrl);
      this.patchForm('avatar_url', pub.publicUrl);
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  removeAvatar(): void {
    this.avatarPreview.set(null);
    this.patchForm('avatar_url', '');
  }

  async saveUser(): Promise<void> {
    const errs = this.validateForm();
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const f = this.form();
    const isNew = this.editingId() === null;

    if (isNew) {
      // Create user via edge function — avoids session hijacking from signUp()
      const supabaseUrl = environment.supabase.url;
      const anonKey     = environment.supabase.key;
      const createRes = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({
          email:       f.email!.trim(),
          password:    f.password!,
          name:        f.name!.trim(),
          phone:       f.phone?.trim()       ?? null,
          role:        f.role                ?? 'customer',
          status:      f.status              ?? 'active',
          designation:     f.designation?.trim()     ?? null,
          avatar_url:      f.avatar_url?.trim()      ?? null,
          whatsapp_number: f.whatsapp_number?.trim() ?? null,
        }),
      });
      const createJson = await createRes.json().catch(() => null);
      if (!createRes.ok) {
        this.toast.error(createJson?.error ?? 'Failed to create user');
        this.saving.set(false);
        return;
      }
      await this.dataSvc.loadUsers();
      this.saving.set(false);
      this.closeModal();
      this.toast.success(`User "${f.name}" created successfully.`);
      if (f.email && f.password) {
        const portalUrl =
          f.role === 'agent'                              ? 'https://livwelldubai.ae/agent/login'
          : f.role === 'admin' || f.role === 'super_admin' ? 'https://livwelldubai.ae/admin/login'
          : 'https://livwelldubai.ae/customer';
        const templateKey =
          f.role === 'agent'       ? 'agent_credentials'
          : f.role === 'admin'     ? 'admin_credentials'
          : f.role === 'super_admin' ? 'admin_credentials'
          : 'customer_credentials';
        this.emailSvc.send(templateKey, {
          to_email:   f.email.trim(),
          name:       f.name?.trim() ?? '',
          email:      f.email.trim(),
          password:   f.password,
          portal_url: portalUrl,
        });
      }
      const actor = this.auth.currentUser()?.email ?? 'admin';
      const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
      this.dataSvc.logUserAction(actor, role, 'Create User', `User "${f.name}" (${f.role}) created`);
      return;
    }

    const err = await this.dataSvc.saveUser(f, this.editingId());
    if (err) { this.saving.set(false); this.toast.error(err); return; }

    // If a new password was entered, update via edge function
    if (f.password?.trim() && this.editingId()) {
      const supabaseUrl = environment.supabase.url;
      const anonKey     = environment.supabase.key;
      const pwRes = await fetch(`${supabaseUrl}/functions/v1/update-user-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ userId: this.editingId(), password: f.password.trim() }),
      });
      const pwJson = await pwRes.json().catch(() => null);
      if (!pwRes.ok) { this.saving.set(false); this.toast.error(pwJson?.error ?? 'Failed to update password'); return; }
    }

    this.saving.set(false);
    this.closeModal();
    this.toast.success(`User "${f.name}" ${isNew ? 'created' : 'updated'} successfully.`);
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.logUserAction(actor, role, isNew ? 'Create User' : 'Update User', `User "${f.name}" (${f.role}) ${isNew ? 'created' : 'updated'}`);
  }

  private validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    const f = this.form();
    const isNew = this.editingId() === null;
    if (!f.name?.trim()) errs['name'] = 'Full name is required.';
    if (!f.email?.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'Enter a valid email address.';
    else {
      const exists = this.users().find(u => u.email.toLowerCase() === f.email!.toLowerCase() && u.id !== this.editingId());
      if (exists) errs['email'] = 'This email is already registered.';
    }
    if (!f.phone?.trim()) errs['phone'] = 'Phone number is required.';
    else if (!/^\+?[\d\s\-()]+$/.test(f.phone.trim()) || (f.phone.replace(/\D/g, '').length < 7 || f.phone.replace(/\D/g, '').length > 15)) errs['phone'] = 'Enter a valid phone number (7–15 digits).';
    if (isNew) {
      if (!f.password?.trim()) errs['password'] = 'Password is required.';
      else if (f.password.length < 8) errs['password'] = 'At least 8 characters.';
    } else if (f.password?.trim() && f.password.length < 8) {
      errs['password'] = 'At least 8 characters.';
    }
    return errs;
  }

  patchForm(field: string, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    this.formErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }

  async toggleStatus(u: AdminUser): Promise<void> {
    await this.dataSvc.toggleUserStatus(u.id, u.status);
  }

  confirmDelete(u: AdminUser): void { this.deleteTarget.set(u); }
  cancelDelete(): void  { this.deleteTarget.set(null); }
  async doDelete(): Promise<void> {
    const u = this.deleteTarget();
    if (!u) return;
    await this.dataSvc.deleteUser(u.id);
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.logUserAction(actor, role, 'Delete User', `User "${u.name}" deleted`, 'warning');
    this.deleteTarget.set(null);
  }

  // ── Export ────────────────────────────────────────────
  exportToExcel(): void {
    const rows = this.users().map(u => ({
      'Name':             u.name,
      'Email':            u.email,
      'Phone':            u.phone,
      'Role':             this.roleLabel(u.role),
      'Status':           this.statusLabel(u.status),
      'Joined Date':      u.joinedDate,
      'Last Active':      u.lastActive,
      'Properties Count': u.propertiesCount ?? 0,
      'Leads Count':      u.leadsCount ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `livwell-users-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  downloadSampleExcel(): void {
    const sample = [
      { 'Name': 'Ahmed Hassan', 'Email': 'ahmed@example.com', 'Phone': '+971501234567', 'Role': 'Agent', 'Status': 'Active', 'Joined Date': '2026-01-01', 'Last Active': '2026-06-01', 'Properties Count': 0, 'Leads Count': 0 },
      { 'Name': 'Sara Ali', 'Email': 'sara@example.com', 'Phone': '+971509876543', 'Role': 'Customer', 'Status': 'Active', 'Joined Date': '2026-02-15', 'Last Active': '2026-06-10', 'Properties Count': 0, 'Leads Count': 0 },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'livwell-users-sample.xlsx');
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

    const roleMap: Record<string, UserRole> = {
      'Super Admin': 'super_admin', 'Admin': 'admin', 'Agent': 'agent', 'Customer': 'customer',
    };
    const statusMap: Record<string, UserStatus> = {
      'Active': 'active', 'Pending': 'pending_verification',
      'Suspended': 'suspended', 'Locked': 'locked',
    };

    const toImport = rows
      .filter(r => r['Name']?.toString().trim())
      .map(r => ({
        name:            r['Name']    || '',
        email:           r['Email']   || '',
        phone:           r['Phone']   || '',
        role:            roleMap[r['Role']]    ?? 'customer',
        status:          statusMap[r['Status']] ?? 'active',
        joinedDate:      r['Joined Date'] || new Date().toISOString().slice(0, 10),
        lastActive:      r['Last Active'] || new Date().toISOString().slice(0, 10),
        propertiesCount: Number(r['Properties Count']) || 0,
        leadsCount:      Number(r['Leads Count'])      || 0,
      }));

    const err = await this.dataSvc.importUsers(toImport);
    if (err) this.toast.error('Import failed: ' + err);
    else     this.toast.success(`${toImport.length} user(s) imported successfully.`);

    this.importing.set(false);
    input.value = '';
  }

  // ── Helpers ───────────────────────────────────────────
  roleLabel(r: UserRole): string {
    const map: Record<UserRole, string> = { super_admin: 'Super Admin', admin: 'Admin', agent: 'Agent', customer: 'Customer' };
    return map[r] ?? r;
  }

  statusLabel(s: UserStatus): string {
    const map: Record<UserStatus, string> = { active: 'Active', inactive: 'Inactive', pending_verification: 'Pending', suspended: 'Suspended', locked: 'Locked' };
    return map[s] ?? s;
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  avatarColor(role: UserRole): string {
    const map: Record<UserRole, string> = { super_admin: '#7c3aed', admin: '#6366f1', agent: '#6366f1', customer: '#2563eb' };
    return map[role] ?? '#6366f1';
  }

  pages(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, -1, total];
    if (cur >= total - 3) return [1, -1, total-4, total-3, total-2, total-1, total];
    return [1, -1, cur-1, cur, cur+1, -1, total];
  }

  readonly roleList:   UserRole[]   = ['admin', 'agent'];
  readonly statusList: UserStatus[] = ['active', 'inactive'];
}
