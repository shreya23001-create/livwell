import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-off-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;padding:8rem 2rem 4rem;">
      <h1 style="font-family:Sandena-Medium,Helvetica,Arial,'Lucida Grande',sans-serif;font-size:2.5rem;font-weight:700;color:#0a0e1a">Off-Plan Projects</h1>
      <p style="color:#6b7280;font-size:1rem">Coming soon — browse our exclusive off-plan developments.</p>
      <a routerLink="/" style="color:#444ce7;font-weight:600;text-decoration:none">← Back to Home</a>
    </div>
  `,
})
export class OffPlanComponent {}
