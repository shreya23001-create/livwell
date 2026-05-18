import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="min-h-screen flex items-center justify-center"><h1 class="text-3xl font-display">Admin Properties</h1></div>`,
})
export class AdminPropertiesComponent {}
