import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { toProjectSlug, toPropertySlug } from '../../shared/utils/slug';

@Component({
  selector: 'app-customer-shortlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sl-page">
      <div class="sl-header">
        <div>
          <h1 class="sl-title">My Shortlist</h1>
          <p class="sl-sub">{{ items().length }} saved {{ items().length === 1 ? 'property' : 'properties' }} · {{ projectItems().length }} interested {{ projectItems().length === 1 ? 'project' : 'projects' }}</p>
        </div>
        <div class="sl-header-actions">
          <a routerLink="/properties" class="sl-browse-btn">Browse Properties</a>
          <a routerLink="/projects" class="sl-browse-btn sl-browse-btn--outline">Browse Projects</a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="sl-tabs">
        <button class="sl-tab" [class.active]="tab() === 'properties'" (click)="tab.set('properties')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Properties <span class="sl-tab-count">{{ items().length }}</span>
        </button>
        <button class="sl-tab" [class.active]="tab() === 'projects'" (click)="tab.set('projects')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Projects <span class="sl-tab-count">{{ projectItems().length }}</span>
        </button>
      </div>

      @if (loading()) {
        <div class="sl-empty"><p>Loading…</p></div>
      } @else if (tab() === 'properties') {
        @if (items().length === 0) {
          <div class="sl-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <p>No saved properties yet.</p>
            <a routerLink="/properties">Browse listings →</a>
          </div>
        } @else {
          <div class="sl-grid">
            @for (item of items(); track item.savedRowId) {
              <a [routerLink]="['/properties', propertySlug(item.title, item.id)]" class="sl-card">
                <div class="sl-img-wrap">
                  <img [src]="item.image || '/images/dummy-image.png'"
                       [alt]="item.title" class="sl-img" loading="lazy"
                       (error)="$any($event.target).src='/images/dummy-image.png'">
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
      } @else {
        @if (projectItems().length === 0) {
          <div class="sl-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            <p>No interested projects yet.</p>
            <a routerLink="/projects">Browse projects →</a>
          </div>
        } @else {
          <div class="sl-grid">
            @for (item of projectItems(); track item.id) {
              <a [routerLink]="['/projects', projectSlug(item.title, item.id)]" class="sl-card">
                <div class="sl-img-wrap">
                  <img [src]="item.image || '/images/dummy-image.png'"
                       [alt]="item.title" class="sl-img" loading="lazy"
                       (error)="$any($event.target).src='/images/dummy-image.png'">
                  <span class="sl-badge sl-badge--project">{{ item.badge || 'Off-Plan' }}</span>
                </div>
                <div class="sl-body">
                  <div class="sl-price">{{ item.priceLabel }}</div>
                  <div class="sl-name">{{ item.title }}</div>
                  <div class="sl-specs">
                    @if (item.developer) { <span>{{ item.developer }}</span> }
                    @if (item.beds) { <span>· {{ item.beds }}</span> }
                  </div>
                  <div class="sl-loc">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ item.location }}
                  </div>
                </div>
                <div class="sl-footer">
                  <span class="sl-agent">{{ item.status || 'Off-Plan' }}</span>
                  <span class="sl-saved">Enquired {{ item.enquiredOn }}</span>
                </div>
              </a>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .sl-page { padding: 0; }
    .sl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }
    .sl-title { font-size: 1.4rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
    .sl-sub { font-size: 0.875rem; color: #6b7280; margin: 0; }
    .sl-header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .sl-browse-btn { padding: 0.55rem 1.25rem; background: #1a5c3a; color: #fff; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; &:hover { background: #154d31; }
      &--outline { background: transparent; border: 1.5px solid #1a5c3a; color: #1a5c3a; &:hover { background: #f0fdf4; } }
    }
    .sl-tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.25rem; }
    .sl-tab { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.875rem; font-weight: 600; color: #6b7280; cursor: pointer; transition: color 0.15s, border-color 0.15s;
      &.active { color: #1a5c3a; border-bottom-color: #1a5c3a; }
      &:hover:not(.active) { color: #374151; }
    }
    .sl-tab-count { background: #f3f4f6; color: #6b7280; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; min-width: 1.2rem; text-align: center; }
    .sl-tab.active .sl-tab-count { background: #dcfce7; color: #166534; }
    .sl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1rem; color: #6b7280; text-align: center;
      p { font-size: 0.9rem; margin: 0; }
      a { font-size: 0.875rem; color: #1a5c3a; font-weight: 600; text-decoration: none; }
    }
    .sl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .sl-card { display: flex; flex-direction: column; border-radius: 0.75rem; border: 1px solid #e5e7eb; overflow: hidden; text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.2s; &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); } }
    .sl-img-wrap { position: relative; height: 180px; overflow: hidden; background: #f3f4f6; }
    .sl-img { width: 100%; height: 100%; object-fit: cover; }
    .sl-badge { position: absolute; top: 0.6rem; left: 0.6rem; background: #1a5c3a; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 999px;
      &--project { background: #0284c7; }
    }
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

  loading      = signal(true);
  tab          = signal<'properties' | 'projects'>('properties');
  items        = signal<any[]>([]);
  projectItems = signal<any[]>([]);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    const userId = user?.id;
    if (!userId) { this.loading.set(false); return; }

    await Promise.all([
      this.loadProperties(userId),
      this.loadInterestedProjects(userId),
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
  }

  private async loadInterestedProjects(userId: string): Promise<void> {
    if (!userId) return;
    const { data: saved } = await this.sb
      .from('saved_projects')
      .select('id, project_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!saved || saved.length === 0) return;

    const projectIds = saved.map((r: any) => r.project_id);
    const { data: projects } = await this.sb
      .from('projects')
      .select('id, title, developer, location, type, price_from, price_label, beds, status, badge, images')
      .in('id', projectIds);

    const projectMap = new Map((projects ?? []).map((p: any) => [p.id, p]));
    this.projectItems.set(saved
      .filter((r: any) => projectMap.has(r.project_id))
      .map((r: any) => {
        const p = projectMap.get(r.project_id);
        return {
          id:         p.id,
          title:      p.title      || '',
          developer:  p.developer  || '',
          location:   p.location   || 'Dubai',
          priceLabel: p.price_label || (p.price_from ? `AED ${Number(p.price_from).toLocaleString()}` : 'Price on request'),
          beds:       p.beds       || '',
          status:     p.status     || 'Off-Plan',
          badge:      p.badge      || 'Off-Plan',
          image:      (p.images && p.images[0]) || '',
          enquiredOn: new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      }));
  }

  projectSlug(title: string, id: number): string {
    return toProjectSlug(title, id);
  }

  propertySlug(title: string, id: number): string {
    return toPropertySlug(title, id);
  }
}
