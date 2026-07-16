import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

const DUBAI_LOCATIONS = [
  'Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay',
  'Jumeirah Beach Residence (JBR)', 'Jumeirah Village Circle (JVC)',
  'Jumeirah Village Triangle (JVT)', 'Arabian Ranches', 'Emirates Hills',
  'Meydan', 'Mohammed Bin Rashid City', 'Dubai Hills Estate',
  'Dubai Creek Harbour', 'Al Barsha', 'Deira', 'Bur Dubai',
  'Jumeirah', 'Al Quoz', 'Dubai South', 'DIFC',
  'Discovery Gardens', 'International City', 'Sports City',
  'Motor City', 'Damac Hills', 'Tilal Al Ghaf',
];

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  date: string;
}

interface Project { id: number; title: string; }

type Tab = 'inbox' | 'preferences';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notif-page">

      <!-- Tab bar -->
      <div class="notif-tabs">
        <button class="notif-tab" [class.active]="activeTab() === 'inbox'" (click)="activeTab.set('inbox')">
          Inbox
          @if (unreadCount() > 0) {
            <span class="notif-badge">{{ unreadCount() }}</span>
          }
        </button>
        <button class="notif-tab" [class.active]="activeTab() === 'preferences'" (click)="activeTab.set('preferences')">
          Preferences
        </button>
      </div>

      <!-- ── INBOX TAB ── -->
      @if (activeTab() === 'inbox') {
        <div class="notif-inbox">
          @if (loading()) {
            <div class="notif-empty"><p>Loading notifications…</p></div>
          } @else if (notifications().length === 0) {
            <div class="notif-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>No notifications yet.</p>
            </div>
          } @else {
            <div class="notif-actions-row">
              @if (unreadCount() > 0) {
                <button class="notif-mark-all" (click)="markAllRead()">Mark all as read</button>
              }
            </div>
            <div class="notif-list">
              @for (n of notifications(); track n.id) {
                <div class="notif-item" [class.unread]="!n.read" (click)="markRead(n)">
                  <div class="notif-dot" [class.visible]="!n.read"></div>
                  <div class="notif-item-body">
                    <div class="notif-item-top">
                      <span class="notif-item-title">{{ n.title }}</span>
                      <span class="notif-item-date">{{ n.date }}</span>
                    </div>
                    <p class="notif-item-msg">{{ n.message }}</p>
                    @if (n.type) {
                      <span class="notif-type-tag">{{ n.type }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ── PREFERENCES TAB ── -->
      @if (activeTab() === 'preferences') {
        <div class="notif-prefs">

          <!-- How you get notified info banner -->
          <div class="np-info-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>How you'll receive notifications</strong>
              <p>Based on your preferences below, our agents will contact you directly via <strong>email</strong> when matching properties, projects, or price changes become available. You can update these preferences at any time.</p>
            </div>
          </div>

          <!-- Notify me about -->
          <div class="np-section-title">Notify me about</div>

          <!-- Property interest -->
          <div class="np-block">
            <p class="np-sub-label">Property interest</p>
            <div class="np-check-group">
              @for (item of interestOptions; track item.key) {
                <label class="np-check-item">
                  <input type="checkbox" [(ngModel)]="selectedInterests[item.key]" />
                  <span class="np-check-box"></span>
                  <span>{{ item.label }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Filters grid -->
          <div class="np-filters-grid">

            <!-- Budget -->
            <div class="np-filter-block">
              <p class="np-sub-label">Budget (AED)</p>
              <div class="np-budget-row">
                <div class="np-budget-field">
                  <label class="np-budget-label">Min</label>
                  <input type="number" class="np-budget-input" [(ngModel)]="rateMin" min="0" step="50000" placeholder="e.g. 500000" (change)="clampMin()" />
                </div>
                <span class="np-budget-sep">–</span>
                <div class="np-budget-field">
                  <label class="np-budget-label">Max</label>
                  @if (noMaxLimit) {
                    <div class="np-budget-nolimit">No limit</div>
                  } @else {
                    <input type="number" class="np-budget-input" [(ngModel)]="rateMax" [min]="rateMin" step="50000" placeholder="e.g. 5000000" (change)="clampMax()" />
                  }
                </div>
              </div>
              <label class="np-nolimit-toggle">
                <input type="checkbox" [(ngModel)]="noMaxLimit" />
                <span class="np-check-box"></span>
                <span>No upper limit</span>
              </label>
            </div>

            <!-- Location multi-select -->
            <div class="np-filter-block">
              <p class="np-sub-label">City / Location</p>
              <div class="np-dropdown-wrap" (click)="$event.stopPropagation()">
                <button type="button" class="np-dropdown-btn" (click)="toggleDrop('loc')">
                  @if (selectedLocations.length === 0) {
                    <span class="np-ph">Select locations…</span>
                  } @else {
                    <span class="np-dv">{{ selectedLocations.length }} location{{ selectedLocations.length !== 1 ? 's' : '' }}</span>
                  }
                  <svg class="np-arr" [class.open]="locDropOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                @if (locDropOpen()) {
                  <div class="np-dropdown-menu">
                    <div class="np-drop-search-wrap">
                      <input type="text" placeholder="Search…" [(ngModel)]="locSearch" class="np-drop-search" />
                    </div>
                    <div class="np-drop-opts">
                      @for (loc of filteredLocations(); track loc) {
                        <label class="np-drop-opt">
                          <input type="checkbox" [checked]="isLocSelected(loc)" (change)="toggleLoc(loc)" />
                          <span class="np-drop-cb"></span>
                          <span>{{ loc }}</span>
                        </label>
                      }
                    </div>
                    @if (selectedLocations.length > 0) {
                      <div class="np-drop-footer">
                        <button type="button" class="np-drop-clear" (click)="selectedLocations = []">Clear all</button>
                      </div>
                    }
                  </div>
                }
              </div>
              @if (selectedLocations.length > 0) {
                <div class="np-tags">
                  @for (loc of selectedLocations; track loc) {
                    <span class="np-tag">{{ loc }}<button type="button" class="np-tag-x" (click)="toggleLoc(loc)">×</button></span>
                  }
                </div>
              }
            </div>

            <!-- Projects multi-select -->
            <div class="np-filter-block">
              <p class="np-sub-label">Projects</p>
              <div class="np-dropdown-wrap" (click)="$event.stopPropagation()">
                <button type="button" class="np-dropdown-btn" (click)="toggleDrop('proj')">
                  @if (selectedProjects.length === 0) {
                    <span class="np-ph">Select projects…</span>
                  } @else {
                    <span class="np-dv">{{ selectedProjects.length }} project{{ selectedProjects.length !== 1 ? 's' : '' }}</span>
                  }
                  <svg class="np-arr" [class.open]="projDropOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                @if (projDropOpen()) {
                  <div class="np-dropdown-menu">
                    <div class="np-drop-search-wrap">
                      <input type="text" placeholder="Search projects…" [(ngModel)]="projSearch" class="np-drop-search" />
                    </div>
                    <div class="np-drop-opts">
                      @if (projectsLoading()) {
                        <div class="np-drop-loading">Loading…</div>
                      } @else if (filteredProjects().length === 0) {
                        <div class="np-drop-loading">No projects found</div>
                      } @else {
                        @for (p of filteredProjects(); track p.id) {
                          <label class="np-drop-opt">
                            <input type="checkbox" [checked]="isProjSelected(p.id)" (change)="toggleProj(p)" />
                            <span class="np-drop-cb"></span>
                            <span>{{ p.title }}</span>
                          </label>
                        }
                      }
                    </div>
                    @if (selectedProjects.length > 0) {
                      <div class="np-drop-footer">
                        <button type="button" class="np-drop-clear" (click)="selectedProjects = []">Clear all</button>
                      </div>
                    }
                  </div>
                }
              </div>
              @if (selectedProjects.length > 0) {
                <div class="np-tags">
                  @for (p of selectedProjects; track p.id) {
                    <span class="np-tag">{{ p.title }}<button type="button" class="np-tag-x" (click)="toggleProj(p)">×</button></span>
                  }
                </div>
              }
            </div>

            <!-- Property type -->
            <div class="np-filter-block">
              <p class="np-sub-label">Property type</p>
              <div class="np-check-group">
                @for (t of propTypes; track t) {
                  <label class="np-check-item">
                    <input type="checkbox" [(ngModel)]="selectedPropTypes[t]" />
                    <span class="np-check-box"></span>
                    <span>{{ t }}</span>
                  </label>
                }
              </div>
            </div>

          </div>

          <div class="np-save-row">
            <button class="np-save-btn" (click)="savePrefs()">Save Preferences</button>
            @if (prefsSaved()) {
              <span class="np-saved-msg">Preferences saved.</span>
            }
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;

    .notif-page { padding: 0; }

    /* Tabs */
    .notif-tabs { display: flex; border-bottom: 2px solid $border; margin-bottom: 1.5rem; }
    .notif-tab { background: none; border: none; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: $sub; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 0.5rem; transition: color 0.15s;
      &.active { color: $accent; border-bottom-color: $accent; font-weight: 700; }
      &:hover:not(.active) { color: $text; }
    }
    .notif-badge { background: #ef4444; color: #fff; font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 999px; }

    /* Inbox */
    .notif-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; gap: 0.75rem; color: $muted; text-align: center; p { font-size: 0.875rem; margin: 0; } }
    .notif-actions-row { display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }
    .notif-mark-all { background: none; border: none; font-size: 0.8rem; color: $accent; font-weight: 600; cursor: pointer; padding: 0; &:hover { text-decoration: underline; } }
    .notif-list { display: flex; flex-direction: column; border: 1px solid $border; border-radius: 0.75rem; overflow: hidden; }
    .notif-item { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid $border; cursor: pointer; transition: background 0.15s; align-items: flex-start;
      &:last-child { border-bottom: none; }
      &.unread { background: #f0fdf4; }
      &:hover { background: #f9fafb; }
    }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: $accent; flex-shrink: 0; margin-top: 6px; opacity: 0; &.visible { opacity: 1; } }
    .notif-item-body { flex: 1; min-width: 0; }
    .notif-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.3rem; }
    .notif-item-title { font-size: 0.875rem; font-weight: 600; color: $text; }
    .notif-item-date { font-size: 0.75rem; color: $muted; white-space: nowrap; flex-shrink: 0; }
    .notif-item-msg { font-size: 0.825rem; color: $sub; margin: 0 0 0.4rem; line-height: 1.4; }
    .notif-type-tag { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; background: #f3f4f6; color: $sub; }

    /* Prefs */
    .notif-prefs { max-width: 960px; }

    /* Info banner */
    .np-info-banner {
      display: flex; gap: 0.75rem; align-items: flex-start;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.625rem;
      padding: 0.875rem 1rem; margin-bottom: 1.75rem;
      svg { color: $accent; flex-shrink: 0; margin-top: 2px; }
      strong { font-size: 0.875rem; color: $text; font-weight: 600; display: block; margin-bottom: 0.3rem; }
      p { font-size: 0.8rem; color: $sub; margin: 0; line-height: 1.5; }
    }

    .np-section-title { font-size: 1rem; font-weight: 700; color: $text; margin-bottom: 1.25rem; }

    /* Block / sub-label */
    .np-block { margin-bottom: 1.5rem; }
    .np-sub-label { font-size: 0.73rem; font-weight: 700; color: $muted; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.6rem; }

    /* Checkboxes */
    .np-check-group { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
    .np-check-item {
      display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: $text; cursor: pointer;
      input[type=checkbox] { display: none; }
    }
    .np-check-box {
      width: 17px; height: 17px; border: 2px solid #d1d5db; border-radius: 4px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; background: #fff; transition: background 0.15s, border-color 0.15s;
    }
    .np-check-item input[type=checkbox]:checked + .np-check-box {
      background: $accent; border-color: $accent;
      &::after { content: ''; width: 4px; height: 8px; border: 2px solid #fff; border-top: none; border-left: none; transform: rotate(45deg) translate(-1px,-1px); display: block; }
    }

    /* Filters grid */
    .np-filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 2rem; position: relative; }
    .np-filter-block { position: relative; }

    /* Budget inputs */
    .np-budget-row { display: flex; align-items: flex-end; gap: 0.5rem; margin-bottom: 0.6rem; }
    .np-budget-field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
    .np-budget-label { font-size: 0.7rem; color: $muted; font-weight: 500; }
    .np-budget-sep { font-size: 1rem; color: $muted; padding-bottom: 0.45rem; flex-shrink: 0; }
    .np-budget-input {
      width: 100%; padding: 0.45rem 0.6rem; border: 1.5px solid #d1d5db; border-radius: 0.4rem;
      font-size: 0.85rem; color: $text; background: #fff;
      &:focus { outline: none; border-color: $accent; }
      &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; }
    }
    .np-budget-nolimit {
      padding: 0.45rem 0.6rem; border: 1.5px solid #d1d5db; border-radius: 0.4rem;
      font-size: 0.85rem; color: $muted; background: #f9fafb; font-style: italic;
    }
    .np-nolimit-toggle { display: flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; color: $sub; cursor: pointer; input[type=checkbox] { display: none; } }

    /* Dropdown */
    .np-dropdown-wrap { position: relative; }
    .np-dropdown-btn {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      padding: 0.55rem 0.75rem; border: 1.5px solid #d1d5db; border-radius: 0.5rem;
      background: #fff; cursor: pointer; font-size: 0.875rem; color: $text; text-align: left;
      transition: border-color 0.15s;
      &:hover, &:focus { border-color: $accent; outline: none; }
    }
    .np-ph { color: $muted; }
    .np-dv { color: $text; font-weight: 500; }
    .np-arr { width: 1rem; height: 1rem; color: $muted; flex-shrink: 0; transition: transform 0.2s; &.open { transform: rotate(180deg); } }
    .np-dropdown-menu {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
      background: #fff; border: 1.5px solid $border; border-radius: 0.5rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden;
    }
    .np-drop-search-wrap { padding: 0.5rem; border-bottom: 1px solid #f3f4f6; }
    .np-drop-search { width: 100%; padding: 0.4rem 0.6rem; border: 1px solid $border; border-radius: 0.375rem; font-size: 0.8rem; background: #f9fafb; &:focus { outline: none; border-color: $accent; } }
    .np-drop-opts { max-height: 210px; overflow-y: auto; padding: 0.3rem 0; }
    .np-drop-opt {
      display: flex; align-items: center; gap: 0.55rem; padding: 0.42rem 0.75rem;
      cursor: pointer; font-size: 0.84rem; color: $text; transition: background 0.1s;
      &:hover { background: #f0fdf4; }
      input[type=checkbox] { display: none; }
    }
    .np-drop-cb {
      width: 14px; height: 14px; border: 2px solid #d1d5db; border-radius: 3px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #fff;
    }
    .np-drop-opt input[type=checkbox]:checked + .np-drop-cb {
      background: $accent; border-color: $accent;
      &::after { content: ''; width: 3px; height: 6px; border: 1.5px solid #fff; border-top: none; border-left: none; transform: rotate(45deg) translate(-1px,-1px); display: block; }
    }
    .np-drop-footer { padding: 0.4rem 0.75rem; border-top: 1px solid #f3f4f6; }
    .np-drop-clear { font-size: 0.78rem; color: #dc2626; background: none; border: none; cursor: pointer; padding: 0; &:hover { text-decoration: underline; } }
    .np-drop-loading { padding: 0.75rem; font-size: 0.82rem; color: $muted; text-align: center; }

    /* Tags */
    .np-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
    .np-tag { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.45rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9999px; font-size: 0.72rem; color: #166534; font-weight: 500; }
    .np-tag-x { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 0.9rem; line-height: 1; padding: 0; margin-left: 0.1rem; &:hover { color: #dc2626; } }

    /* Save */
    .np-save-row { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; position: relative; z-index: 0; }
    .np-save-btn { padding: 0.6rem 1.5rem; background: $accent; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; &:hover { background: #154d31; } }
    .np-saved-msg { font-size: 0.85rem; color: #16a34a; }

    @media (max-width: 768px) {
      .np-filters-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CustomerNotificationsComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  private readonly STORAGE_KEY = 'lw_notif_prefs_v2';

  activeTab     = signal<Tab>('inbox');
  loading       = signal(true);
  notifications = signal<Notification[]>([]);
  prefsSaved    = signal(false);
  projectsLoading = signal(true);

  unreadCount = () => this.notifications().filter(n => !n.read).length;

  interestOptions = [
    { key: 'similar_property', label: 'Similar properties' },
    { key: 'all_projects',     label: 'All projects' },
    { key: 'commercial',       label: 'Commercial' },
  ];

  propTypes = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Office', 'Retail', 'Warehouse'];

  selectedInterests: Record<string, boolean> = {};
  selectedPropTypes: Record<string, boolean> = {};

  // Budget inputs
  readonly RATE_MIN = 0;
  rateMin = 500_000;
  rateMax = 5_000_000;
  noMaxLimit = false;

  // Location dropdown
  selectedLocations: string[] = [];
  locSearch = '';
  private _locDropOpen = signal(false);
  locDropOpen = this._locDropOpen.asReadonly();

  // Projects dropdown
  allProjects = signal<Project[]>([]);
  selectedProjects: Project[] = [];
  projSearch = '';
  private _projDropOpen = signal(false);
  projDropOpen = this._projDropOpen.asReadonly();

  filteredLocations = computed(() => {
    const q = this.locSearch.toLowerCase();
    return q ? DUBAI_LOCATIONS.filter(l => l.toLowerCase().includes(q)) : DUBAI_LOCATIONS;
  });

  filteredProjects = computed(() => {
    const q = this.projSearch.toLowerCase();
    return q ? this.allProjects().filter(p => p.title.toLowerCase().includes(q)) : this.allProjects();
  });

  clampMin() { if (this.rateMin < 0) this.rateMin = 0; }
  clampMax() { if (!this.noMaxLimit && this.rateMax < this.rateMin) this.rateMax = this.rateMin; }

  toggleDrop(which: 'loc' | 'proj') {
    if (which === 'loc') {
      this._locDropOpen.update(v => !v);
      this._projDropOpen.set(false);
      this.locSearch = '';
    } else {
      this._projDropOpen.update(v => !v);
      this._locDropOpen.set(false);
      this.projSearch = '';
    }
  }

  isLocSelected(l: string)  { return this.selectedLocations.includes(l); }
  isProjSelected(id: number) { return this.selectedProjects.some(p => p.id === id); }

  toggleLoc(loc: string) {
    if (this.isLocSelected(loc)) this.selectedLocations = this.selectedLocations.filter(l => l !== loc);
    else this.selectedLocations = [...this.selectedLocations, loc];
  }

  toggleProj(proj: Project) {
    if (this.isProjSelected(proj.id)) this.selectedProjects = this.selectedProjects.filter(p => p.id !== proj.id);
    else this.selectedProjects = [...this.selectedProjects, proj];
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.np-dropdown-wrap')) {
      this._locDropOpen.set(false);
      this._projDropOpen.set(false);
    }
  }

  constructor() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        this.selectedInterests = p.interests  ?? {};
        this.selectedPropTypes = p.propTypes  ?? {};
        this.rateMin           = p.rateMin    ?? 500_000;
        this.rateMax           = p.rateMax    ?? 5_000_000;
        this.noMaxLimit        = p.noMaxLimit ?? false;
        this.selectedLocations = p.locations  ?? [];
        this.selectedProjects  = p.projects   ?? [];
      }
    } catch {}
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    const [notifRes, projRes] = await Promise.all([
      this.sb.from('notifications')
        .select('id, title, message, type, read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      this.sb.from('projects')
        .select('id, title')
        .order('title', { ascending: true }),
    ]);

    if (notifRes.data) {
      this.notifications.set(notifRes.data.map((n: any) => ({
        id:         n.id,
        title:      n.title   || 'Notification',
        message:    n.message || '',
        type:       n.type    || '',
        read:       n.read    ?? false,
        created_at: n.created_at,
        date:       new Date(n.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
      })));
    }

    if (projRes.data) {
      this.allProjects.set(projRes.data.map((p: any) => ({ id: p.id, title: p.title || 'Untitled Project' })));
    }

    this.loading.set(false);
    this.projectsLoading.set(false);
  }

  async markRead(notif: Notification): Promise<void> {
    if (notif.read) return;
    notif.read = true;
    this.notifications.update(list => [...list]);
    await this.sb.from('notifications').update({ read: true }).eq('id', notif.id);
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    await this.sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }

  savePrefs(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        interests:  this.selectedInterests,
        propTypes:  this.selectedPropTypes,
        rateMin:    this.rateMin,
        rateMax:    this.noMaxLimit ? null : this.rateMax,
        noMaxLimit: this.noMaxLimit,
        locations:  this.selectedLocations,
        projects:   this.selectedProjects,
      }));
    } catch {}
    this.prefsSaved.set(true);
    setTimeout(() => this.prefsSaved.set(false), 3000);
  }
}
