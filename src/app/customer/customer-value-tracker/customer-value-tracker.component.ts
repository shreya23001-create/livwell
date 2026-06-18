import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface TrackedProp {
  id: number;
  title: string;
  location: string;
  price: number;
  pricePerSqft: number;
  area: number;
  type: string;
  listing_type: string;
  image: string;
}

interface TrackedProject {
  id: number;
  title: string;
  developer: string;
  location: string;
  priceFrom: number;
  priceLabel: string;
  type: string;
  status: string;
  badge: string;
  image: string;
}

@Component({
  selector: 'app-customer-value-tracker',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="vt-page">
      <div class="vt-header">
        <div>
          <h1 class="vt-title">Value Tracker</h1>
          <p class="vt-sub">Monitor the value of properties &amp; off-plan projects</p>
        </div>
        <div class="vt-header-actions">
          <a routerLink="/properties" class="vt-btn">Browse Properties</a>
          <a routerLink="/projects" class="vt-btn vt-btn--outline">Browse Projects</a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="vt-tabs">
        <button class="vt-tab" [class.active]="tab() === 'properties'" (click)="tab.set('properties')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Properties <span class="vt-tab-count">{{ items().length }}</span>
        </button>
        <button class="vt-tab" [class.active]="tab() === 'projects'" (click)="tab.set('projects')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Projects <span class="vt-tab-count">{{ projectItems().length }}</span>
        </button>
      </div>

      @if (loading()) {
        <div class="vt-empty"><p>Loading…</p></div>
      } @else if (tab() === 'properties') {
        @if (items().length === 0) {
          <div class="vt-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <h3>No properties tracked yet</h3>
            <p>Save properties using the ❤ button to track their values here.</p>
            <a routerLink="/properties" class="vt-link">Browse listings →</a>
          </div>
        } @else {
          <div class="vt-table-wrap">
            <table class="vt-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th class="vt-num">Area (sqft)</th>
                  <th class="vt-num">Price/sqft</th>
                  <th class="vt-num">Current Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of items(); track p.id) {
                  <tr>
                    <td>
                      <div class="vt-prop-cell">
                        <img [src]="p.image" [alt]="p.title" class="vt-thumb"
                             (error)="$any($event.target).src='/images/dummy-image.png'">
                        <div>
                          <div class="vt-prop-name">{{ p.title }}</div>
                          <div class="vt-prop-loc">{{ p.location }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="vt-tag">{{ p.type }}</span></td>
                    <td><span class="vt-tag vt-tag--{{ p.listing_type === 'Rent' ? 'rent' : 'sale' }}">{{ p.listing_type }}</span></td>
                    <td class="vt-num">{{ p.area | number }}</td>
                    <td class="vt-num">{{ p.pricePerSqft > 0 ? ('AED ' + (p.pricePerSqft | number:'1.0-0')) : '—' }}</td>
                    <td class="vt-num vt-price">AED {{ p.price | number }}</td>
                    <td><a [routerLink]="['/properties', p.id]" class="vt-view">View →</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="vt-summary">
            <div class="vt-stat">
              <div class="vt-stat-val">{{ items().length }}</div>
              <div class="vt-stat-label">Properties Tracked</div>
            </div>
            <div class="vt-stat">
              <div class="vt-stat-val">AED {{ totalValue() | number }}</div>
              <div class="vt-stat-label">Total Portfolio Value</div>
            </div>
            <div class="vt-stat">
              <div class="vt-stat-val">AED {{ avgPrice() | number }}</div>
              <div class="vt-stat-label">Average Price</div>
            </div>
          </div>
        }
      } @else {
        @if (projectItems().length === 0) {
          <div class="vt-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            <h3>No off-plan projects tracked yet</h3>
            <p>Enquire on off-plan projects to track their values here.</p>
            <a routerLink="/projects" class="vt-link">Browse projects →</a>
          </div>
        } @else {
          <div class="vt-table-wrap">
            <table class="vt-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Developer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th class="vt-num">Starting Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of projectItems(); track p.id) {
                  <tr>
                    <td>
                      <div class="vt-prop-cell">
                        <img [src]="p.image" [alt]="p.title" class="vt-thumb"
                             (error)="$any($event.target).src='/images/dummy-image.png'">
                        <div>
                          <div class="vt-prop-name">{{ p.title }}</div>
                          <div class="vt-prop-loc">{{ p.location }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="vt-dev">{{ p.developer || '—' }}</td>
                    <td><span class="vt-tag">{{ p.type || 'Residential' }}</span></td>
                    <td><span class="vt-tag vt-tag--project">{{ p.badge || 'Off-Plan' }}</span></td>
                    <td class="vt-num vt-price">{{ p.priceLabel }}</td>
                    <td><a [routerLink]="['/projects', p.id]" class="vt-view">View →</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="vt-summary">
            <div class="vt-stat">
              <div class="vt-stat-val">{{ projectItems().length }}</div>
              <div class="vt-stat-label">Projects Tracked</div>
            </div>
            <div class="vt-stat">
              <div class="vt-stat-val">AED {{ totalProjectValue() | number }}</div>
              <div class="vt-stat-label">Total Starting Value</div>
            </div>
            <div class="vt-stat">
              <div class="vt-stat-val">AED {{ avgProjectPrice() | number }}</div>
              <div class="vt-stat-label">Average Starting Price</div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;
    .vt-page { padding: 0; }
    .vt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .vt-title { font-size: 1.4rem; font-weight: 700; color: $text; margin: 0 0 0.25rem; }
    .vt-sub { font-size: 0.875rem; color: $sub; margin: 0; }
    .vt-header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .vt-btn { padding: 0.55rem 1.25rem; background: $accent; color: #fff; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; &:hover { background: #154d31; }
      &--outline { background: transparent; border: 1.5px solid $accent; color: $accent; &:hover { background: #f0fdf4; } }
    }
    .vt-tabs { display: flex; gap: 0; border-bottom: 2px solid $border; margin-bottom: 1.25rem; }
    .vt-tab { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.875rem; font-weight: 600; color: $sub; cursor: pointer; transition: color 0.15s, border-color 0.15s;
      &.active { color: $accent; border-bottom-color: $accent; }
      &:hover:not(.active) { color: #374151; }
    }
    .vt-tab-count { background: #f3f4f6; color: $sub; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; min-width: 1.2rem; text-align: center; }
    .vt-tab.active .vt-tab-count { background: #dcfce7; color: #166534; }
    .vt-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; gap: 1rem; color: $sub; text-align: center;
      h3 { font-size: 1.1rem; font-weight: 600; color: $text; margin: 0; }
      p { font-size: 0.875rem; margin: 0; }
    }
    .vt-link { font-size: 0.875rem; color: $accent; font-weight: 600; text-decoration: none; }
    .vt-table-wrap { overflow-x: auto; border: 1px solid $border; border-radius: 0.75rem; margin-bottom: 1.5rem; }
    .vt-table { width: 100%; border-collapse: collapse; font-size: 0.85rem;
      th { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: $sub; background: #f9fafb; border-bottom: 1px solid $border; white-space: nowrap; }
      td { padding: 0.875rem 1rem; border-bottom: 1px solid $border; color: $text; vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fafafa; }
    }
    .vt-num { text-align: right; }
    .vt-prop-cell { display: flex; align-items: center; gap: 0.75rem; }
    .vt-thumb { width: 48px; height: 40px; object-fit: cover; border-radius: 0.375rem; flex-shrink: 0; }
    .vt-prop-name { font-weight: 600; color: $text; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .vt-prop-loc { font-size: 0.75rem; color: $muted; }
    .vt-dev { font-size: 0.82rem; color: $sub; }
    .vt-tag { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; background: #f3f4f6; color: $sub;
      &--sale { background: #eff6ff; color: #1d4ed8; }
      &--rent { background: #f0fdf4; color: $accent; }
      &--project { background: #e0f2fe; color: #0284c7; }
    }
    .vt-price { font-weight: 700; color: $accent; }
    .vt-view { font-size: 0.8rem; color: $accent; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .vt-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .vt-stat { background: #fff; border: 1px solid $border; border-radius: 0.75rem; padding: 1.25rem 1.5rem; }
    .vt-stat-val { font-size: 1.25rem; font-weight: 800; color: $accent; margin-bottom: 0.25rem; }
    .vt-stat-label { font-size: 0.8rem; color: $sub; }
    @media (max-width: 640px) { .vt-summary { grid-template-columns: 1fr; } }
  `]
})
export class CustomerValueTrackerComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  loading      = signal(true);
  tab          = signal<'properties' | 'projects'>('properties');
  items        = signal<TrackedProp[]>([]);
  projectItems = signal<TrackedProject[]>([]);

  totalValue       = () => this.items().reduce((s, p) => s + p.price, 0);
  avgPrice         = () => this.items().length ? Math.round(this.totalValue() / this.items().length) : 0;
  totalProjectValue = () => this.projectItems().reduce((s, p) => s + p.priceFrom, 0);
  avgProjectPrice   = () => this.projectItems().length ? Math.round(this.totalProjectValue() / this.projectItems().length) : 0;

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    const userId = user?.id;
    if (!userId) { this.loading.set(false); return; }

    await Promise.all([
      this.loadProperties(userId),
      this.loadProjects(user?.email ?? ''),
    ]);
    this.loading.set(false);
  }

  private async loadProperties(userId: string): Promise<void> {
    const { data: saved } = await this.sb
      .from('saved_properties')
      .select('id, property_id')
      .eq('user_id', userId);

    if (!saved || saved.length === 0) return;

    const propIds = saved.map((r: any) => r.property_id);
    const { data: props } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, area_sqft, type, listing_type, images')
      .in('id', propIds);

    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));
    this.items.set(saved.map((r: any) => {
      const p = propMap.get(r.property_id);
      if (!p) return null;
      const price = p.price || 0;
      const area  = p.area_sqft || 0;
      return {
        id:           p.id,
        title:        p.title || '',
        location:     [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
        price,
        pricePerSqft: area > 0 ? Math.round(price / area) : 0,
        area,
        type:         p.type || '',
        listing_type: p.listing_type || 'Sale',
        image:        (p.images && p.images[0]) || '/images/dummy-image.png',
      };
    }).filter(Boolean) as TrackedProp[]);
  }

  private async loadProjects(email: string): Promise<void> {
    if (!email) return;
    const { data: leads } = await this.sb
      .from('admin_leads')
      .select('id, project_id')
      .eq('email', email)
      .not('project_id', 'is', null);

    if (!leads || leads.length === 0) return;

    const projectIds = [...new Set(leads.map((r: any) => r.project_id))];
    const { data: projects } = await this.sb
      .from('projects')
      .select('id, title, developer, location, type, price_from, price_label, status, badge, images')
      .in('id', projectIds);

    this.projectItems.set((projects ?? []).map((p: any) => ({
      id:         p.id,
      title:      p.title      || '',
      developer:  p.developer  || '',
      location:   p.location   || 'Dubai',
      priceFrom:  p.price_from || 0,
      priceLabel: p.price_label || (p.price_from ? `AED ${Number(p.price_from).toLocaleString()}` : 'Price on request'),
      type:       p.type       || 'Residential',
      status:     p.status     || 'Off-Plan',
      badge:      p.badge      || 'Off-Plan',
      image:      (p.images && p.images[0]) || '/images/dummy-image.png',
    })) as TrackedProject[]);
  }
}
