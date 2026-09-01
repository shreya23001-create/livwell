import { Component, forwardRef, signal, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

function isoToFlag(iso: string): string {
  return iso.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('');
}

export const COUNTRY_CODES = [
  { code: '+971', iso: 'AE', name: 'United Arab Emirates' },
  { code: '+966', iso: 'SA', name: 'Saudi Arabia' },
  { code: '+974', iso: 'QA', name: 'Qatar' },
  { code: '+973', iso: 'BH', name: 'Bahrain' },
  { code: '+965', iso: 'KW', name: 'Kuwait' },
  { code: '+968', iso: 'OM', name: 'Oman' },
  { code: '+91',  iso: 'IN', name: 'India' },
  { code: '+92',  iso: 'PK', name: 'Pakistan' },
  { code: '+880', iso: 'BD', name: 'Bangladesh' },
  { code: '+94',  iso: 'LK', name: 'Sri Lanka' },
  { code: '+63',  iso: 'PH', name: 'Philippines' },
  { code: '+44',  iso: 'GB', name: 'United Kingdom' },
  { code: '+1',   iso: 'US', name: 'United States' },
  { code: '+61',  iso: 'AU', name: 'Australia' },
  { code: '+49',  iso: 'DE', name: 'Germany' },
  { code: '+33',  iso: 'FR', name: 'France' },
  { code: '+7',   iso: 'RU', name: 'Russia' },
  { code: '+86',  iso: 'CN', name: 'China' },
  { code: '+81',  iso: 'JP', name: 'Japan' },
  { code: '+82',  iso: 'KR', name: 'South Korea' },
  { code: '+93',  iso: 'AF', name: 'Afghanistan' },
  { code: '+355', iso: 'AL', name: 'Albania' },
  { code: '+213', iso: 'DZ', name: 'Algeria' },
  { code: '+376', iso: 'AD', name: 'Andorra' },
  { code: '+244', iso: 'AO', name: 'Angola' },
  { code: '+54',  iso: 'AR', name: 'Argentina' },
  { code: '+374', iso: 'AM', name: 'Armenia' },
  { code: '+43',  iso: 'AT', name: 'Austria' },
  { code: '+994', iso: 'AZ', name: 'Azerbaijan' },
  { code: '+1',   iso: 'BS', name: 'Bahamas' },
  { code: '+501', iso: 'BZ', name: 'Belize' },
  { code: '+229', iso: 'BJ', name: 'Benin' },
  { code: '+975', iso: 'BT', name: 'Bhutan' },
  { code: '+591', iso: 'BO', name: 'Bolivia' },
  { code: '+387', iso: 'BA', name: 'Bosnia and Herzegovina' },
  { code: '+267', iso: 'BW', name: 'Botswana' },
  { code: '+55',  iso: 'BR', name: 'Brazil' },
  { code: '+673', iso: 'BN', name: 'Brunei' },
  { code: '+359', iso: 'BG', name: 'Bulgaria' },
  { code: '+226', iso: 'BF', name: 'Burkina Faso' },
  { code: '+257', iso: 'BI', name: 'Burundi' },
  { code: '+855', iso: 'KH', name: 'Cambodia' },
  { code: '+237', iso: 'CM', name: 'Cameroon' },
  { code: '+1',   iso: 'CA', name: 'Canada' },
  { code: '+238', iso: 'CV', name: 'Cape Verde' },
  { code: '+236', iso: 'CF', name: 'Central African Republic' },
  { code: '+235', iso: 'TD', name: 'Chad' },
  { code: '+56',  iso: 'CL', name: 'Chile' },
  { code: '+57',  iso: 'CO', name: 'Colombia' },
  { code: '+269', iso: 'KM', name: 'Comoros' },
  { code: '+242', iso: 'CG', name: 'Congo (Republic of)' },
  { code: '+506', iso: 'CR', name: 'Costa Rica' },
  { code: '+385', iso: 'HR', name: 'Croatia' },
  { code: '+53',  iso: 'CU', name: 'Cuba' },
  { code: '+357', iso: 'CY', name: 'Cyprus' },
  { code: '+420', iso: 'CZ', name: 'Czech Republic' },
  { code: '+45',  iso: 'DK', name: 'Denmark' },
  { code: '+253', iso: 'DJ', name: 'Djibouti' },
  { code: '+1',   iso: 'DM', name: 'Dominica' },
  { code: '+1',   iso: 'DO', name: 'Dominican Republic' },
  { code: '+593', iso: 'EC', name: 'Ecuador' },
  { code: '+20',  iso: 'EG', name: 'Egypt' },
  { code: '+503', iso: 'SV', name: 'El Salvador' },
  { code: '+240', iso: 'GQ', name: 'Equatorial Guinea' },
  { code: '+291', iso: 'ER', name: 'Eritrea' },
  { code: '+372', iso: 'EE', name: 'Estonia' },
  { code: '+268', iso: 'SZ', name: 'Eswatini' },
  { code: '+251', iso: 'ET', name: 'Ethiopia' },
  { code: '+679', iso: 'FJ', name: 'Fiji' },
  { code: '+358', iso: 'FI', name: 'Finland' },
  { code: '+241', iso: 'GA', name: 'Gabon' },
  { code: '+220', iso: 'GM', name: 'Gambia' },
  { code: '+995', iso: 'GE', name: 'Georgia' },
  { code: '+233', iso: 'GH', name: 'Ghana' },
  { code: '+30',  iso: 'GR', name: 'Greece' },
  { code: '+1',   iso: 'GD', name: 'Grenada' },
  { code: '+502', iso: 'GT', name: 'Guatemala' },
  { code: '+224', iso: 'GN', name: 'Guinea' },
  { code: '+245', iso: 'GW', name: 'Guinea Bissau' },
  { code: '+592', iso: 'GY', name: 'Guyana' },
  { code: '+509', iso: 'HT', name: 'Haiti' },
  { code: '+504', iso: 'HN', name: 'Honduras' },
  { code: '+852', iso: 'HK', name: 'Hong Kong' },
  { code: '+36',  iso: 'HU', name: 'Hungary' },
  { code: '+354', iso: 'IS', name: 'Iceland' },
  { code: '+62',  iso: 'ID', name: 'Indonesia' },
  { code: '+98',  iso: 'IR', name: 'Iran' },
  { code: '+964', iso: 'IQ', name: 'Iraq' },
  { code: '+353', iso: 'IE', name: 'Ireland' },
  { code: '+972', iso: 'IL', name: 'Israel' },
  { code: '+39',  iso: 'IT', name: 'Italy' },
  { code: '+1',   iso: 'JM', name: 'Jamaica' },
  { code: '+962', iso: 'JO', name: 'Jordan' },
  { code: '+7',   iso: 'KZ', name: 'Kazakhstan' },
  { code: '+254', iso: 'KE', name: 'Kenya' },
  { code: '+996', iso: 'KG', name: 'Kyrgyzstan' },
  { code: '+856', iso: 'LA', name: 'Laos' },
  { code: '+371', iso: 'LV', name: 'Latvia' },
  { code: '+961', iso: 'LB', name: 'Lebanon' },
  { code: '+266', iso: 'LS', name: 'Lesotho' },
  { code: '+231', iso: 'LR', name: 'Liberia' },
  { code: '+218', iso: 'LY', name: 'Libya' },
  { code: '+423', iso: 'LI', name: 'Liechtenstein' },
  { code: '+370', iso: 'LT', name: 'Lithuania' },
  { code: '+352', iso: 'LU', name: 'Luxembourg' },
  { code: '+60',  iso: 'MY', name: 'Malaysia' },
  { code: '+960', iso: 'MV', name: 'Maldives' },
  { code: '+223', iso: 'ML', name: 'Mali' },
  { code: '+356', iso: 'MT', name: 'Malta' },
  { code: '+52',  iso: 'MX', name: 'Mexico' },
  { code: '+373', iso: 'MD', name: 'Moldova' },
  { code: '+377', iso: 'MC', name: 'Monaco' },
  { code: '+976', iso: 'MN', name: 'Mongolia' },
  { code: '+382', iso: 'ME', name: 'Montenegro' },
  { code: '+212', iso: 'MA', name: 'Morocco' },
  { code: '+258', iso: 'MZ', name: 'Mozambique' },
  { code: '+95',  iso: 'MM', name: 'Myanmar' },
  { code: '+264', iso: 'NA', name: 'Namibia' },
  { code: '+977', iso: 'NP', name: 'Nepal' },
  { code: '+31',  iso: 'NL', name: 'Netherlands' },
  { code: '+64',  iso: 'NZ', name: 'New Zealand' },
  { code: '+505', iso: 'NI', name: 'Nicaragua' },
  { code: '+227', iso: 'NE', name: 'Niger' },
  { code: '+234', iso: 'NG', name: 'Nigeria' },
  { code: '+389', iso: 'MK', name: 'North Macedonia' },
  { code: '+47',  iso: 'NO', name: 'Norway' },
  { code: '+507', iso: 'PA', name: 'Panama' },
  { code: '+595', iso: 'PY', name: 'Paraguay' },
  { code: '+51',  iso: 'PE', name: 'Peru' },
  { code: '+48',  iso: 'PL', name: 'Poland' },
  { code: '+351', iso: 'PT', name: 'Portugal' },
  { code: '+40',  iso: 'RO', name: 'Romania' },
  { code: '+250', iso: 'RW', name: 'Rwanda' },
  { code: '+221', iso: 'SN', name: 'Senegal' },
  { code: '+381', iso: 'RS', name: 'Serbia' },
  { code: '+65',  iso: 'SG', name: 'Singapore' },
  { code: '+421', iso: 'SK', name: 'Slovakia' },
  { code: '+386', iso: 'SI', name: 'Slovenia' },
  { code: '+27',  iso: 'ZA', name: 'South Africa' },
  { code: '+34',  iso: 'ES', name: 'Spain' },
  { code: '+46',  iso: 'SE', name: 'Sweden' },
  { code: '+41',  iso: 'CH', name: 'Switzerland' },
  { code: '+886', iso: 'TW', name: 'Taiwan' },
  { code: '+255', iso: 'TZ', name: 'Tanzania' },
  { code: '+66',  iso: 'TH', name: 'Thailand' },
  { code: '+216', iso: 'TN', name: 'Tunisia' },
  { code: '+90',  iso: 'TR', name: 'Turkey' },
  { code: '+256', iso: 'UG', name: 'Uganda' },
  { code: '+380', iso: 'UA', name: 'Ukraine' },
  { code: '+598', iso: 'UY', name: 'Uruguay' },
  { code: '+998', iso: 'UZ', name: 'Uzbekistan' },
  { code: '+58',  iso: 'VE', name: 'Venezuela' },
  { code: '+84',  iso: 'VN', name: 'Vietnam' },
  { code: '+260', iso: 'ZM', name: 'Zambia' },
  { code: '+263', iso: 'ZW', name: 'Zimbabwe' },
].map(c => ({ ...c, flag: isoToFlag(c.iso) }));

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }],
  template: `
    <div class="phi-wrap" [class.phi-wrap--err]="hasError">
      <select class="phi-select" [(ngModel)]="selectValue" [disabled]="disabled">
        @for (c of countries; track c.iso) {
          <option [value]="c.code + '|' + c.iso">{{ c.flag }} {{ c.code }} {{ c.name }}</option>
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
      min-width: 160px;
      max-width: 260px;
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
  selectedEntry = 'AE';
  numberPart = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  get selectedCode(): string {
    return this.countries.find(c => c.iso === this.selectedEntry)?.code ?? '+971';
  }

  get selectValue(): string { return `${this.selectedCode}|${this.selectedEntry}`; }
  set selectValue(v: string) { this.selectedEntry = v.split('|')[1] ?? 'AE'; this.emitValue(); }

  emitValue(): void {
    const full = this.numberPart.trim() ? `${this.selectedCode} ${this.numberPart.trim()}` : '';
    this.onChange(full);
    this.onTouched();
  }

  writeValue(val: string): void {
    if (!val) { this.selectedEntry = 'AE'; this.numberPart = ''; return; }
    const match = COUNTRY_CODES.find(c => val.startsWith(c.code + ' ') || val === c.code);
    if (match) {
      this.selectedEntry = match.iso;
      this.numberPart = val.slice(match.code.length).trim();
    } else {
      this.numberPart = val;
    }
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
