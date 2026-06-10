import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

@Component({
  selector: 'app-customer-shortlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sl-page">
      <div class="sl-header">
        <div>
          <h1 class="sl-title">My Shortlist</h1>
          <p class="sl-sub">{{ items().length }} saved {{ items().length === 1 ? 'property' : 'properties' }}</p>
        </div>
        <a routerLink="/properties" class="sl-browse-btn">Browse More</a>
      </div>

      @if (loading()) {
        <div class="sl-empty"><p>Loading…</p></div>
      } @else if (items().length === 0) {
        <div class="sl-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <p>No saved properties yet.</p>
          <a routerLink="/properties">Browse listings →</a>
        </div>
      } @else {
        <div class="sl-grid">
          @for (item of items(); track item.savedRowId) {
            <a [routerLink]="['/properties', item.id]" class="sl-card">
              <div class="sl-img-wrap">
                <img [src]="item.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'"
                     [alt]="item.title" class="sl-img" loading="lazy">
                <span class="sl-badge">{{ item.listing_type }}</span>
              </div>
              <div class="sl-body">
                <div class="sl-price">AED {{ item.price | number }}</div>
                <div class="sl-name">{{ item.title }}</div>
                <div class="sl-specs">
                  @if (item.beds > 0) { <span>{{ item.beds }} Bed{{ item.beds > 1 ? 's' : '' }}</span> }
                  <span>· {{ item.baths }} Bath{{ item.baths > 1 ? 's' : '' }}</span>
                  @if (item.area) { <span>· {{ item.area | number }} sqft</span> }
                </div>
                <div class="sl-loc">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ item.location }}
                </div>
              </div>
              <div class="sl-footer">
                <span class="sl-agent">{{ item.agent }}</span>
                <span class="sl-saved">Saved {{ item.savedOn }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sl-page { padding: 0; }
    .sl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .sl-title { font-size: 1.4rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
    .sl-sub { font-size: 0.875rem; color: #6b7280; margin: 0; }
    .sl-browse-btn { padding: 0.55rem 1.25rem; background: #1a5c3a; color: #fff; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; &:hover { background: #154d31; } }
    .sl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1rem; color: #6b7280; text-align: center;
      p { font-size: 0.9rem; margin: 0; }
      a { font-size: 0.875rem; color: #1a5c3a; font-weight: 600; text-decoration: none; }
    }
    .sl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .sl-card { display: flex; flex-direction: column; border-radius: 0.75rem; border: 1px solid #e5e7eb; overflow: hidden; text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.2s; &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); } }
    .sl-img-wrap { position: relative; height: 180px; overflow: hidden; background: #f3f4f6; }
    .sl-img { width: 100%; height: 100%; object-fit: cover; }
    .sl-badge { position: absolute; top: 0.6rem; left: 0.6rem; background: #1a5c3a; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px; }
    .sl-body { padding: 0.875rem 1rem 0.5rem; flex: 1; }
    .sl-price { font-size: 1rem; font-weight: 700; color: #1a5c3a; margin-bottom: 0.25rem; }
    .sl-name { font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.4rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .sl-specs { font-size: 0.78rem; color: #6b7280; display: flex; gap: 0.25rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
    .sl-loc { font-size: 0.75rem; color: #9ca3af; display: flex; align-items: center; gap: 0.3rem; }
    .sl-footer { display: flex; justify-content: space-between; padding: 0.5rem 1rem 0.75rem; font-size: 0.72rem; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    .sl-agent { font-weight: 500; color: #6b7280; }
  `]
})
export class CustomerShortlistComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  loading = signal(true);
  items   = signal<any[]>([]);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    // Step 1: get saved rows
    const { data: saved } = await this.sb
      .from('saved_properties')
      .select('id, created_at, property_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!saved || saved.length === 0) { this.loading.set(false); return; }

    // Step 2: fetch matching properties
    const propIds = saved.map((r: any) => r.property_id);
    const { data: props } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, bedrooms, bathrooms, area_sqft, type, listing_type, images, agent_name')
      .in('id', propIds);

    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));
    this.items.set(saved
      .map((r: any) => {
        const p = propMap.get(r.property_id);
        if (!p) return null;
        return {
          savedRowId:   r.id,
          id:           p.id,
          title:        p.title        || '',
          location:     [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
          price:        p.price        || 0,
          listing_type: p.listing_type || 'Sale',
          beds:         p.bedrooms     || 0,
          baths:        p.bathrooms    || 0,
          area:         p.area_sqft    || 0,
          agent:        p.agent_name   || 'Livwell Agent',
          image:        (p.images && p.images[0]) || '',
          savedOn:      new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      })
      .filter(Boolean));
    this.loading.set(false);
  }
}
