import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  reviewer_email: string;
  created_at: string;
  project_id: number;
  project_title: string;
  project_type: string;
}

@Component({
  selector: 'app-admin-ratings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="ar-wrap">
  <div class="ar-header">
    <h1 class="ar-title">Ratings & Reviews</h1>
    <p class="ar-sub">{{ filtered().length }} of {{ reviews().length }} review{{ reviews().length !== 1 ? 's' : '' }}</p>
  </div>

  <!-- Filters -->
  <div class="ar-filters" *ngIf="!loading() && reviews().length > 0">
    <!-- Reviewer search -->
    <div class="ar-search-wrap">
      <svg class="ar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
      <input class="ar-search" type="text" placeholder="Search reviewer name or email…"
        [(ngModel)]="reviewerQuery" (ngModelChange)="filterReviewer.set($event)" />
      <button class="ar-field-clear" [class.visible]="filterReviewer()" (click)="filterReviewer.set(''); reviewerQuery = ''" tabindex="-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Star rating dropdown -->
    <div class="ar-select-wrap">
      <svg class="ar-select-star" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
      <select class="ar-select" [ngModel]="filterRating()" (ngModelChange)="filterRating.set($event === 'null' ? null : +$event)">
        <option value="null">All Ratings</option>
        <option value="5">★★★★★  5 Stars</option>
        <option value="4">★★★★☆  4 Stars</option>
        <option value="3">★★★☆☆  3 Stars</option>
        <option value="2">★★☆☆☆  2 Stars</option>
        <option value="1">★☆☆☆☆  1 Star</option>
      </select>
      <button class="ar-field-clear" [class.visible]="filterRating() !== null" (click)="filterRating.set(null)" tabindex="-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <svg class="ar-select-chevron" [class.hidden]="filterRating() !== null" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>
    </div>
  </div>

  <div class="ar-loading" *ngIf="loading()">
    <div class="ar-spin"></div>
  </div>

  <div class="ar-empty" *ngIf="!loading() && reviews().length === 0">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
    <p>No reviews yet</p>
  </div>

  <div class="ar-empty ar-empty--filter" *ngIf="!loading() && reviews().length > 0 && filtered().length === 0">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <p>No reviews match your filters.</p>
    <button class="ar-clear-all" (click)="clearFilters()">Clear filters</button>
  </div>

  <div class="ar-table-wrap" *ngIf="!loading() && filtered().length > 0">
    <table class="ar-table">
      <thead>
        <tr>
          <th>Project</th>
          <th>Type</th>
          <th>Rating</th>
          <th>Reviewer</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of filtered()">
          <td class="ar-td-title">{{ r.project_title || '—' }}</td>
          <td><span class="ar-tag">{{ r.project_type || '—' }}</span></td>
          <td>
            <div class="ar-stars">
              <svg *ngFor="let s of [1,2,3,4,5]" viewBox="0 0 24 24"
                [attr.fill]="r.rating >= s ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="1.5">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              <span class="ar-rating-num">{{ r.rating }}/5</span>
            </div>
          </td>
          <td class="ar-reviewer">
            <div class="ar-reviewer-name">{{ r.reviewer_name || '—' }}</div>
            <div class="ar-reviewer-email">{{ r.reviewer_email }}</div>
          </td>
          <td class="ar-date">{{ r.created_at | date:'d MMM y' }}</td>
          <td>
            <button class="ar-btn-view" (click)="openDetail(r)" *ngIf="r.comment">View</button>
            <span class="ar-no-comment" *ngIf="!r.comment">No comment</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Detail popup -->
<div class="ar-backdrop" *ngIf="selected()" (click)="selected.set(null)"></div>
<div class="ar-detail" *ngIf="selected()">
  <div class="ar-detail__head">
    <div>
      <h3 class="ar-detail__title">{{ selected()!.project_title }}</h3>
      <span class="ar-tag">{{ selected()!.project_type }}</span>
    </div>
    <button class="ar-detail__close" (click)="selected.set(null)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>
  <div class="ar-detail__stars">
    <svg *ngFor="let s of [1,2,3,4,5]" viewBox="0 0 24 24"
      [attr.fill]="selected()!.rating >= s ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
    <span class="ar-rating-num">{{ selected()!.rating }}/5</span>
  </div>
  <p class="ar-detail__comment">{{ selected()!.comment }}</p>
  <div class="ar-detail__meta">
    <div><strong>Reviewer:</strong> {{ selected()!.reviewer_name }}</div>
    <div><strong>Email:</strong> {{ selected()!.reviewer_email }}</div>
    <div><strong>Date:</strong> {{ selected()!.created_at | date:'d MMM y, h:mm a' }}</div>
  </div>
</div>
  `,
  styles: [`
    $accent: #1a5c3a; $gold: #f59e0b; $border: #e5e7eb; $text: #111827; $muted: #6b7280; $bg: #f9fafb;

    .ar-wrap { padding: 2rem; max-width: 1100px; }
    .ar-header { margin-bottom: 1.5rem; }
    .ar-title { font-size: 1.5rem; font-weight: 700; color: $text; margin: 0 0 .25rem; }
    .ar-sub { font-size: .85rem; color: $muted; margin: 0; }

    .ar-loading { display: flex; justify-content: center; padding: 4rem; }
    .ar-spin { width: 36px; height: 36px; border: 3px solid $border; border-top-color: $accent; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ar-empty { text-align: center; padding: 4rem; color: $muted; svg { display: block; margin: 0 auto 1rem; opacity: .3; } }

    .ar-table-wrap { overflow-x: auto; border: 1px solid $border; border-radius: .875rem; }
    .ar-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .ar-table thead th { background: $bg; padding: .75rem 1rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: $muted; border-bottom: 1px solid $border; }
    .ar-table tbody tr { border-bottom: 1px solid $border; &:last-child { border-bottom: none; } &:hover { background: $bg; } }
    .ar-table td { padding: .875rem 1rem; vertical-align: middle; }
    .ar-td-title { font-weight: 600; color: $text; max-width: 200px; }
    .ar-tag { display: inline-block; padding: .2rem .6rem; border-radius: 2rem; background: rgba(26,92,58,.08); color: $accent; font-size: .72rem; font-weight: 600; }
    .ar-stars { display: flex; align-items: center; gap: .15rem; svg { width: 16px; height: 16px; } }
    .ar-rating-num { font-size: .78rem; font-weight: 600; color: $muted; margin-left: .25rem; }
    .ar-reviewer-name { font-weight: 600; color: $text; }
    .ar-reviewer-email { font-size: .78rem; color: $muted; }
    .ar-date { color: $muted; font-size: .82rem; white-space: nowrap; }
    .ar-btn-view { padding: .35rem .85rem; background: $accent; color: #fff; border: none; border-radius: .5rem; font-size: .78rem; font-weight: 600; cursor: pointer; &:hover { background: darken($accent, 8%); } }
    .ar-no-comment { font-size: .78rem; color: $muted; font-style: italic; }

    .ar-filters { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.25rem; }

    // shared field clear ×
    .ar-field-clear {
      position: absolute; right: .5rem; width: 22px; height: 22px; border-radius: 50%;
      background: #e5e7eb; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #6b7280; opacity: 0; pointer-events: none; transition: opacity .15s, background .15s;
      svg { width: 11px; height: 11px; }
      &.visible { opacity: 1; pointer-events: auto; }
      &:hover { background: #d1d5db; color: $text; }
    }

    // reviewer search
    .ar-search-wrap { position: relative; display: flex; align-items: center; min-width: 140px; max-width: 180px; }
    .ar-search-icon { position: absolute; left: .7rem; width: 15px; height: 15px; color: $muted; pointer-events: none; }
    .ar-search { width: 100%; padding: .55rem 2rem .55rem 2.25rem; border: 1px solid $border; border-radius: .625rem; font-size: .85rem; color: $text; background: #fff; outline: none;
      &:focus { border-color: $accent; box-shadow: 0 0 0 3px rgba(26,92,58,.08); }
    }

    // rating select
    .ar-select-wrap { position: relative; display: flex; align-items: center; }
    .ar-select-star { position: absolute; left: .7rem; width: 15px; height: 15px; pointer-events: none; }
    .ar-select-chevron { position: absolute; right: .6rem; width: 15px; height: 15px; color: $muted; pointer-events: none; transition: opacity .15s; &.hidden { opacity: 0; } }
    .ar-select { appearance: none; padding: .55rem 2.25rem .55rem 2.25rem; border: 1px solid $border; border-radius: .625rem; font-size: .85rem; color: $text; background: #fff; cursor: pointer; outline: none; min-width: 120px; max-width: 135px;
      &:focus { border-color: $gold; box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
    }

    .ar-empty--filter { padding: 2rem; p { font-size: .88rem; margin: .5rem 0 1rem; } }

    .ar-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 999; }
    .ar-detail {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      z-index: 1000; background: #fff; border-radius: 1.25rem; padding: 2rem;
      width: 90%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.25);
      &__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
      &__title { font-size: 1.1rem; font-weight: 700; color: $text; margin: 0 0 .4rem; }
      &__close { background: none; border: none; cursor: pointer; color: $muted; padding: .25rem; border-radius: .5rem; display: flex; &:hover { background: #f1f5f9; } }
      &__stars { display: flex; align-items: center; gap: .2rem; margin-bottom: 1rem; svg { width: 22px; height: 22px; } }
      &__comment { font-size: .9rem; color: $text; line-height: 1.6; background: #f8fafc; border-radius: .75rem; padding: .875rem 1rem; margin-bottom: 1rem; }
      &__meta { display: flex; flex-direction: column; gap: .35rem; font-size: .82rem; color: $muted; strong { color: $text; } }
    }
  `]
})
export class AdminRatingsComponent implements OnInit {
  private sb = inject(SupabaseService).client;

  reviews       = signal<Review[]>([]);
  loading       = signal(true);
  selected      = signal<Review | null>(null);
  filterRating  = signal<number | null>(null);
  filterReviewer = signal('');
  reviewerQuery = '';

  filtered = computed(() => {
    const rating   = this.filterRating();
    const reviewer = this.filterReviewer().toLowerCase().trim();
    return this.reviews().filter(r => {
      if (rating !== null && r.rating !== rating) return false;
      if (reviewer && !r.reviewer_name.toLowerCase().includes(reviewer) &&
                      !r.reviewer_email.toLowerCase().includes(reviewer)) return false;
      return true;
    });
  });

  clearFilters(): void {
    this.filterRating.set(null);
    this.filterReviewer.set('');
    this.reviewerQuery = '';
  }

  async ngOnInit(): Promise<void> {
    const { data } = await this.sb
      .from('reviews')
      .select('*, projects(title, type)')
      .order('created_at', { ascending: false });

    if (data) {
      this.reviews.set(data.map((r: any) => ({
        id:             r.id,
        rating:         r.rating,
        comment:        r.comment,
        reviewer_name:  r.reviewer_name  ?? '',
        reviewer_email: r.reviewer_email ?? '',
        created_at:     r.created_at,
        project_id:     r.project_id,
        project_title:  r.projects?.title ?? '',
        project_type:   r.projects?.type  ?? '',
      })));
    }
    this.loading.set(false);
  }

  openDetail(r: Review): void { this.selected.set(r); }
}
