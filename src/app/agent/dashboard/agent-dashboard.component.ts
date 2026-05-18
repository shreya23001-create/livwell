import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Agent Dashboard</h1>
      <div class="grid grid-cols-3 gap-6">
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
export class AgentDashboardComponent {
  kpis = [
    { label: 'Assigned Leads', value: '24' },
    { label: 'Active Deals', value: '8' },
    { label: 'Closed This Month', value: '3' },
  ];
}
