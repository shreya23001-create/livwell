import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-followed-prices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cp-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
      <h3>My Followed Prices</h3>
      <p>Track price changes on properties you follow.</p>
    </div>
  `,
  styles: [`.cp-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:1rem; color:#6b7280; text-align:center; h3{font-size:1.1rem;font-weight:600;color:#111827;margin:0} p{font-size:0.9rem;margin:0} }`]
})
export class CustomerFollowedPricesComponent {}
