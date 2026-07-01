import {
  Component, Input, Output, EventEmitter, signal, computed,
  HostListener, ElementRef, inject, OnChanges, SimpleChanges, SecurityContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface MsOption {
  value: string;
  label: string;
  iconHtml?: SafeHtml;
}

@Component({
  selector: 'app-ms-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ms-wrap" [class.ms-wrap--open]="open()">
      <!-- Trigger -->
      <div class="ms-trigger" (click)="toggle()">
        <svg class="ms-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span class="ms-trigger-text" [class.ms-trigger-placeholder]="!selected().length">
          {{ triggerLabel() }}
        </span>
        @if (selected().length) {
          <button class="ms-clear" type="button" (mousedown)="$event.stopPropagation(); clearAll()">×</button>
        }
        <svg class="ms-chevron" [class.ms-chevron--up]="open()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>

      <!-- Dropdown -->
      @if (open()) {
        <div class="ms-dropdown" (click)="$event.stopPropagation()">
          <div class="ms-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input #searchInput class="ms-search" type="text" [placeholder]="'Search ' + placeholder.toLowerCase() + '…'"
              [ngModel]="query()" (ngModelChange)="query.set($event)" autocomplete="off">
            @if (query()) {
              <button type="button" class="ms-search-clear" (mousedown)="$event.preventDefault(); query.set('')">×</button>
            }
          </div>
          <div class="ms-list">
            <!-- Selected first -->
            @for (opt of selectedFirst(); track opt.value) {
              <label class="ms-option" [class.ms-option--checked]="isSelected(opt.value)"
                (mousedown)="$event.preventDefault(); toggle(opt.value)">
                <span class="ms-checkbox" [class.ms-checkbox--checked]="isSelected(opt.value)">
                  @if (isSelected(opt.value)) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                    </svg>
                  }
                </span>
                @if (opt.iconHtml) {
                  <span class="ms-opt-icon" [innerHTML]="opt.iconHtml"></span>
                }
                <span class="ms-opt-label">{{ opt.label }}</span>
              </label>
            }
            @if (!filteredOpts().length) {
              <p class="ms-empty">No results</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './ms-select.component.scss',
})
export class MsSelectComponent implements OnChanges {
  private el = inject(ElementRef);

  @Input() options: MsOption[] = [];
  @Input() value: string[] = [];
  @Input() placeholder = 'Select…';
  @Input() multi = true;

  @Output() valueChange = new EventEmitter<string[]>();

  open    = signal(false);
  query   = signal('');
  selected = signal<string[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.selected.set([...(this.value ?? [])]);
    }
  }

  triggerLabel = computed(() => {
    const sel = this.selected();
    if (!sel.length) return this.placeholder;
    const labels = sel.map(v => {
      const opt = this.options.find(o => o.value === v);
      return opt ? opt.label : v;
    });
    return labels.join(', ');
  });

  filteredOpts = computed(() => {
    const q = this.query().toLowerCase();
    return q ? this.options.filter(o => o.label.toLowerCase().includes(q)) : this.options;
  });

  selectedFirst = computed(() => {
    const sel = new Set(this.selected());
    const checked = this.filteredOpts().filter(o => sel.has(o.value));
    const unchecked = this.filteredOpts().filter(o => !sel.has(o.value));
    return [...checked, ...unchecked];
  });

  isSelected(val: string): boolean {
    return this.selected().includes(val);
  }

  toggle(val?: string) {
    if (val === undefined) {
      this.open.update(v => !v);
      if (this.open()) this.query.set('');
      return;
    }
    if (!this.multi) {
      this.selected.set([val]);
      this.open.set(false);
      this.valueChange.emit([val]);
      return;
    }
    const cur = this.selected();
    const next = cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val];
    this.selected.set(next);
    this.valueChange.emit(next);
  }

  clearAll() {
    this.selected.set([]);
    this.valueChange.emit([]);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) {
      this.open.set(false);
    }
  }
}
