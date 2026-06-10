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

@Component({
  selector: 'app-customer-value-tracker',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="vt-page">
      <div class="vt-header">
        <div>
          <h1 class="vt-title">Property Value Tracker</h1>
          <p class="vt-sub">Monitor the value of properties you've saved</p>
        </div>
        <a routerLink="/properties" class="vt-btn">Browse Properties</a>
      </div>

      @if (loading()) {
        <div class="vt-empty"><p>Loading…</p></div>
      } @else if (items().length === 0) {
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
                      <img [src]="p.image" [alt]="p.title" class="vt-thumb">
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
    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;
    .vt-page { padding: 0; }
    .vt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .vt-title { font-size: 1.4rem; font-weight: 700; color: $text; margin: 0 0 0.25rem; }
    .vt-sub { font-size: 0.875rem; color: $sub; margin: 0; }
    .vt-btn { padding: 0.55rem 1.25rem; background: $accent; color: #fff; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; &:hover { background: #154d31; } }
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
    .vt-tag { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; background: #f3f4f6; color: $sub;
      &--sale { background: #eff6ff; color: #1d4ed8; }
      &--rent { background: #f0fdf4; color: $accent; }
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

  loading = signal(true);
  items   = signal<TrackedProp[]>([]);

  totalValue = () => this.items().reduce((s, p) => s + p.price, 0);
  avgPrice   = () => this.items().length ? Math.round(this.totalValue() / this.items().length) : 0;

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    const { data: saved } = await this.sb
      .from('saved_properties')
      .select('id, property_id')
      .eq('user_id', userId);

    if (!saved || saved.length === 0) { this.loading.set(false); return; }

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
        image:        (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=60',
      };
    }).filter(Boolean) as TrackedProp[]);
    this.loading.set(false);
  }
}
