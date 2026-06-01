import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-value-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cp-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      <h3>Property Value Tracker</h3>
      <p>Monitor the value of your tracked properties over time.</p>
    </div>
  `,
  styles: [`.cp-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:1rem; color:#6b7280; text-align:center; h3{font-size:1.1rem;font-weight:600;color:#111827;margin:0} p{font-size:0.9rem;margin:0} }`]
})
export class CustomerValueTrackerComponent {}
