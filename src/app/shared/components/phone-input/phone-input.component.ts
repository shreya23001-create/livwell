import { Component, forwardRef, signal, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export const COUNTRY_CODES = [
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+1',   flag: '🇺🇸', name: 'USA/Canada' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }],
  template: `
    <div class="phi-wrap" [class.phi-wrap--err]="hasError">
      <select class="phi-select" [(ngModel)]="selectedCode" (ngModelChange)="emitValue()" [disabled]="disabled">
        @for (c of countries; track c.code) {
          <option [value]="c.code">{{ c.flag }} {{ c.code }}</option>
        }
      </select>
      <input class="phi-input" type="tel" [placeholder]="placeholder"
             [(ngModel)]="numberPart" (ngModelChange)="emitValue()"
             [disabled]="disabled" />
    </div>
  `,
  styles: [`
    .phi-wrap {
      display: flex;
      border: 1.5px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #fff;
      transition: border-color 0.18s;
      &:focus-within { border-color: #1a5c3a; }
      &--err { border-color: #dc3545 !important; }
    }
    .phi-select {
      border: none;
      outline: none;
      background: #f9fafb;
      border-right: 1.5px solid #e5e7eb;
      padding: 0 0.5rem;
      font-size: 0.82rem;
      color: #374151;
      cursor: pointer;
      min-width: 90px;
      flex-shrink: 0;
    }
    .phi-input {
      border: none;
      outline: none;
      flex: 1;
      padding: 0.5rem 0.75rem;
      font-size: 0.82rem;
      color: #111827;
      background: #fff;
      min-width: 0;
      font-family: inherit;
      &::placeholder { color: #adb5bd; }
    }
  `]
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder = '50 000 0000';
  @Input() hasError = false;

  countries = COUNTRY_CODES;
  selectedCode = '+971';
  numberPart = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  emitValue(): void {
    const full = this.numberPart.trim() ? `${this.selectedCode} ${this.numberPart.trim()}` : '';
    this.onChange(full);
    this.onTouched();
  }

  writeValue(val: string): void {
    if (!val) { this.selectedCode = '+971'; this.numberPart = ''; return; }
    const match = COUNTRY_CODES.find(c => val.startsWith(c.code + ' ') || val.startsWith(c.code));
    if (match) {
      this.selectedCode = match.code;
      this.numberPart = val.slice(match.code.length).trim();
    } else {
      this.numberPart = val;
    }
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
