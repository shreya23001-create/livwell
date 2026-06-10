import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

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

@Component({
  selector: 'app-customer-followed-prices',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fp-page">
      <div class="fp-header">
        <div>
          <h1 class="fp-title">My Followed Prices</h1>
          <p class="fp-sub">Track price changes on your saved properties</p>
        </div>
        <a routerLink="/properties" class="fp-browse-btn">Browse Properties</a>
      </div>

      @if (loading()) {
        <div class="fp-empty"><p>Loading…</p></div>
      } @else if (items().length === 0) {
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
                <img [src]="item.image" [alt]="item.title" class="fp-img" loading="lazy">
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
    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;
    .fp-page { padding: 0; }
    .fp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .fp-title { font-size: 1.4rem; font-weight: 700; color: $text; margin: 0 0 0.25rem; }
    .fp-sub { font-size: 0.875rem; color: $sub; margin: 0; }
    .fp-browse-btn { padding: 0.55rem 1.25rem; background: $accent; color: #fff; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; &:hover { background: #154d31; } }
    .fp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; gap: 1rem; color: $sub; text-align: center;
      h3 { font-size: 1.1rem; font-weight: 600; color: $text; margin: 0; }
      p { font-size: 0.875rem; margin: 0; }
    }
    .fp-link { font-size: 0.875rem; color: $accent; font-weight: 600; text-decoration: none; }
    .fp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .fp-card { display: flex; flex-direction: column; border-radius: 0.75rem; border: 1px solid $border; overflow: hidden; text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.2s; &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); } }
    .fp-img-wrap { position: relative; height: 160px; overflow: hidden; background: #f3f4f6; }
    .fp-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .fp-badge { position: absolute; top: 0.6rem; left: 0.6rem; background: $accent; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px; }
    .fp-body { padding: 0.875rem 1rem 0.5rem; flex: 1; }
    .fp-name { font-size: 0.875rem; font-weight: 700; color: $text; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fp-loc { font-size: 0.75rem; color: $muted; margin-bottom: 0.75rem; }
    .fp-price-row { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.4rem; }
    .fp-price { font-size: 1.05rem; font-weight: 800; color: $accent; }
    .fp-price-label { font-size: 0.72rem; color: $muted; }
    .fp-type { font-size: 0.75rem; color: $sub; }
    .fp-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem 0.75rem; border-top: 1px solid #f3f4f6; font-size: 0.72rem; color: $muted; }
    .fp-view { color: $accent; font-weight: 600; }
    @media (max-width: 1024px) { .fp-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 640px) { .fp-grid { grid-template-columns: 1fr; } }
  `]
})
export class CustomerFollowedPricesComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  loading = signal(true);
  items   = signal<TrackedProperty[]>([]);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    const { data: saved } = await this.sb
      .from('saved_properties')
      .select('id, created_at, property_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!saved || saved.length === 0) { this.loading.set(false); return; }

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
        image:        (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
        savedOn:      new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
    }).filter(Boolean) as TrackedProperty[]);
    this.loading.set(false);
  }
}
