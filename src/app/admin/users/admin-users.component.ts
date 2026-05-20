import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole, UserStatus } from '../../shared/models/user.model';

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
  avatar?: string;
}

const SAMPLE_USERS: AdminUser[] = [
  { id: 1,  name: 'Ankush Sharma',       email: 'superadmin@livwell.ae',  phone: '+971501111111', role: 'super_admin', status: 'active',               joinedDate: '2025-01-01', lastActive: '2026-05-19', propertiesCount: 0,  leadsCount: 0  },
  { id: 2,  name: 'Admin User',           email: 'admin@livwell.ae',       phone: '+971502222222', role: 'admin',       status: 'active',               joinedDate: '2025-03-15', lastActive: '2026-05-18', propertiesCount: 0,  leadsCount: 0  },
  { id: 3,  name: 'Sarah Al-Mansouri',    email: 'agent@livwell.ae',       phone: '+971503333333', role: 'agent',       status: 'active',               joinedDate: '2025-06-10', lastActive: '2026-05-19', propertiesCount: 14, leadsCount: 38 },
  { id: 4,  name: 'Ahmed Hassan',         email: 'ahmed@livwell.ae',       phone: '+971504444444', role: 'agent',       status: 'active',               joinedDate: '2025-07-22', lastActive: '2026-05-17', propertiesCount: 9,  leadsCount: 21 },
  { id: 5,  name: 'Rania Khalid',         email: 'rania@livwell.ae',       phone: '+971505555555', role: 'agent',       status: 'active',               joinedDate: '2025-09-05', lastActive: '2026-05-16', propertiesCount: 7,  leadsCount: 15 },
  { id: 6,  name: 'Omar Al-Farsi',        email: 'omar@livwell.ae',        phone: '+971506666666', role: 'agent',       status: 'pending_verification', joinedDate: '2026-04-01', lastActive: '2026-04-01', propertiesCount: 2,  leadsCount: 4  },
  { id: 7,  name: 'Fatima Al-Zaabi',      email: 'fatima@livwell.ae',      phone: '+971507777777', role: 'agent',       status: 'suspended',            joinedDate: '2025-11-12', lastActive: '2026-03-10', propertiesCount: 5,  leadsCount: 8  },
  { id: 8,  name: 'Mohammed Al-Rashidi',  email: 'mohammed@example.com',   phone: '+971508888888', role: 'customer',    status: 'active',               joinedDate: '2026-01-14', lastActive: '2026-05-15', propertiesCount: 0,  leadsCount: 3  },
  { id: 9,  name: 'Layla Hussain',        email: 'layla@example.com',      phone: '+971509999999', role: 'customer',    status: 'active',               joinedDate: '2026-02-20', lastActive: '2026-05-12', propertiesCount: 0,  leadsCount: 1  },
  { id: 10, name: 'James Carter',         email: 'james@example.com',      phone: '+447700900123', role: 'customer',    status: 'active',               joinedDate: '2026-03-05', lastActive: '2026-05-18', propertiesCount: 0,  leadsCount: 5  },
  { id: 11, name: 'Priya Nair',           email: 'priya@example.com',      phone: '+919876543210', role: 'customer',    status: 'pending_verification', joinedDate: '2026-05-10', lastActive: '2026-05-10', propertiesCount: 0,  leadsCount: 0  },
  { id: 12, name: 'Khalid Al-Maktoum',    email: 'khalid@example.com',     phone: '+971501234567', role: 'customer',    status: 'locked',               joinedDate: '2026-04-18', lastActive: '2026-05-01', propertiesCount: 0,  leadsCount: 2  },
];

const EMPTY_FORM = (): Partial<AdminUser> => ({
  name: '', email: '', phone: '', role: 'customer', status: 'active',
  joinedDate: new Date().toISOString().slice(0, 10), lastActive: new Date().toISOString().slice(0, 10),
  propertiesCount: 0, leadsCount: 0,
});

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent {

  users = signal<AdminUser[]>([...SAMPLE_USERS]);

  // ── Filters ───────────────────────────────────────────
  search      = signal('');
  filterRole   = signal<UserRole | ''>('');
  filterStatus = signal<UserStatus | ''>('');
  sortField    = signal<keyof AdminUser>('joinedDate');
  sortDir      = signal<'asc' | 'desc'>('desc');
  page         = signal(1);
  readonly pageSize = 10;

  // ── Modal ─────────────────────────────────────────────
  modalOpen  = signal(false);
  editingId  = signal<number | null>(null);
  form       = signal<Partial<AdminUser>>(EMPTY_FORM());
  formErrors = signal<Record<string, string>>({});
  deleteTarget = signal<AdminUser | null>(null);

  // ── Computed ──────────────────────────────────────────
  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const r  = this.filterRole();
    const s  = this.filterStatus();
    const sf = this.sortField();
    const sd = this.sortDir();

    let list = this.users().filter(u => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      const matchR = !r || u.role === r;
      const matchS = !s || u.status === s;
      return matchQ && matchR && matchS;
    });

    return [...list].sort((a, b) => {
      const av = a[sf] as any;
      const bv = b[sf] as any;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sd === 'asc' ? cmp : -cmp;
    });
  });

  paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  stats = computed(() => {
    const all = this.users();
    return {
      total:      all.length,
      admins:     all.filter(u => u.role === 'super_admin' || u.role === 'admin').length,
      agents:     all.filter(u => u.role === 'agent').length,
      customers:  all.filter(u => u.role === 'customer').length,
      suspended:  all.filter(u => u.status === 'suspended' || u.status === 'locked').length,
    };
  });

  hasFilters = computed(() => !!(this.search() || this.filterRole() || this.filterStatus()));

  // ── Actions ───────────────────────────────────────────
  sort(field: keyof AdminUser): void {
    if (this.sortField() === field) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }

  onSearch(): void { this.page.set(1); }
  onFilter(): void { this.page.set(1); }
  clearFilters(): void { this.search.set(''); this.filterRole.set(''); this.filterStatus.set(''); this.page.set(1); }

  openAdd(): void {
    this.form.set(EMPTY_FORM());
    this.formErrors.set({});
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  openEdit(u: AdminUser): void {
    this.form.set({ ...u });
    this.formErrors.set({});
    this.editingId.set(u.id);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  saveUser(): void {
    const errs = this.validateForm();
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    const f = this.form() as AdminUser;
    if (this.editingId() !== null) {
      this.users.update(list => list.map(u => u.id === this.editingId() ? { ...f, id: u.id } : u));
    } else {
      const newId = Math.max(...this.users().map(u => u.id)) + 1;
      this.users.update(list => [{ ...f, id: newId } as AdminUser, ...list]);
    }
    this.closeModal();
  }

  private validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    const f = this.form();
    if (!f.name?.trim()) errs['name'] = 'Full name is required.';
    if (!f.email?.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'Enter a valid email address.';
    else {
      const exists = this.users().find(u => u.email.toLowerCase() === f.email!.toLowerCase() && u.id !== this.editingId());
      if (exists) errs['email'] = 'This email is already registered.';
    }
    if (!f.phone?.trim()) errs['phone'] = 'Phone number is required.';
    return errs;
  }

  patchForm(field: string, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    this.formErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }

  toggleStatus(u: AdminUser): void {
    const next: UserStatus = u.status === 'active' ? 'suspended' : 'active';
    this.users.update(list => list.map(x => x.id === u.id ? { ...x, status: next } : x));
  }

  confirmDelete(u: AdminUser): void { this.deleteTarget.set(u); }
  cancelDelete(): void { this.deleteTarget.set(null); }
  doDelete(): void {
    const u = this.deleteTarget();
    if (!u) return;
    this.users.update(list => list.filter(x => x.id !== u.id));
    this.deleteTarget.set(null);
  }

  // ── Helpers ───────────────────────────────────────────
  roleLabel(r: UserRole): string {
    return { super_admin: 'Super Admin', admin: 'Admin', agent: 'Agent', customer: 'Customer' }[r];
  }

  statusLabel(s: UserStatus): string {
    return { active: 'Active', pending_verification: 'Pending', suspended: 'Suspended', locked: 'Locked' }[s];
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  avatarColor(role: UserRole): string {
    return { super_admin: '#7c3aed', admin: '#6366f1', agent: '#6366f1', customer: '#2563eb' }[role];
  }

  pages(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, -1, total];
    if (cur >= total - 3) return [1, -1, total-4, total-3, total-2, total-1, total];
    return [1, -1, cur-1, cur, cur+1, -1, total];
  }

  readonly roleList: UserRole[]     = ['super_admin', 'admin', 'agent', 'customer'];
  readonly statusList: UserStatus[] = ['active', 'pending_verification', 'suspended', 'locked'];
}
