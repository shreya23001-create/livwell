import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div class="grid grid-cols-4 gap-6">
        @for (kpi of kpis; track kpi.label) {
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p class="text-sm text-gray-500">{{ kpi.label }}</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpi.value }}</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent {
  kpis = [
    { label: 'Total Properties', value: '248' },
    { label: 'Total Leads', value: '1,284' },
    { label: 'Active Agents', value: '32' },
    { label: 'Conversion Rate', value: '18.4%' },
  ];
}
