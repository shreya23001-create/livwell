import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-future-interest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fi-wrap">
      <h2 class="fi-title">Future Interest</h2>
      <div class="fi-divider"></div>

      <div class="fi-grid">
        @for (item of interests; track item.key) {
          <div class="fi-item">
            <span class="fi-item-label">{{ item.label }}</span>
            <label class="fi-toggle">
              <input type="checkbox" [(ngModel)]="item.enabled" />
              <span class="fi-toggle-slider"></span>
            </label>
          </div>
        }
      </div>

      <div class="fi-actions">
        <button class="fi-save-btn" (click)="save()">Save</button>
        @if (saved()) {
          <span class="fi-saved-msg">Saved successfully.</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .fi-wrap { max-width: 860px; padding: 1.5rem 2rem; }
    .fi-title { font-size: 1.4rem; font-weight: 700; color: #111827; margin: 0 0 1rem; }
    .fi-divider { height: 1px; background: #e5e7eb; margin-bottom: 2rem; }
    .fi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem 3rem; }
    .fi-item { display: flex; flex-direction: column; gap: 0.6rem; }
    .fi-item-label { font-size: 0.88rem; color: #1a5c3a; font-weight: 500; }

    /* Toggle switch */
    .fi-toggle { position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;
      input { opacity: 0; width: 0; height: 0; }
    }
    .fi-toggle-slider {
      position: absolute; inset: 0; background: #d1d5db; border-radius: 2rem; transition: 0.3s;
      &::before { content: ''; position: absolute; width: 20px; height: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
    }
    .fi-toggle input:checked + .fi-toggle-slider { background: #1a5c3a; }
    .fi-toggle input:checked + .fi-toggle-slider::before { transform: translateX(22px); }

    .fi-actions { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
    .fi-save-btn { padding: 0.6rem 1.5rem; background: #1a5c3a; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; &:hover { background: #154d31; } }
    .fi-saved-msg { font-size: 0.85rem; color: #16a34a; }
  `]
})
export class CustomerFutureInterestComponent {
  private readonly STORAGE_KEY = 'lw_future_interest';

  interests = [
    { key: 'buy',   label: 'Buy a property',      enabled: false },
    { key: 'sell',  label: 'Sell a property',      enabled: false },
    { key: 'lease', label: 'Lease out a property', enabled: false },
    { key: 'rent',  label: 'Rent a property',      enabled: false },
  ];

  saved = signal(false);

  constructor() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const saved: Record<string, boolean> = JSON.parse(stored);
        this.interests = this.interests.map(i => ({ ...i, enabled: saved[i.key] ?? false }));
      }
    } catch {}
  }

  save(): void {
    try {
      const state: Record<string, boolean> = {};
      this.interests.forEach(i => state[i.key] = i.enabled);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {}
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}
