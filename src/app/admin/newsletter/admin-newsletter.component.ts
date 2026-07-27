import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { EmailService } from '../../shared/services/email.service';
import { environment } from '../../../environments/environment';

interface Subscriber {
  id: number;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  created_at: string;
  unsubscribed_at: string | null;
}

type MainTab = 'subscribers' | 'compose';
type RecipientMode = 'all' | 'subscribed' | 'custom';

@Component({
  selector: 'app-admin-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="nl-wrap">

  <!-- Page header -->
  <div class="nl-header">
    <div>
      <h1 class="nl-title">Newsletter</h1>
      <p class="nl-sub">Manage subscribers and send campaigns</p>
    </div>
    <button class="nl-export-btn" (click)="exportCsv()"
      *ngIf="mainTab() === 'subscribers' && !loading() && filtered().length > 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
      </svg>
      Export CSV
    </button>
  </div>

  <!-- Main tabs -->
  <div class="nl-main-tabs">
    <button class="nl-main-tab" [class.active]="mainTab() === 'subscribers'" (click)="mainTab.set('subscribers')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0"/>
      </svg>
      Subscribers
      <span class="nl-main-tab-count">{{ subscribers().length }}</span>
    </button>
    <button class="nl-main-tab" [class.active]="mainTab() === 'compose'" (click)="mainTab.set('compose')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
      </svg>
      Send Campaign
    </button>
  </div>

  <!-- ───────────────────── SUBSCRIBERS TAB ───────────────────── -->
  <ng-container *ngIf="mainTab() === 'subscribers'">

    <!-- Filters -->
    <div class="nl-filters" *ngIf="!loading() && subscribers().length > 0">
      <div class="nl-search-wrap">
        <svg class="nl-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/>
        </svg>
        <input class="nl-search" type="text" placeholder="Search by email…"
          [(ngModel)]="emailQuery" (ngModelChange)="filterEmail.set($event)" />
        <button class="nl-clear" [class.visible]="filterEmail()"
          (click)="filterEmail.set(''); emailQuery = ''" tabindex="-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="nl-status-tabs">
        <button class="nl-tab" [class.active]="filterStatus() === 'all'" (click)="filterStatus.set('all')">
          All <span class="nl-tab-count">{{ subscribers().length }}</span>
        </button>
        <button class="nl-tab" [class.active]="filterStatus() === 'subscribed'" (click)="filterStatus.set('subscribed')">
          Subscribed <span class="nl-tab-count nl-tab-count--green">{{ subscribedCount() }}</span>
        </button>
        <button class="nl-tab" [class.active]="filterStatus() === 'unsubscribed'" (click)="filterStatus.set('unsubscribed')">
          Unsubscribed <span class="nl-tab-count nl-tab-count--red">{{ unsubscribedCount() }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div class="nl-state" *ngIf="loading()">
      <div class="nl-spinner"></div>
      <p>Loading subscribers…</p>
    </div>

    <!-- Empty -->
    <div class="nl-state" *ngIf="!loading() && subscribers().length === 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
      </svg>
      <p>No subscribers yet.</p>
    </div>

    <!-- No results -->
    <div class="nl-state" *ngIf="!loading() && subscribers().length > 0 && filtered().length === 0">
      <p>No subscribers match your filter.</p>
      <button class="nl-reset-btn" (click)="resetFilters()">Clear filters</button>
    </div>

    <!-- Table -->
    <div class="nl-table-wrap" *ngIf="!loading() && filtered().length > 0">
      <table class="nl-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>Status</th>
            <th>Subscribed On</th>
            <th>Unsubscribed On</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of filtered(); let i = index">
            <td class="nl-td-num">{{ i + 1 }}</td>
            <td class="nl-td-email">{{ s.email }}</td>
            <td>
              <span class="nl-badge"
                [class.nl-badge--green]="s.status === 'subscribed'"
                [class.nl-badge--red]="s.status === 'unsubscribed'">
                {{ s.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed' }}
              </span>
            </td>
            <td class="nl-td-date">{{ fmtDate(s.created_at) }}</td>
            <td class="nl-td-date">{{ s.unsubscribed_at ? fmtDate(s.unsubscribed_at) : '—' }}</td>
            <td>
              <button *ngIf="s.status === 'subscribed'" class="nl-action-btn nl-action-btn--danger"
                (click)="unsubscribe(s)">Unsubscribe</button>
              <button *ngIf="s.status === 'unsubscribed'" class="nl-action-btn nl-action-btn--success"
                (click)="resubscribe(s)">Re-subscribe</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </ng-container>

  <!-- ───────────────────── COMPOSE TAB ───────────────────── -->
  <ng-container *ngIf="mainTab() === 'compose'">

    <!-- Sent success banner -->
    <div class="cmp-success-banner" *ngIf="sendSuccess()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
      </svg>
      <span *ngIf="sendResult()">
        Campaign sent! <strong>{{ sendResult()!.sent }}</strong> delivered
        <ng-container *ngIf="sendResult()!.failed > 0">, <strong>{{ sendResult()!.failed }}</strong> failed</ng-container>.
      </span>
      <button class="cmp-success-close" (click)="sendSuccess.set(false)">×</button>
    </div>

    <div class="cmp-layout">
      <!-- Left: compose form -->
      <div class="cmp-form-card">
        <h2 class="cmp-section-title">Compose Campaign</h2>

        <!-- Recipients -->
        <div class="cmp-field">
          <label class="cmp-label">Recipients</label>
          <div class="cmp-recipient-modes">
            <label class="cmp-radio" [class.active]="recipientMode() === 'subscribed'"
              (click)="setRecipientMode('subscribed')">
              <span class="cmp-radio-dot"></span>
              All subscribed
              <span class="cmp-recipient-count">{{ subscribedCount() }}</span>
            </label>
            <label class="cmp-radio" [class.active]="recipientMode() === 'all'"
              (click)="setRecipientMode('all')">
              <span class="cmp-radio-dot"></span>
              Everyone (incl. unsubscribed)
              <span class="cmp-recipient-count">{{ subscribers().length }}</span>
            </label>
            <label class="cmp-radio" [class.active]="recipientMode() === 'custom'"
              (click)="setRecipientMode('custom')">
              <span class="cmp-radio-dot"></span>
              Custom email list
            </label>
          </div>

          <!-- Custom email textarea -->
          <div *ngIf="recipientMode() === 'custom'" class="cmp-custom-emails-wrap">
            <textarea class="cmp-textarea cmp-textarea--sm" rows="3"
              placeholder="Enter email addresses separated by commas or new lines…"
              [(ngModel)]="customEmailsRaw"
              (ngModelChange)="parseCustomEmails()"></textarea>
            <p class="cmp-hint" *ngIf="customEmails().length > 0">
              {{ customEmails().length }} valid email{{ customEmails().length !== 1 ? 's' : '' }} detected
            </p>
          </div>

          <!-- Resolved list preview -->
          <div class="cmp-recipients-preview" *ngIf="resolvedRecipients().length > 0">
            <div class="cmp-recipients-chips">
              <span class="cmp-chip" *ngFor="let e of resolvedRecipients().slice(0, 8)">{{ e }}</span>
              <span class="cmp-chip cmp-chip--more" *ngIf="resolvedRecipients().length > 8">
                +{{ resolvedRecipients().length - 8 }} more
              </span>
            </div>
          </div>
          <p class="cmp-field-error" *ngIf="cmpErrors().recipients">{{ cmpErrors().recipients }}</p>
        </div>

        <!-- Subject -->
        <div class="cmp-field">
          <label class="cmp-label">Subject <span class="cmp-required">*</span></label>
          <input class="cmp-input" type="text" placeholder="e.g. Weekly Property Digest — July 2026"
            [(ngModel)]="campaignSubject"
            (ngModelChange)="clearError('subject')" />
          <p class="cmp-field-error" *ngIf="cmpErrors().subject">{{ cmpErrors().subject }}</p>
        </div>

        <!-- Preview text -->
        <div class="cmp-field">
          <label class="cmp-label">Preview text
            <span class="cmp-label-hint">shown in inbox below the subject</span>
          </label>
          <input class="cmp-input" type="text"
            placeholder="e.g. This week: Palm Jumeirah prices, top picks and more…"
            [(ngModel)]="campaignPreview" />
        </div>

        <!-- Body -->
        <div class="cmp-field">
          <label class="cmp-label">Email body <span class="cmp-required">*</span></label>
          <div class="cmp-toolbar">
            <button class="cmp-toolbar-btn" title="Bold" (click)="wrapSelection('**','**')"><b>B</b></button>
            <button class="cmp-toolbar-btn" title="Italic" (click)="wrapSelection('_','_')"><i>I</i></button>
            <button class="cmp-toolbar-btn" title="Link" (click)="insertLink()">🔗</button>
            <button class="cmp-toolbar-btn" title="Bullet list" (click)="insertLine('• ')">≡</button>
            <div class="cmp-toolbar-sep"></div>
            <button class="cmp-toolbar-btn" [class.active]="bodyView() === 'write'"
              (click)="bodyView.set('write')">Write</button>
            <button class="cmp-toolbar-btn" [class.active]="bodyView() === 'preview'"
              (click)="bodyView.set('preview')">Preview</button>
          </div>
          <textarea *ngIf="bodyView() === 'write'" #bodyArea id="cmp-body"
            class="cmp-textarea" rows="12"
            placeholder="Write your email content here. Supports basic markdown: **bold**, _italic_, [link](url), • bullet points…"
            [(ngModel)]="campaignBody"
            (ngModelChange)="clearError('body')"></textarea>
          <div *ngIf="bodyView() === 'preview'" class="cmp-body-preview"
            [innerHTML]="renderedBody()"></div>
          <p class="cmp-field-error" *ngIf="cmpErrors().body">{{ cmpErrors().body }}</p>
        </div>

        <!-- Actions -->
        <div class="cmp-actions">
          <button class="cmp-btn-secondary" (click)="resetCompose()">Reset</button>
          <button class="cmp-btn-primary" (click)="sendCampaign()" [disabled]="saving()">
            <span *ngIf="!saving()" style="display:inline-flex;align-items:center;gap:0.4rem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.875L5.999 12zm0 0h7.5"/>
              </svg>
              Send Campaign
            </span>
            <span *ngIf="saving()" class="nl-spinner"></span>
          </button>
        </div>
        <p class="cmp-save-note">
          Emails are sent via your configured SMTP or Brevo fallback.
        </p>
      </div>

      <!-- Right: email preview card -->
      <div class="cmp-preview-card">
        <h2 class="cmp-section-title">Email Preview</h2>
        <div class="cmp-email-preview">
          <div class="cmp-email-meta">
            <div class="cmp-email-meta-row">
              <span class="cmp-email-label">From</span>
              <span class="cmp-email-value">Livwell &lt;no-reply&#64;livwell.ae&gt;</span>
            </div>
            <div class="cmp-email-meta-row">
              <span class="cmp-email-label">To</span>
              <span class="cmp-email-value">
                {{ resolvedRecipients().length > 0
                  ? resolvedRecipients().length + ' recipient' + (resolvedRecipients().length !== 1 ? 's' : '')
                  : '—' }}
              </span>
            </div>
            <div class="cmp-email-meta-row">
              <span class="cmp-email-label">Subject</span>
              <span class="cmp-email-value cmp-email-subject">
                {{ campaignSubject || 'No subject' }}
              </span>
            </div>
          </div>
          <div class="cmp-email-body-wrap">
            <div class="cmp-email-body" *ngIf="campaignBody; else emptyBody"
              [innerHTML]="renderedBody()"></div>
            <ng-template #emptyBody>
              <p class="cmp-email-body-placeholder">Your email content will appear here…</p>
            </ng-template>
          </div>
          <div class="cmp-email-footer">
            <p>You're receiving this because you subscribed to Livwell property updates.</p>
            <a href="#" onclick="return false">Unsubscribe</a>
          </div>
        </div>

        <!-- Stats -->
        <div class="cmp-stats">
          <div class="cmp-stat">
            <span class="cmp-stat-value">{{ resolvedRecipients().length }}</span>
            <span class="cmp-stat-label">Recipients</span>
          </div>
          <div class="cmp-stat">
            <span class="cmp-stat-value">{{ wordCount() }}</span>
            <span class="cmp-stat-label">Words</span>
          </div>
          <div class="cmp-stat">
            <span class="cmp-stat-value">~{{ readTime() }}m</span>
            <span class="cmp-stat-label">Read time</span>
          </div>
        </div>
      </div>
    </div>
  </ng-container>

</div>
  `,
  styles: [`
    $accent: #6366f1;
    $green:  #10b981;
    $red:    #ef4444;
    $border: #e5e7eb;
    $text:   #111827;
    $sub:    #6b7280;

    .nl-wrap { padding: 1.75rem 2rem; max-width: 1200px; }

    /* ── page header ── */
    .nl-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
    }
    .nl-title { font-size: 1.45rem; font-weight: 800; color: $text; margin: 0 0 0.2rem; }
    .nl-sub   { font-size: 0.82rem; color: $sub; margin: 0; }

    .nl-export-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: $accent; color: #fff; border: none; border-radius: 0.5rem;
      padding: 0.55rem 1.1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      transition: opacity .15s;
      svg { width: 15px; height: 15px; }
      &:hover { opacity: .88; }
    }

    /* ── main tabs ── */
    .nl-main-tabs {
      display: flex; gap: 0; border-bottom: 2px solid $border;
      margin-bottom: 1.5rem;
    }
    .nl-main-tab {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.65rem 1.25rem; border: none; background: none;
      font-size: 0.88rem; font-weight: 600; color: $sub; cursor: pointer;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: all .15s;
      svg { width: 16px; height: 16px; }
      &.active { color: $accent; border-bottom-color: $accent; }
      &:not(.active):hover { color: $text; }
    }
    .nl-main-tab-count {
      background: #f3f4f6; color: $sub; border-radius: 999px;
      padding: 0.05rem 0.45rem; font-size: 0.72rem; font-weight: 600;
    }
    .nl-main-tab.active .nl-main-tab-count { background: #ede9fe; color: $accent; }

    /* ── subscriber filters ── */
    .nl-filters {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .nl-search-wrap {
      position: relative; display: flex; align-items: center; flex: 1; min-width: 220px;
    }
    .nl-search-icon {
      position: absolute; left: 0.75rem; width: 15px; height: 15px; stroke: $sub; pointer-events: none;
    }
    .nl-search {
      width: 100%; padding: 0.55rem 2.2rem 0.55rem 2.2rem;
      border: 1px solid $border; border-radius: 0.5rem; font-size: 0.875rem;
      outline: none; background: #fff;
      &:focus { border-color: $accent; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    }
    .nl-clear {
      position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer;
      color: $sub; opacity: 0; pointer-events: none; padding: 0.2rem; display: flex;
      svg { width: 14px; height: 14px; }
      &.visible { opacity: 1; pointer-events: auto; }
    }
    .nl-status-tabs { display: flex; gap: 0.4rem; }
    .nl-tab {
      display: flex; align-items: center; gap: 0.35rem;
      padding: 0.45rem 0.85rem; border: 1px solid $border; border-radius: 0.4rem;
      background: #fff; font-size: 0.8rem; font-weight: 500; color: $sub; cursor: pointer;
      transition: all .15s;
      &.active { background: $accent; color: #fff; border-color: $accent; }
      &:not(.active):hover { border-color: $accent; color: $accent; }
    }
    .nl-tab-count {
      background: #f3f4f6; color: $sub; border-radius: 999px;
      padding: 0.05rem 0.45rem; font-size: 0.72rem; font-weight: 600;
      &--green { background: #d1fae5; color: #059669; }
      &--red   { background: #fee2e2; color: $red; }
    }
    .nl-tab.active .nl-tab-count { background: rgba(255,255,255,.25); color: #fff; }

    /* ── states ── */
    .nl-state {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 4rem 2rem; color: $sub; font-size: 0.9rem; text-align: center;
      svg { width: 48px; height: 48px; stroke: #d1d5db; }
    }
    .nl-spinner {
      width: 20px; height: 20px; border: 2px solid $border;
      border-top-color: $accent; border-radius: 50%;
      animation: spin .7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .nl-reset-btn {
      padding: 0.45rem 1rem; background: $accent; color: #fff; border: none;
      border-radius: 0.4rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
    }

    /* ── table ── */
    .nl-table-wrap { overflow-x: auto; border-radius: 0.75rem; border: 1px solid $border; background: #fff; }
    .nl-table {
      width: 100%; border-collapse: collapse; font-size: 0.85rem;
      thead tr { background: #f9fafb; border-bottom: 1px solid $border; }
      th {
        padding: 0.75rem 1rem; text-align: left; font-size: 0.72rem;
        font-weight: 700; color: $sub; text-transform: uppercase; letter-spacing: .05em;
        white-space: nowrap;
      }
      tbody tr {
        border-bottom: 1px solid #f3f4f6;
        &:last-child { border-bottom: none; }
        &:hover { background: #fafafa; }
      }
      td { padding: 0.7rem 1rem; vertical-align: middle; }
    }
    .nl-td-num   { color: $sub; width: 40px; }
    .nl-td-email { font-weight: 500; color: $text; }
    .nl-td-date  { color: $sub; white-space: nowrap; }
    .nl-badge {
      display: inline-flex; align-items: center;
      padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600;
      background: #f3f4f6; color: $sub;
      &--green { background: #d1fae5; color: #059669; }
      &--red   { background: #fee2e2; color: $red; }
    }
    .nl-action-btn {
      padding: 0.3rem 0.75rem; border-radius: 0.375rem; font-size: 0.78rem;
      font-weight: 600; border: none; cursor: pointer; transition: opacity .15s;
      &--danger  { background: #fee2e2; color: $red;    &:hover { opacity: .8; } }
      &--success { background: #d1fae5; color: #059669; &:hover { opacity: .8; } }
    }

    /* ── compose layout ── */
    .cmp-success-banner {
      display: flex; align-items: center; gap: 0.65rem;
      background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 0.6rem;
      padding: 0.75rem 1rem; font-size: 0.85rem; color: #065f46;
      margin-bottom: 1.25rem;
      svg { width: 18px; height: 18px; flex-shrink: 0; }
    }
    .cmp-success-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      font-size: 1.1rem; color: #065f46; line-height: 1;
    }

    .cmp-layout {
      display: grid; grid-template-columns: 1fr 380px; gap: 1.5rem; align-items: start;
      @media (max-width: 960px) { grid-template-columns: 1fr; }
    }

    .cmp-form-card, .cmp-preview-card {
      background: #fff; border: 1px solid $border; border-radius: 0.875rem; padding: 1.5rem;
    }

    .cmp-section-title {
      font-size: 0.95rem; font-weight: 700; color: $text; margin: 0 0 1.25rem;
    }

    /* ── fields ── */
    .cmp-field { margin-bottom: 1.25rem; }
    .cmp-label {
      display: block; font-size: 0.8rem; font-weight: 600; color: $text;
      margin-bottom: 0.45rem;
    }
    .cmp-label-hint { font-weight: 400; color: $sub; margin-left: 0.35rem; }
    .cmp-required { color: $red; }

    .cmp-input {
      width: 100%; padding: 0.6rem 0.85rem; border: 1px solid $border; border-radius: 0.5rem;
      font-size: 0.875rem; outline: none; color: $text; box-sizing: border-box;
      &:focus { border-color: $accent; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    }
    .cmp-textarea {
      width: 100%; padding: 0.65rem 0.85rem; border: 1px solid $border; border-radius: 0.5rem;
      font-size: 0.875rem; outline: none; color: $text; resize: vertical;
      font-family: inherit; box-sizing: border-box; line-height: 1.6;
      &:focus { border-color: $accent; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
      &--sm { rows: 3; min-height: 80px; }
    }
    .cmp-field-error { font-size: 0.78rem; color: $red; margin: 0.3rem 0 0; }
    .cmp-hint { font-size: 0.78rem; color: #059669; margin: 0.3rem 0 0; }

    /* ── recipient modes ── */
    .cmp-recipient-modes { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
    .cmp-radio {
      display: flex; align-items: center; gap: 0.55rem; cursor: pointer;
      padding: 0.55rem 0.75rem; border: 1px solid $border; border-radius: 0.5rem;
      font-size: 0.85rem; color: $sub; transition: all .15s;
      &.active { border-color: $accent; background: #ede9fe; color: $accent; }
      &:hover:not(.active) { border-color: #c7d2fe; }
    }
    .cmp-radio-dot {
      width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor;
      flex-shrink: 0; position: relative;
      .cmp-radio.active & { background: $accent; border-color: $accent;
        &::after { content: ''; position: absolute; inset: 2px; background: #fff; border-radius: 50%; } }
    }
    .cmp-recipient-count {
      margin-left: auto; background: #f3f4f6; color: $sub; border-radius: 999px;
      padding: 0.05rem 0.45rem; font-size: 0.72rem; font-weight: 600;
      .cmp-radio.active & { background: rgba(99,102,241,.15); color: $accent; }
    }
    .cmp-custom-emails-wrap { margin-top: 0.5rem; }

    .cmp-recipients-preview { margin-top: 0.5rem; }
    .cmp-recipients-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .cmp-chip {
      display: inline-block; padding: 0.2rem 0.6rem; background: #f3f4f6;
      border-radius: 999px; font-size: 0.72rem; color: $text;
      max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cmp-chip--more { background: #ede9fe; color: $accent; font-weight: 600; }

    /* ── body toolbar ── */
    .cmp-toolbar {
      display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap;
      padding: 0.4rem 0.5rem; background: #f9fafb; border: 1px solid $border;
      border-bottom: none; border-radius: 0.5rem 0.5rem 0 0;
    }
    .cmp-toolbar-btn {
      padding: 0.3rem 0.55rem; border: none; background: none; border-radius: 0.3rem;
      font-size: 0.8rem; cursor: pointer; color: $sub; transition: all .12s;
      &:hover, &.active { background: #e5e7eb; color: $text; }
    }
    .cmp-toolbar-sep { width: 1px; height: 16px; background: $border; margin: 0 0.1rem; }
    .cmp-textarea:first-of-type { border-radius: 0 0 0.5rem 0.5rem; }
    .cmp-body-preview {
      min-height: 200px; padding: 0.75rem 0.85rem; border: 1px solid $border;
      border-top: none; border-radius: 0 0 0.5rem 0.5rem; font-size: 0.875rem;
      line-height: 1.7; color: $text;
      p { margin: 0 0 0.75rem; }
      strong { font-weight: 700; }
      em { font-style: italic; }
      a { color: $accent; }
      ul { margin: 0 0 0.75rem 1.25rem; }
    }

    /* ── actions ── */
    .cmp-actions {
      display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .cmp-btn-primary {
      display: inline-flex; align-items: center; gap: 0.45rem;
      padding: 0.65rem 1.4rem; background: $accent; color: #fff;
      border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: opacity .15s;
      svg { width: 16px; height: 16px; }
      &:hover:not(:disabled) { opacity: .88; }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .cmp-btn-secondary {
      padding: 0.65rem 1.1rem; border: 1px solid $border; background: #fff;
      color: $sub; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all .15s;
      &:hover { border-color: $accent; color: $accent; }
    }
    .cmp-save-note {
      font-size: 0.75rem; color: $sub; text-align: center; margin: 0.65rem 0 0;
    }

    /* ── email preview card ── */
    .cmp-email-preview {
      border: 1px solid $border; border-radius: 0.625rem; overflow: hidden;
      font-size: 0.82rem;
    }
    .cmp-email-meta {
      background: #f9fafb; padding: 0.75rem 1rem; border-bottom: 1px solid $border;
    }
    .cmp-email-meta-row {
      display: flex; gap: 0.5rem; align-items: baseline; padding: 0.2rem 0;
    }
    .cmp-email-label { color: $sub; font-size: 0.72rem; font-weight: 600; min-width: 48px; }
    .cmp-email-value { color: $text; flex: 1; }
    .cmp-email-subject { font-weight: 600; }
    .cmp-email-body-wrap {
      padding: 1rem; min-height: 120px; background: #fff;
    }
    .cmp-email-body {
      font-size: 0.85rem; line-height: 1.7; color: $text;
      p { margin: 0 0 0.75rem; }
      strong { font-weight: 700; }
      em { font-style: italic; }
      a { color: $accent; }
      ul { margin: 0 0 0.75rem 1.25rem; }
    }
    .cmp-email-body-placeholder { color: #d1d5db; font-style: italic; }
    .cmp-email-footer {
      background: #f9fafb; border-top: 1px solid $border;
      padding: 0.6rem 1rem; text-align: center; color: $sub; font-size: 0.72rem;
      a { color: $accent; }
      p { margin: 0 0 0.2rem; }
    }

    /* ── stats ── */
    .cmp-stats {
      display: flex; gap: 0; margin-top: 1rem;
      border: 1px solid $border; border-radius: 0.625rem; overflow: hidden;
    }
    .cmp-stat {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      padding: 0.75rem 0.5rem; border-right: 1px solid $border;
      &:last-child { border-right: none; }
    }
    .cmp-stat-value { font-size: 1.25rem; font-weight: 800; color: $text; }
    .cmp-stat-label { font-size: 0.72rem; color: $sub; margin-top: 0.1rem; }
  `]
})
export class AdminNewsletterComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private email = inject(EmailService);

  /* ── subscribers state ── */
  subscribers    = signal<Subscriber[]>([]);
  loading        = signal(true);
  filterEmail    = signal('');
  filterStatus   = signal<'all' | 'subscribed' | 'unsubscribed'>('all');
  emailQuery     = '';

  subscribedCount   = computed(() => this.subscribers().filter(s => s.status === 'subscribed').length);
  unsubscribedCount = computed(() => this.subscribers().filter(s => s.status === 'unsubscribed').length);

  filtered = computed(() => {
    let list = this.subscribers();
    const q = this.filterEmail().toLowerCase().trim();
    if (q) list = list.filter(s => s.email.toLowerCase().includes(q));
    if (this.filterStatus() !== 'all') list = list.filter(s => s.status === this.filterStatus());
    return list;
  });

  /* ── main tabs ── */
  mainTab = signal<MainTab>('subscribers');

  /* ── compose state ── */
  sendResult      = signal<{ sent: number; failed: number } | null>(null);
  recipientMode   = signal<RecipientMode>('subscribed');
  customEmailsRaw = '';
  customEmails    = signal<string[]>([]);
  campaignSubject = '';
  campaignPreview = '';
  campaignBody    = '';
  bodyView        = signal<'write' | 'preview'>('write');
  saving          = signal(false);
  sendSuccess     = signal(false);
  cmpErrors       = signal<{ recipients?: string; subject?: string; body?: string }>({});

  resolvedRecipients = computed(() => {
    if (this.recipientMode() === 'subscribed') {
      return this.subscribers().filter(s => s.status === 'subscribed').map(s => s.email);
    }
    if (this.recipientMode() === 'all') {
      return this.subscribers().map(s => s.email);
    }
    return this.customEmails();
  });

  wordCount = computed(() => {
    const text = this.campaignBody.trim();
    return text ? text.split(/\s+/).length : 0;
  });

  readTime = computed(() => Math.max(1, Math.ceil(this.wordCount() / 200)));

  renderedBody = computed(() => this.markdownToHtml(this.campaignBody));

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const { data } = await this.sb
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    this.subscribers.set((data ?? []) as Subscriber[]);
    this.loading.set(false);
  }

  /* ── subscriber actions ── */
  async unsubscribe(s: Subscriber): Promise<void> {
    await this.sb.from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', s.id);
    this.subscribers.update(list =>
      list.map(r => r.id === s.id
        ? { ...r, status: 'unsubscribed' as const, unsubscribed_at: new Date().toISOString() }
        : r));
  }

  async resubscribe(s: Subscriber): Promise<void> {
    await this.sb.from('newsletter_subscribers')
      .update({ status: 'subscribed', unsubscribed_at: null })
      .eq('id', s.id);
    this.subscribers.update(list =>
      list.map(r => r.id === s.id
        ? { ...r, status: 'subscribed' as const, unsubscribed_at: null }
        : r));
  }

  resetFilters(): void {
    this.filterEmail.set('');
    this.filterStatus.set('all');
    this.emailQuery = '';
  }

  exportCsv(): void {
    const rows = [['Email', 'Status', 'Subscribed On', 'Unsubscribed On']];
    for (const s of this.filtered()) {
      rows.push([s.email, s.status, this.fmtDate(s.created_at),
        s.unsubscribed_at ? this.fmtDate(s.unsubscribed_at) : '']);
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'newsletter-subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  fmtDate(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  /* ── compose actions ── */
  setRecipientMode(mode: RecipientMode): void {
    this.recipientMode.set(mode);
    this.clearError('recipients');
  }

  parseCustomEmails(): void {
    const raw = this.customEmailsRaw;
    const emails = raw
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    this.customEmails.set([...new Set(emails)]);
    this.clearError('recipients');
  }

  clearError(field: 'recipients' | 'subject' | 'body'): void {
    this.cmpErrors.update(e => ({ ...e, [field]: undefined }));
  }

  wrapSelection(before: string, after: string): void {
    const el = document.getElementById('cmp-body') as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = this.campaignBody.substring(start, end);
    this.campaignBody =
      this.campaignBody.substring(0, start) + before + sel + after + this.campaignBody.substring(end);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, end + before.length); });
  }

  insertLink(): void {
    const url   = prompt('Enter URL:');
    const label = prompt('Link text:', 'Click here');
    if (url) { this.campaignBody += `[${label || 'Click here'}](${url})`; }
  }

  insertLine(prefix: string): void {
    this.campaignBody += (this.campaignBody && !this.campaignBody.endsWith('\n') ? '\n' : '') + prefix;
  }

  async sendCampaign(): Promise<void> {
    const errors: { recipients?: string; subject?: string; body?: string } = {};
    if (this.resolvedRecipients().length === 0) errors['recipients'] = 'Please add at least one recipient.';
    if (!this.campaignSubject.trim())            errors['subject']    = 'Subject is required.';
    if (!this.campaignBody.trim())               errors['body']       = 'Email body is required.';
    this.cmpErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

    this.saving.set(true);
    this.sendSuccess.set(false);

    // Save campaign record first to get an ID
    const { data: saved } = await this.sb.from('newsletter_campaigns').insert({
      subject:    this.campaignSubject.trim(),
      preview:    this.campaignPreview.trim(),
      body:       this.campaignBody.trim(),
      recipients: this.resolvedRecipients(),
      status:     'sending',
      created_at: new Date().toISOString(),
    }).select('id').single();

    // Build full HTML for the email
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
        ${this.renderedBody()}
        <hr style="margin:2rem 0;border:none;border-top:1px solid #e5e7eb">
        <p style="font-size:12px;color:#9ca3af;text-align:center">
          You're receiving this because you subscribed to Livwell property updates.<br>
        </p>
      </div>`;

    // Call the edge function via EmailService pattern
    const supabaseUrl = environment.supabase.url;
    const anonKey     = environment.supabase.key;

    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({
        type: 'newsletter_blast',
        data: {
          campaign_id: saved?.id ?? null,
          recipients:  this.resolvedRecipients(),
          subject:     this.campaignSubject.trim(),
          html,
        },
      }),
    });

    const result = await res.json().catch(() => ({ sent: 0, failed: 0 }));
    this.saving.set(false);
    this.sendResult.set({ sent: result.sent ?? 0, failed: result.failed ?? 0 });
    this.sendSuccess.set(true);
  }

  resetCompose(): void {
    this.recipientMode.set('subscribed');
    this.customEmailsRaw = '';
    this.customEmails.set([]);
    this.campaignSubject = '';
    this.campaignPreview = '';
    this.campaignBody    = '';
    this.cmpErrors.set({});
    this.sendSuccess.set(false);
    this.sendResult.set(null);
  }

  private markdownToHtml(md: string): string {
    if (!md) return '';
    const escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Split into paragraphs on blank lines
    const paragraphs = escaped.split(/\n{2,}/);
    const rendered = paragraphs.map(para => {
      const lines = para.split('\n').map(line =>
        line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/_(.+?)_/g, '<em>$1</em>')
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      );

      // Bullet lines
      if (lines.every(l => l.startsWith('• '))) {
        return '<ul>' + lines.map(l => `<li>${l.slice(2)}</li>`).join('') + '</ul>';
      }

      return '<p>' + lines.join('<br>') + '</p>';
    });

    return rendered.join('');
  }
}
