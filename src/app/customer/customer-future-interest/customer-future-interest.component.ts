import { Component, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const DUBAI_LOCATIONS = [
  'Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay',
  'Jumeirah Beach Residence (JBR)', 'Jumeirah Village Circle (JVC)',
  'Jumeirah Village Triangle (JVT)', 'Arabian Ranches', 'Emirates Hills',
  'Meydan', 'Mohammed Bin Rashid City', 'Dubai Hills Estate',
  'Dubai Creek Harbour', 'Al Barsha', 'Deira', 'Bur Dubai',
  'Jumeirah', 'Al Quoz', 'Dubai South', 'DIFC',
  'Discovery Gardens', 'International City', 'Sports City',
  'Motor City', 'Damac Hills', 'Tilal Al Ghaf',
];

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Office', 'Retail', 'Warehouse'];

@Component({
  selector: 'app-customer-future-interest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fi-wrap">
      <h2 class="fi-title">Future Interest</h2>
      <div class="fi-divider"></div>

      <!-- I am a Buyer -->
      <div class="fi-section">
        <label class="fi-check-row fi-buyer-row">
          <input type="checkbox" [(ngModel)]="isBuyer" />
          <span class="fi-check-box"></span>
          <span class="fi-check-label">I am a buyer</span>
        </label>
      </div>

      <!-- Notify me about -->
      <div class="fi-section">
        <h3 class="fi-section-title">Notify me about</h3>

        <!-- Row 1: Property interest type -->
        <div class="fi-sub-group">
          <p class="fi-sub-label">Property interest</p>
          <div class="fi-check-group">
            @for (item of notifyTypes; track item.key) {
              <label class="fi-check-row">
                <input type="checkbox" [(ngModel)]="item.checked" />
                <span class="fi-check-box"></span>
                <span class="fi-check-label">{{ item.label }}</span>
              </label>
            }
          </div>
        </div>

        <!-- Row 2: Filters -->
        <div class="fi-filters-grid">

          <!-- Budget Range -->
          <div class="fi-filter-block">
            <p class="fi-sub-label">Budget (AED)</p>
            <div class="fi-range-wrap">
              <div class="fi-range-track">
                <div class="fi-range-fill" [style.left.%]="minPct()" [style.width.%]="fillWidth()"></div>
              </div>
              <input type="range" class="fi-range-input fi-range-min"
                [min]="RATE_MIN" [max]="RATE_MAX" [step]="RATE_STEP"
                [(ngModel)]="rateMin" (input)="clampMin()" />
              <input type="range" class="fi-range-input fi-range-max"
                [min]="RATE_MIN" [max]="RATE_MAX" [step]="RATE_STEP"
                [(ngModel)]="rateMax" (input)="clampMax()" />
            </div>
            <div class="fi-range-labels">
              <span>{{ formatAED(rateMin) }}</span>
              <span>{{ formatAED(rateMax) }}</span>
            </div>
          </div>

          <!-- City / Location multi-select -->
          <div class="fi-filter-block">
            <p class="fi-sub-label">City / Location</p>
            <div class="fi-dropdown-wrap" #dropRef>
              <button type="button" class="fi-dropdown-btn" (click)="toggleDrop()">
                @if (selectedLocations.length === 0) {
                  <span class="fi-dropdown-placeholder">Select locationsâ€¦</span>
                } @else {
                  <span class="fi-dropdown-value">{{ selectedLocations.length }} location{{ selectedLocations.length > 1 ? 's' : '' }} selected</span>
                }
                <svg class="fi-dropdown-arrow" [class.open]="dropOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              @if (dropOpen()) {
                <div class="fi-dropdown-menu">
                  <div class="fi-dropdown-search">
                    <input type="text" placeholder="Searchâ€¦" [(ngModel)]="locSearch" class="fi-drop-search-input" />
                  </div>
                  <div class="fi-dropdown-opts">
                    @for (loc of filteredLocations(); track loc) {
                      <label class="fi-drop-opt">
                        <input type="checkbox" [checked]="isLocSelected(loc)" (change)="toggleLoc(loc)" />
                        <span class="fi-drop-check-box"></span>
                        <span>{{ loc }}</span>
                      </label>
                    }
                  </div>
                  @if (selectedLocations.length > 0) {
                    <div class="fi-dropdown-footer">
                      <button type="button" class="fi-drop-clear" (click)="clearLocations()">Clear all</button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Selected tags -->
            @if (selectedLocations.length > 0) {
              <div class="fi-tags">
                @for (loc of selectedLocations; track loc) {
                  <span class="fi-tag">
                    {{ loc }}
                    <button type="button" class="fi-tag-remove" (click)="toggleLoc(loc)">Ã—</button>
                  </span>
                }
              </div>
            }
          </div>

          <!-- Property Type checkboxes -->
          <div class="fi-filter-block">
            <p class="fi-sub-label">Property type</p>
            <div class="fi-check-group fi-check-group--wrap">
              @for (t of notifyPropTypes; track t.key) {
                <label class="fi-check-row">
                  <input type="checkbox" [(ngModel)]="t.checked" />
                  <span class="fi-check-box"></span>
                  <span class="fi-check-label">{{ t.label }}</span>
                </label>
              }
            </div>
          </div>

        </div>
      </div>

      <div class="fi-actions">
        <button class="fi-save-btn" (click)="save()">Save Preferences</button>
        @if (saved()) {
          <span class="fi-saved-msg">Preferences saved.</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .fi-wrap { max-width: 860px; padding: 1.5rem 2rem; }
    .fi-title { font-size: 1.4rem; font-weight: 700; color: #111827; margin: 0 0 1rem; }
    .fi-divider { height: 1px; background: #e5e7eb; margin-bottom: 2rem; }

    .fi-section { margin-bottom: 2rem; }
    .fi-section-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 1.25rem; }
    .fi-sub-label { font-size: 0.78rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.6rem; }
    .fi-sub-group { margin-bottom: 1.5rem; }

    /* Checkboxes */
    .fi-check-group { display: flex; flex-direction: column; gap: 0.55rem; }
    .fi-check-group--wrap { flex-direction: row; flex-wrap: wrap; gap: 0.55rem 1.25rem; }
    .fi-check-row {
      display: flex; align-items: center; gap: 0.55rem; cursor: pointer;
      input[type="checkbox"] { display: none; }
    }
    .fi-buyer-row { margin-top: 0.25rem; }
    .fi-check-box {
      width: 18px; height: 18px; border: 2px solid #d1d5db; border-radius: 4px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      background: #fff; transition: background 0.15s, border-color 0.15s;
    }
    .fi-check-row input[type="checkbox"]:checked + .fi-check-box {
      background: #1a5c3a; border-color: #1a5c3a;
      &::after { content: ''; width: 5px; height: 9px; border: 2px solid #fff; border-top: none; border-left: none; transform: rotate(45deg) translate(-1px, -1px); display: block; }
    }
    .fi-check-label { font-size: 0.9rem; color: #374151; font-weight: 500; }

    /* Filters grid */
    .fi-filters-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem 2rem; }
    .fi-filter-block { }

    /* Range slider */
    .fi-range-wrap { position: relative; height: 36px; margin-bottom: 0.35rem; }
    .fi-range-track {
      position: absolute; top: 50%; left: 0; right: 0; height: 4px;
      background: #e5e7eb; border-radius: 2px; transform: translateY(-50%);
    }
    .fi-range-fill { position: absolute; height: 100%; background: #1a5c3a; border-radius: 2px; }
    .fi-range-input {
      position: absolute; top: 50%; width: 100%; height: 4px; background: transparent;
      appearance: none; -webkit-appearance: none; pointer-events: none; transform: translateY(-50%);
      &::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; pointer-events: all; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 2px solid #1a5c3a; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
      &::-moz-range-thumb { pointer-events: all; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 2px solid #1a5c3a; cursor: pointer; }
    }
    .fi-range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280; font-weight: 500; }

    /* Dropdown */
    .fi-dropdown-wrap { position: relative; }
    .fi-dropdown-btn {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      padding: 0.55rem 0.75rem; border: 1.5px solid #d1d5db; border-radius: 0.5rem;
      background: #fff; cursor: pointer; font-size: 0.875rem; color: #374151;
      transition: border-color 0.15s;
      &:hover, &:focus { border-color: #1a5c3a; outline: none; }
    }
    .fi-dropdown-placeholder { color: #9ca3af; }
    .fi-dropdown-value { color: #111827; font-weight: 500; }
    .fi-dropdown-arrow { width: 1rem; height: 1rem; color: #9ca3af; flex-shrink: 0; transition: transform 0.2s; &.open { transform: rotate(180deg); } }
    .fi-dropdown-menu {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 100;
      background: #fff; border: 1.5px solid #e5e7eb; border-radius: 0.5rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden;
    }
    .fi-dropdown-search { padding: 0.5rem; border-bottom: 1px solid #f3f4f6; }
    .fi-drop-search-input {
      width: 100%; padding: 0.4rem 0.6rem; border: 1px solid #e5e7eb; border-radius: 0.375rem;
      font-size: 0.8rem; color: #374151; background: #f9fafb;
      &:focus { outline: none; border-color: #1a5c3a; }
    }
    .fi-dropdown-opts { max-height: 220px; overflow-y: auto; padding: 0.35rem 0; }
    .fi-drop-opt {
      display: flex; align-items: center; gap: 0.55rem; padding: 0.45rem 0.75rem; cursor: pointer;
      font-size: 0.85rem; color: #374151; transition: background 0.1s;
      &:hover { background: #f0fdf4; }
      input[type="checkbox"] { display: none; }
    }
    .fi-drop-check-box {
      width: 15px; height: 15px; border: 2px solid #d1d5db; border-radius: 3px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #fff;
    }
    .fi-drop-opt input[type="checkbox"]:checked + .fi-drop-check-box {
      background: #1a5c3a; border-color: #1a5c3a;
      &::after { content: ''; width: 4px; height: 7px; border: 1.5px solid #fff; border-top: none; border-left: none; transform: rotate(45deg) translate(-1px,-1px); display: block; }
    }
    .fi-dropdown-footer { padding: 0.4rem 0.75rem; border-top: 1px solid #f3f4f6; }
    .fi-drop-clear { font-size: 0.78rem; color: #dc2626; background: none; border: none; cursor: pointer; padding: 0; &:hover { text-decoration: underline; } }

    /* Tags */
    .fi-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
    .fi-tag {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.2rem 0.5rem; background: #f0fdf4; border: 1px solid #bbf7d0;
      border-radius: 9999px; font-size: 0.72rem; color: #166534; font-weight: 500;
    }
    .fi-tag-remove { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 0.85rem; line-height: 1; padding: 0; &:hover { color: #dc2626; } }

    /* Actions */
    .fi-actions { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
    .fi-save-btn { padding: 0.6rem 1.5rem; background: #1a5c3a; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; &:hover { background: #154d31; } }
    .fi-saved-msg { font-size: 0.85rem; color: #16a34a; }

    /* Responsive */
    @media (max-width: 768px) {
      .fi-filters-grid { grid-template-columns: 1fr; }
      .fi-wrap { padding: 1rem; }
    }
  `]
})
export class CustomerFutureInterestComponent {
  private readonly STORAGE_KEY = 'lw_future_interest_v2';

  readonly RATE_MIN  = 500_000;
  readonly RATE_MAX  = 20_000_000;
  readonly RATE_STEP = 250_000;

  isBuyer = false;

  notifyTypes = [
    { key: 'similar',     label: 'Similar properties',  checked: false },
    { key: 'all_projects',label: 'All projects',         checked: false },
    { key: 'commercial',  label: 'Commercial',           checked: false },
  ];

  notifyPropTypes = PROPERTY_TYPES.map(t => ({ key: t.toLowerCase(), label: t, checked: false }));

  rateMin = this.RATE_MIN;
  rateMax = this.RATE_MAX;

  selectedLocations: string[] = [];
  locSearch = '';
  private _dropOpen = signal(false);
  dropOpen = this._dropOpen.asReadonly();

  saved = signal(false);

  filteredLocations = computed(() => {
    const q = this.locSearch.toLowerCase();
    return q ? DUBAI_LOCATIONS.filter(l => l.toLowerCase().includes(q)) : DUBAI_LOCATIONS;
  });

  minPct()    { return ((this.rateMin - this.RATE_MIN) / (this.RATE_MAX - this.RATE_MIN)) * 100; }
  fillWidth() { return ((this.rateMax - this.rateMin) / (this.RATE_MAX - this.RATE_MIN)) * 100; }

  clampMin() { if (this.rateMin > this.rateMax - this.RATE_STEP) this.rateMin = this.rateMax - this.RATE_STEP; }
  clampMax() { if (this.rateMax < this.rateMin + this.RATE_STEP) this.rateMax = this.rateMin + this.RATE_STEP; }

  formatAED(v: number): string {
    if (!v) return '—';
    return `AED ${v.toLocaleString('en-US')}`;
  }

  toggleDrop()  { this._dropOpen.update(v => !v); this.locSearch = ''; }
  isLocSelected(loc: string) { return this.selectedLocations.includes(loc); }
  toggleLoc(loc: string) {
    if (this.isLocSelected(loc)) this.selectedLocations = this.selectedLocations.filter(l => l !== loc);
    else this.selectedLocations = [...this.selectedLocations, loc];
  }
  clearLocations() { this.selectedLocations = []; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this._dropOpen() && !(e.target as HTMLElement).closest('.fi-dropdown-wrap')) {
      this._dropOpen.set(false);
    }
  }

  constructor() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const s = JSON.parse(stored);
        this.isBuyer           = s.isBuyer          ?? false;
        this.rateMin           = s.rateMin           ?? this.RATE_MIN;
        this.rateMax           = s.rateMax           ?? this.RATE_MAX;
        this.selectedLocations = s.locations         ?? [];
        if (s.notifyTypes)     this.notifyTypes     = this.notifyTypes.map(t     => ({ ...t,     checked: s.notifyTypes[t.key]     ?? false }));
        if (s.notifyPropTypes) this.notifyPropTypes = this.notifyPropTypes.map(t => ({ ...t, checked: s.notifyPropTypes[t.key] ?? false }));
      }
    } catch {}
  }

  save(): void {
    try {
      const ntMap: Record<string, boolean> = {};
      this.notifyTypes.forEach(t => ntMap[t.key] = t.checked);
      const nptMap: Record<string, boolean> = {};
      this.notifyPropTypes.forEach(t => nptMap[t.key] = t.checked);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        isBuyer:        this.isBuyer,
        rateMin:        this.rateMin,
        rateMax:        this.rateMax,
        locations:      this.selectedLocations,
        notifyTypes:    ntMap,
        notifyPropTypes: nptMap,
      }));
    } catch {}
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}


