import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface MyReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  project_id: number;
  project_title: string;
  project_type: string;
}

@Component({
  selector: 'app-customer-ratings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="rt-page">
      <div class="rt-header">
        <h1 class="rt-title">My Ratings &amp; Reviews</h1>
        <p class="rt-sub">Reviews you have submitted for projects</p>
      </div>

      @if (loading()) {
        <div class="rt-empty"><p>Loading…</p></div>
      } @else if (myReviews().length === 0) {
        <div class="rt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3>No reviews yet</h3>
          <p>Visit a project page and click "Write a Review" to share your experience.</p>
          <a routerLink="/projects" class="rt-link">Browse projects →</a>
        </div>
      } @else {
        <div class="rt-table-wrap">
          <table class="rt-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Type</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (r of myReviews(); track r.id) {
                <tr (click)="r.comment ? selectedReview.set(r) : null" [class.rt-row-clickable]="r.comment">
                  <td class="rt-td-title">{{ r.project_title || '—' }}</td>
                  <td><span class="rt-rev-tag">{{ r.project_type || '—' }}</span></td>
                  <td>
                    <div class="rt-rev-stars">
                      @for (s of [1,2,3,4,5]; track s) {
                        <svg viewBox="0 0 24 24" [attr.fill]="r.rating >= s ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="1.5">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                      }
                      <span class="rt-rev-num">{{ r.rating }}/5</span>
                    </div>
                  </td>
                  <td class="rt-td-comment">
                    @if (r.comment) {
                      <span class="rt-comment-preview">{{ r.comment }}</span>
                    } @else {
                      <span class="rt-no-comment">No comment</span>
                    }
                  </td>
                  <td class="rt-td-date">{{ r.created_at | date:'d MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (selectedReview()) {
      <div class="rt-backdrop" (click)="selectedReview.set(null)"></div>
      <div class="rt-rev-detail">
        <div class="rt-rev-detail__head">
          <div>
            <h3 class="rt-rev-detail__title">{{ selectedReview()!.project_title }}</h3>
            <span class="rt-rev-tag">{{ selectedReview()!.project_type }}</span>
          </div>
          <button class="rt-rev-detail__close" (click)="selectedReview.set(null)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="rt-rev-detail__stars">
          @for (s of [1,2,3,4,5]; track s) {
            <svg viewBox="0 0 24 24" [attr.fill]="selectedReview()!.rating >= s ? '#f59e0b' : 'none'" stroke="#f59e0b" stroke-width="1.5">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          }
          <span class="rt-rev-num">{{ selectedReview()!.rating }}/5</span>
        </div>
        <p class="rt-rev-detail__comment">{{ selectedReview()!.comment }}</p>
        <div class="rt-rev-detail__meta">
          <div><strong>Date:</strong> {{ selectedReview()!.created_at | date:'d MMM y, h:mm a' }}</div>
        </div>
      </div>
    }
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

    .rt-table-wrap { overflow-x: auto; border: 1px solid $border; border-radius: 0.875rem; }
    .rt-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .rt-table thead th { background: #f9fafb; padding: 0.75rem 1rem; text-align: left; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: $muted; border-bottom: 1px solid $border; }
    .rt-table tbody tr { border-bottom: 1px solid $border; &:last-child { border-bottom: none; } &:hover { background: #f9fafb; } }
    .rt-row-clickable { cursor: pointer; }
    .rt-table td { padding: 0.875rem 1rem; vertical-align: middle; }
    .rt-td-title { font-weight: 600; color: $text; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rt-td-date { color: $muted; font-size: 0.82rem; white-space: nowrap; }
    .rt-td-comment { max-width: 240px; }
    .rt-comment-preview { font-size: 0.82rem; color: $text; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .rt-no-comment { font-size: 0.78rem; color: $muted; font-style: italic; }
    .rt-rev-tag { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 2rem; background: rgba(26,92,58,.08); color: $accent; font-size: 0.72rem; font-weight: 600; }
    .rt-rev-stars { display: flex; align-items: center; gap: 0.15rem; svg { width: 16px; height: 16px; } }
    .rt-rev-num { font-size: 0.78rem; font-weight: 600; color: $muted; margin-left: 0.25rem; }

    .rt-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 999; }
    .rt-rev-detail {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      z-index: 1000; background: #fff; border-radius: 1.25rem; padding: 2rem;
      width: 90%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.25);
      &__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
      &__title { font-size: 1.1rem; font-weight: 700; color: $text; margin: 0 0 0.4rem; }
      &__close { background: none; border: none; cursor: pointer; color: $muted; padding: 0.25rem; border-radius: 0.5rem; display: flex; &:hover { background: #f1f5f9; } }
      &__stars { display: flex; align-items: center; gap: 0.2rem; margin-bottom: 1rem; svg { width: 22px; height: 22px; } }
      &__comment { font-size: 0.9rem; color: $text; line-height: 1.6; background: #f8fafc; border-radius: 0.75rem; padding: 0.875rem 1rem; margin-bottom: 1rem; }
      &__meta { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.82rem; color: $muted; strong { color: $text; } }
    }
  `]
})
export class CustomerRatingsComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  loading        = signal(true);
  myReviews      = signal<MyReview[]>([]);
  selectedReview = signal<MyReview | null>(null);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    const { data } = await this.sb
      .from('reviews')
      .select('*, projects(title, type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      this.myReviews.set(data.map((r: any) => ({
        id:            r.id,
        rating:        r.rating,
        comment:       r.comment,
        created_at:    r.created_at,
        project_id:    r.project_id,
        project_title: r.projects?.title ?? '',
        project_type:  r.projects?.type  ?? '',
      })));
    }
    this.loading.set(false);
  }
}
