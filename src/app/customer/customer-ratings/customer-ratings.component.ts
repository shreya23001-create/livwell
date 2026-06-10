import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface RatableProperty {
  id: number;
  title: string;
  location: string;
  type: string;
  image: string;
  myRating: number;
  myReview: string;
  submitting: boolean;
  submitted: boolean;
}

@Component({
  selector: 'app-customer-ratings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="rt-page">
      <div class="rt-header">
        <div>
          <h1 class="rt-title">My Project Ratings</h1>
          <p class="rt-sub">Rate and review properties you've saved</p>
        </div>
      </div>

      @if (loading()) {
        <div class="rt-empty"><p>Loading…</p></div>
      } @else if (items().length === 0) {
        <div class="rt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3>No properties to rate yet</h3>
          <p>Save properties using the ❤ button, then come back to rate them.</p>
          <a routerLink="/properties" class="rt-link">Browse listings →</a>
        </div>
      } @else {
        <div class="rt-grid">
          @for (item of items(); track item.id) {
            <div class="rt-card">
              <div class="rt-card-top">
                <img [src]="item.image" [alt]="item.title" class="rt-img">
                <div class="rt-info">
                  <a [routerLink]="['/properties', item.id]" class="rt-name">{{ item.title }}</a>
                  <div class="rt-loc">{{ item.location }}</div>
                  <span class="rt-type">{{ item.type }}</span>
                </div>
              </div>

              @if (item.submitted) {
                <div class="rt-submitted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Rating submitted — thank you!
                </div>
              } @else {
                <div class="rt-form">
                  <div class="rt-stars-label">Your Rating</div>
                  <div class="rt-stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button class="rt-star" [class.active]="star <= item.myRating"
                        (click)="setRating(item, star)" type="button">★</button>
                    }
                    <span class="rt-star-hint">{{ item.myRating > 0 ? ratingLabel(item.myRating) : 'Tap to rate' }}</span>
                  </div>
                  <textarea class="rt-textarea" rows="3" placeholder="Share your experience (optional)…"
                    [(ngModel)]="item.myReview"></textarea>
                  <button class="rt-submit-btn" [disabled]="item.myRating === 0 || item.submitting"
                    (click)="submitRating(item)">
                    {{ item.submitting ? 'Submitting…' : 'Submit Rating' }}
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;
    .rt-page { padding: 0; }
    .rt-header { margin-bottom: 1.5rem; }
    .rt-title { font-size: 1.4rem; font-weight: 700; color: $text; margin: 0 0 0.25rem; }
    .rt-sub { font-size: 0.875rem; color: $sub; margin: 0; }
    .rt-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; gap: 1rem; color: $sub; text-align: center;
      h3 { font-size: 1.1rem; font-weight: 600; color: $text; margin: 0; }
      p { font-size: 0.875rem; margin: 0; }
    }
    .rt-link { font-size: 0.875rem; color: $accent; font-weight: 600; text-decoration: none; }
    .rt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .rt-card { background: #fff; border: 1px solid $border; border-radius: 0.75rem; padding: 1.25rem; }
    .rt-card-top { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .rt-img { width: 80px; height: 64px; object-fit: cover; border-radius: 0.5rem; flex-shrink: 0; }
    .rt-info { flex: 1; min-width: 0; }
    .rt-name { font-size: 0.9rem; font-weight: 700; color: $text; text-decoration: none; display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
      &:hover { color: $accent; }
    }
    .rt-loc { font-size: 0.75rem; color: $muted; margin: 0.2rem 0; }
    .rt-type { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; background: #f3f4f6; color: $sub; }
    .rt-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .rt-stars-label { font-size: 0.8rem; font-weight: 600; color: $sub; }
    .rt-stars { display: flex; align-items: center; gap: 0.25rem; }
    .rt-star { background: none; border: none; cursor: pointer; font-size: 1.5rem; color: #d1d5db; padding: 0; line-height: 1; transition: color 0.15s;
      &.active { color: #f59e0b; }
      &:hover { color: #f59e0b; }
    }
    .rt-star-hint { font-size: 0.78rem; color: $sub; margin-left: 0.5rem; }
    .rt-textarea { width: 100%; border: 1px solid $border; border-radius: 0.5rem; padding: 0.6rem 0.75rem; font-size: 0.85rem; resize: vertical; outline: none; font-family: inherit; box-sizing: border-box;
      &:focus { border-color: $accent; }
    }
    .rt-submit-btn { padding: 0.6rem 1.25rem; background: $accent; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; align-self: flex-start;
      &:hover:not(:disabled) { background: #154d31; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .rt-submitted { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #16a34a; font-weight: 600; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.6rem 0.875rem; }
    @media (max-width: 768px) { .rt-grid { grid-template-columns: 1fr; } }
  `]
})
export class CustomerRatingsComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  loading = signal(true);
  items   = signal<RatableProperty[]>([]);

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
      .select('id, title, location, community, type, images')
      .in('id', propIds);

    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));
    this.items.set(saved.map((r: any) => {
      const p = propMap.get(r.property_id);
      if (!p) return null;
      return {
        id:         p.id,
        title:      p.title || '',
        location:   [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
        type:       p.type || '',
        image:      (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=60',
        myRating:   0,
        myReview:   '',
        submitting: false,
        submitted:  false,
      };
    }).filter(Boolean) as RatableProperty[]);
    this.loading.set(false);
  }

  setRating(item: RatableProperty, star: number): void {
    item.myRating = star;
  }

  ratingLabel(n: number): string {
    return ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][n] ?? '';
  }

  async submitRating(item: RatableProperty): Promise<void> {
    if (item.myRating === 0 || item.submitting) return;
    item.submitting = true;
    const user = this.auth.currentUser();
    await this.sb.from('admin_leads').insert({
      name:          user?.name  || 'Customer',
      email:         user?.email || '',
      phone:         user?.phone || '',
      notes:         `[RATING] ${item.myRating}/5 stars for property #${item.id} (${item.title}). Review: ${item.myReview || 'No comment'}`,
      property_type: item.type,
      location:      item.location,
      status:        'new',
      source:        'rating',
    });
    item.submitting = false;
    item.submitted  = true;
    this.items.update(list => [...list]);
  }
}
