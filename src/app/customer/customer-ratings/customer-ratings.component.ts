import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-ratings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cp-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <h3>My Project Ratings</h3>
      <p>Your ratings and reviews for projects will appear here.</p>
    </div>
  `,
  styles: [`.cp-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:1rem; color:#6b7280; text-align:center; h3{font-size:1.1rem;font-weight:600;color:#111827;margin:0} p{font-size:0.9rem;margin:0} }`]
})
export class CustomerRatingsComponent {}
