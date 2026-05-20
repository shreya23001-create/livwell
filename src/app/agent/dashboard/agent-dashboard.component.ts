import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
})
export class AgentDashboardComponent {
  readonly today = new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });


  readonly kpis = [
    { label: 'My Leads',        value: '38', sub: '4 new this week',    icon: 'leads',    trend: '+12%', up: true  },
    { label: 'Active Deals',    value: '6',  sub: '2 in negotiation',   icon: 'deals',    trend: '+2',   up: true  },
    { label: 'Won This Month',  value: '3',  sub: 'AED 1.4M revenue',   icon: 'won',      trend: '+1',   up: true  },
    { label: 'Conversion Rate', value: '24%',sub: 'Leads to closed',    icon: 'rate',     trend: '+3%',  up: true  },
  ];

  readonly recentLeads = [
    { name: 'Mohammed Al-Rashidi', interest: 'Buy · Downtown Dubai · AED 2M–3M',   status: 'new',         time: '2h ago'  },
    { name: 'James Carter',        interest: 'Invest · Palm Jumeirah · AED 5M+',   status: 'qualified',   time: '1d ago'  },
    { name: 'Elena Petrova',       interest: 'Invest · Dubai Hills · AED 2M',      status: 'contacted',   time: '2d ago'  },
    { name: 'David Kim',           interest: 'Buy · JVC · AED 1.5M',               status: 'qualified',   time: '3d ago'  },
    { name: 'Robert Wilson',       interest: 'Invest · Palm Jumeirah · AED 10M+',  status: 'new',         time: '3d ago'  },
  ];

  readonly myProperties = [
    { name: 'Marina Heights 2BHK',   location: 'Dubai Marina',   price: 'AED 2.8M', type: 'Apartment', status: 'available' },
    { name: 'Palm Villa 4BR',         location: 'Palm Jumeirah',  price: 'AED 7.5M', type: 'Villa',     status: 'available' },
    { name: 'DIFC Studio',            location: 'DIFC',           price: 'AED 90K/yr', type: 'Studio',  status: 'rented'    },
    { name: 'Skyline Penthouse',      location: 'Downtown Dubai', price: 'AED 5.2M', type: 'Penthouse', status: 'reserved'  },
  ];

  readonly upcomingTasks = [
    { task: 'Follow up with James Carter — Palm Jumeirah viewing',  due: 'Today, 3pm'       },
    { task: 'Send proposal to Elena Petrova — Dubai Hills unit',    due: 'Tomorrow, 10am'   },
    { task: 'Property viewing — David Kim, JVC Townhouse',          due: 'Thu, 2pm'         },
    { task: 'Contract signing — Fatima Al-Zaabi, DIFC Apartment',   due: 'Fri, 11am'        },
  ];

  labelStatus(s: string): string {
    return { new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' }[s] ?? s;
  }
}
