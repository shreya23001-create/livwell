import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-shortlist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cp-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>
      <h3>My Shortlist</h3>
      <p>Properties you shortlist will appear here.</p>
    </div>
  `,
  styles: [`.cp-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:1rem; color:#6b7280; text-align:center; h3{font-size:1.1rem;font-weight:600;color:#111827;margin:0} p{font-size:0.9rem;margin:0} }`]
})
export class CustomerShortlistComponent {}
