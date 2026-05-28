import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  trend: 'up' | 'down' | 'flat';
  trendVal: string;
  color: string;
}

interface BarItem  { label: string; value: number; pct: number; color: string; }
interface AgentRow { name: string; leads: number; won: number; revenue: string; conversion: number; }
interface Activity { icon: string; text: string; time: string; type: 'lead' | 'property' | 'user' | 'deal'; }

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reports.component.html',
  styleUrl:    './admin-reports.component.scss',
})
export class AdminReportsComponent {

  period = signal<'week' | 'month' | 'quarter' | 'year'>('month');

  readonly kpis: KpiCard[] = [
    { label: 'Total Revenue',      value: 'AED 4.2M',  sub: 'This month',         trend: 'up',   trendVal: '+18%',  color: 'gold'  },
    { label: 'Properties Sold',    value: '24',         sub: 'This month',         trend: 'up',   trendVal: '+6',    color: 'green' },
    { label: 'Active Leads',       value: '138',        sub: '12 new today',       trend: 'up',   trendVal: '+22%',  color: 'blue'  },
    { label: 'Conversion Rate',    value: '18.4%',      sub: 'Leads → Won',        trend: 'up',   trendVal: '+2.1%', color: 'purple'},
    { label: 'Avg. Deal Value',    value: 'AED 175K',   sub: 'Per closed deal',    trend: 'down', trendVal: '-3%',   color: 'red'   },
    { label: 'Active Agents',      value: '8',          sub: '2 new this quarter', trend: 'flat', trendVal: '0%',    color: 'gray'  },
  ];

  readonly leadsByStatus: BarItem[] = [
    { label: 'New',         value: 32, pct: 100, color: '#f59e0b' },
    { label: 'Contacted',   value: 28, pct: 87,  color: '#3b82f6' },
    { label: 'Qualified',   value: 19, pct: 59,  color: '#10b981' },
    { label: 'Negotiating', value: 12, pct: 37,  color: '#8b5cf6' },
    { label: 'Won',         value: 9,  pct: 28,  color: '#6366f1' },
    { label: 'Lost',        value: 6,  pct: 19,  color: '#ef4444' },
  ];

  readonly leadsBySource: BarItem[] = [
    { label: 'Website',      value: 41, pct: 100, color: '#3b82f6' },
    { label: 'Portal',       value: 28, pct: 68,  color: '#8b5cf6' },
    { label: 'Referral',     value: 22, pct: 54,  color: '#10b981' },
    { label: 'Social Media', value: 18, pct: 44,  color: '#f59e0b' },
    { label: 'Walk-in',      value: 12, pct: 29,  color: '#6366f1' },
    { label: 'Cold Call',    value: 7,  pct: 17,  color: '#6b7280' },
  ];

  readonly propertiesByType: BarItem[] = [
    { label: 'Apartment',  value: 48, pct: 100, color: '#3b82f6' },
    { label: 'Villa',      value: 31, pct: 65,  color: '#10b981' },
    { label: 'Townhouse',  value: 18, pct: 38,  color: '#8b5cf6' },
    { label: 'Penthouse',  value: 9,  pct: 19,  color: '#6366f1' },
    { label: 'Office',     value: 6,  pct: 13,  color: '#f59e0b' },
  ];

  readonly monthlyRevenue: BarItem[] = [
    { label: 'Jan', value: 2.8, pct: 56, color: '#6366f1' },
    { label: 'Feb', value: 3.1, pct: 62, color: '#6366f1' },
    { label: 'Mar', value: 2.4, pct: 48, color: '#6366f1' },
    { label: 'Apr', value: 3.8, pct: 76, color: '#6366f1' },
    { label: 'May', value: 4.2, pct: 84, color: '#6366f1' },
    { label: 'Jun', value: 3.6, pct: 72, color: '#6366f1' },
    { label: 'Jul', value: 4.5, pct: 90, color: '#6366f1' },
    { label: 'Aug', value: 5.0, pct: 100, color: '#6366f1' },
    { label: 'Sep', value: 4.1, pct: 82, color: '#6366f1' },
    { label: 'Oct', value: 3.9, pct: 78, color: '#6366f1' },
    { label: 'Nov', value: 4.7, pct: 94, color: '#6366f1' },
    { label: 'Dec', value: 4.2, pct: 84, color: '#6366f1' },
  ];

  readonly topAgents: AgentRow[] = [
    { name: 'Sarah Al-Mansouri', leads: 38, won: 9,  revenue: 'AED 1.4M', conversion: 24 },
    { name: 'Ahmed Hassan',      leads: 21, won: 5,  revenue: 'AED 820K', conversion: 24 },
    { name: 'Rania Khalid',      leads: 15, won: 3,  revenue: 'AED 510K', conversion: 20 },
    { name: 'Omar Al-Farsi',     leads: 4,  won: 0,  revenue: 'AED 0',    conversion: 0  },
  ];

  readonly recentActivity: Activity[] = [
    { icon: 'fa-solid fa-trophy',        text: 'Deal closed — Khalid Al-Maktoum, Business Bay Penthouse (AED 4M)',  time: '2 hours ago',   type: 'deal'     },
    { icon: 'fa-solid fa-user',          text: 'New lead — Robert Wilson via Social Media (AED 10M+ budget)',        time: '3 hours ago',   type: 'lead'     },
    { icon: 'fa-solid fa-house',         text: 'New property listed — Marina Heights, 3BHK Apartment (AED 2.8M)',   time: '5 hours ago',   type: 'property' },
    { icon: 'fa-solid fa-circle-check',  text: 'Lead qualified — David Kim, Jumeirah Village Townhouse',             time: '7 hours ago',   type: 'lead'     },
    { icon: 'fa-solid fa-users',         text: 'New agent joined — Omar Al-Farsi (pending verification)',            time: '1 day ago',     type: 'user'     },
    { icon: 'fa-solid fa-trophy',        text: 'Deal closed — James Carter, Palm Jumeirah Villa (AED 5.2M)',         time: '2 days ago',    type: 'deal'     },
    { icon: 'fa-solid fa-house',         text: 'Property sold — Skyline Residences Unit 804, Downtown Dubai',        time: '2 days ago',    type: 'property' },
    { icon: 'fa-solid fa-user',          text: 'New lead — Tariq Ibrahim via Website (AED 3M–4M budget)',            time: '3 days ago',    type: 'lead'     },
  ];

  maxAgentLeads = computed(() => Math.max(...this.topAgents.map(a => a.leads)));
}
