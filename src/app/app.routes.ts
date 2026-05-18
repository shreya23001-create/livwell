import { Routes } from '@angular/router';
import { adminGuard, agentGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  // Public website routes
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/navbar/navbar.component').then(m => m.NavbarComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./public/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./public/properties/properties.component').then(m => m.PropertiesComponent),
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./public/property-detail/property-detail.component').then(m => m.PropertyDetailComponent),
      },
      {
        path: 'off-plan',
        loadComponent: () =>
          import('./public/off-plan/off-plan.component').then(m => m.OffPlanComponent),
      },
      {
        path: 'off-plan/:id',
        loadComponent: () =>
          import('./public/off-plan/off-plan.component').then(m => m.OffPlanComponent),
      },
      {
        path: 'agents',
        loadComponent: () =>
          import('./public/agents/agents.component').then(m => m.AgentsComponent),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./public/about/about.component').then(m => m.AboutComponent),
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./public/blog/blog.component').then(m => m.BlogComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./public/contact/contact.component').then(m => m.ContactComponent),
      },
    ],
  },

  // Auth routes
  {
    path: 'auth',
    loadComponent: () =>
      import('./public/auth/auth.component').then(m => m.AuthComponent),
  },

  // Admin portal
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./admin/properties/admin-properties.component').then(m => m.AdminPropertiesComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./admin/leads/admin-leads.component').then(m => m.AdminLeadsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./admin/users/admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./admin/reports/admin-reports.component').then(m => m.AdminReportsComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Agent portal
  {
    path: 'agent',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./agent/agent-layout/agent-layout.component').then(m => m.AgentLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./agent/dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./agent/leads/agent-leads.component').then(m => m.AgentLeadsComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./agent/customers/agent-customers.component').then(m => m.AgentCustomersComponent),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./agent/properties/agent-properties.component').then(m => m.AgentPropertiesComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];
