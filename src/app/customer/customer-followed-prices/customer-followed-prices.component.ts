import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { toProjectSlug } from '../../shared/utils/slug';

interface TrackedProperty {
  id: number;
  title: string;
  location: string;
  currentPrice: number;
  type: string;
  listing_type: string;
  image: string;
  savedOn: string;
}

interface TrackedProject {
  id: number;
  title: string;
  developer: string;
  location: string;
  priceFrom: number;
  priceLabel: string;
  type: string;
  badge: string;
  image: string;
  enquiredOn: string;
}

@Component({
  selector: 'app-customer-followed-prices',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fp-page">
      <div class="fp-header">
        <div>
          <h1 class="fp-title">My Followed Prices</h1>
          <p class="fp-sub">Track prices on your saved properties &amp; interested projects</p>
        </div>
        <div class="fp-header-actions">
          <a routerLink="/properties" class="fp-browse-btn">Browse Properties</a>
          <a routerLink="/projects" class="fp-browse-btn fp-browse-btn--outline">Browse Projects</a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="fp-tabs">
        <button class="fp-tab" [class.active]="tab() === 'properties'" (click)="tab.set('properties')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Properties <span class="fp-tab-count">{{ items().length }}</span>
        </button>
        <button class="fp-tab" [class.active]="tab() === 'projects'" (click)="tab.set('projects')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Projects <span class="fp-tab-count">{{ projectItems().length }}</span>
        </button>
      </div>

      @if (loading()) {
        <div class="fp-empty"><p>Loading…</p></div>
      } @else if (tab() === 'properties') {
        @if (items().length === 0) {
          <div class="fp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <h3>No followed properties yet</h3>
            <p>Save properties using the ❤ button to track their prices here.</p>
            <a routerLink="/properties" class="fp-link">Browse listings →</a>
          </div>
        } @else {
          <div class="fp-grid">
            @for (item of items(); track item.id) {
              <a [routerLink]="['/properties', item.id]" class="fp-card">
                <div class="fp-img-wrap">
                  <img [src]="item.image" [alt]="item.title" class="fp-img" loading="lazy"
                       (error)="$any($event.target).src='/images/dummy-image.png'">
                  <span class="fp-badge">{{ item.listing_type }}</span>
                </div>
                <div class="fp-body">
                  <div class="fp-name">{{ item.title }}</div>
                  <div class="fp-loc">{{ item.location }}</div>
                  <div class="fp-price-row">
                    <div class="fp-price">AED {{ item.currentPrice | number }}</div>
                    <span class="fp-price-label">Current Price</span>
                  </div>
                  <div class="fp-type">{{ item.type }}</div>
                </div>
                <div class="fp-footer">
                  <span class="fp-saved-on">Following since {{ item.savedOn }}</span>
                  <span class="fp-view">View →</span>
                </div>
              </a>
            }
          </div>
        }
      } @else {
        @if (projectItems().length === 0) {
          <div class="fp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            <h3>No followed project prices yet</h3>
            <p>Enquire on projects to track their prices here.</p>
            <a routerLink="/projects" class="fp-link">Browse projects →</a>
          </div>
        } @else {
          <div class="fp-grid">
            @for (item of projectItems(); track item.id) {
              <a [routerLink]="['/projects', projectSlug(item.title, item.id)]" class="fp-card">
                <div class="fp-img-wrap">
                  <img [src]="item.image" [alt]="item.title" class="fp-img" loading="lazy"
                       (error)="$any($event.target).src='/images/dummy-image.png'">
                  <span class="fp-badge fp-badge--project">{{ item.badge }}</span>
                </div>
                <div class="fp-body">
                  <div class="fp-name">{{ item.title }}</div>
                  <div class="fp-loc">{{ item.location }}</div>
                  <div class="fp-price-row">
                    <div class="fp-price">{{ item.priceLabel }}</div>
                    <span class="fp-price-label">Starting From</span>
                  </div>
                  <div class="fp-type">{{ item.developer }}{{ item.type ? ' · ' + item.type : '' }}</div>
                </div>
                <div class="fp-footer">
                  <span class="fp-saved-on">Enquired {{ item.enquiredOn }}</span>
                  <span class="fp-view">View →</span>
                </div>
              </a>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;
    .fp-page { padding: 0; }
    .fp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .fp-title { font-size: 1.4rem; font-weight: 700; color: $text; margin: 0 0 0.25rem; }
    .fp-sub { font-size: 0.875rem; color: $sub; margin: 0; }
    .fp-header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .fp-browse-btn { padding: 0.55rem 1.25rem; background: $accent; color: #fff; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; &:hover { background: #154d31; }
      &--outline { background: transparent; border: 1.5px solid $accent; color: $accent; &:hover { background: #f0fdf4; } }
    }
    .fp-tabs { display: flex; gap: 0; border-bottom: 2px solid $border; margin-bottom: 1.25rem; }
    .fp-tab { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.875rem; font-weight: 600; color: $sub; cursor: pointer; transition: color 0.15s, border-color 0.15s;
      &.active { color: $accent; border-bottom-color: $accent; }
      &:hover:not(.active) { color: #374151; }
    }
    .fp-tab-count { background: #f3f4f6; color: $sub; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; min-width: 1.2rem; text-align: center; }
    .fp-tab.active .fp-tab-count { background: #dcfce7; color: #166534; }
    .fp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; gap: 1rem; color: $sub; text-align: center;
      h3 { font-size: 1.1rem; font-weight: 600; color: $text; margin: 0; }
      p { font-size: 0.875rem; margin: 0; }
    }
    .fp-link { font-size: 0.875rem; color: $accent; font-weight: 600; text-decoration: none; }
    .fp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .fp-card { display: flex; flex-direction: column; border-radius: 0.75rem; border: 1px solid $border; overflow: hidden; text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.2s; &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); } }
    .fp-img-wrap { position: relative; height: 160px; overflow: hidden; background: #f3f4f6; }
    .fp-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .fp-badge { position: absolute; top: 0.6rem; left: 0.6rem; background: $accent; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px;
      &--project { background: #0284c7; }
    }
    .fp-body { padding: 0.875rem 1rem 0.5rem; flex: 1; }
    .fp-name { font-size: 0.875rem; font-weight: 700; color: $text; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fp-loc { font-size: 0.75rem; color: $muted; margin-bottom: 0.75rem; }
    .fp-price-row { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.4rem; }
    .fp-price { font-size: 1.05rem; font-weight: 800; color: $accent; }
    .fp-price-label { font-size: 0.72rem; color: $muted; }
    .fp-type { font-size: 0.75rem; color: $sub; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fp-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem 0.75rem; border-top: 1px solid #f3f4f6; font-size: 0.72rem; color: $muted; }
    .fp-view { color: $accent; font-weight: 600; }
    @media (max-width: 1024px) { .fp-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 640px) { .fp-grid { grid-template-columns: 1fr; } }
  `]
})
export class CustomerFollowedPricesComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  loading      = signal(true);
  tab          = signal<'properties' | 'projects'>('properties');
  items        = signal<TrackedProperty[]>([]);
  projectItems = signal<TrackedProject[]>([]);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    const userId = user?.id;
    if (!userId) { this.loading.set(false); return; }

    await Promise.all([
      this.loadProperties(userId),
      this.loadProjectPrices(user?.email ?? ''),
    ]);
    this.loading.set(false);
  }

  private async loadProperties(userId: string): Promise<void> {
    const { data: saved } = await this.sb
      .from('saved_properties')
      .select('id, created_at, property_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!saved || saved.length === 0) return;

    const propIds = saved.map((r: any) => r.property_id);
    const { data: props } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, type, listing_type, images')
      .in('id', propIds);

    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));
    this.items.set(saved.map((r: any) => {
      const p = propMap.get(r.property_id);
      if (!p) return null;
      return {
        id:           p.id,
        title:        p.title || '',
        location:     [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
        currentPrice: p.price || 0,
        type:         p.type || '',
        listing_type: p.listing_type || 'Sale',
        image:        (p.images && p.images[0]) || '/images/dummy-image.png',
        savedOn:      new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
    }).filter(Boolean) as TrackedProperty[]);
  }

  private async loadProjectPrices(email: string): Promise<void> {
    if (!email) return;
    const { data: leads } = await this.sb
      .from('admin_leads')
      .select('id, project_id, created_at')
      .eq('email', email)
      .not('project_id', 'is', null)
      .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) return;

    const projectIds = [...new Set(leads.map((r: any) => r.project_id))];
    const { data: projects } = await this.sb
      .from('projects')
      .select('id, title, developer, location, type, price_from, price_label, badge, images')
      .in('id', projectIds);

    const projectMap = new Map((projects ?? []).map((p: any) => [p.id, p]));
    const seen = new Set<number>();
    this.projectItems.set(leads
      .filter((r: any) => {
        if (seen.has(r.project_id)) return false;
        seen.add(r.project_id);
        return projectMap.has(r.project_id);
      })
      .map((r: any) => {
        const p = projectMap.get(r.project_id);
        return {
          id:          p.id,
          title:       p.title       || '',
          developer:   p.developer   || '',
          location:    p.location    || 'Dubai',
          priceFrom:   p.price_from  || 0,
          priceLabel:  p.price_label || (p.price_from ? `AED ${Number(p.price_from).toLocaleString()}` : 'Price on request'),
          type:        p.type        || '',
          badge:       p.badge       || 'Off-Plan',
          image:       (p.images && p.images[0]) || '/images/dummy-image.png',
          enquiredOn:  new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      }) as TrackedProject[]);
  }

  projectSlug(title: string, id: number): string {
    return toProjectSlug(title, id);
  }
}
