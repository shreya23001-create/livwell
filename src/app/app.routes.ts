import { Routes } from '@angular/router';
import { adminGuard, agentGuard, customerGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  // ── Public website ──────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/navbar/navbar.component').then(m => m.NavbarComponent),
    children: [
      { path: '', loadComponent: () => import('./public/home/home.component').then(m => m.HomeComponent) },
      { path: 'properties', loadComponent: () => import('./public/properties/properties.component').then(m => m.PropertiesComponent) },
      { path: 'properties/:id', loadComponent: () => import('./public/property-detail/property-detail.component').then(m => m.PropertyDetailComponent) },
      { path: 'off-plan', loadComponent: () => import('./public/off-plan/off-plan.component').then(m => m.OffPlanComponent) },
      { path: 'off-plan/:id', loadComponent: () => import('./public/off-plan-detail/off-plan-detail.component').then(m => m.OffPlanDetailComponent) },
      { path: 'agents', loadComponent: () => import('./public/agents/agents.component').then(m => m.AgentsComponent) },
      { path: 'about', loadComponent: () => import('./public/about/about.component').then(m => m.AboutComponent) },
      { path: 'blog', loadComponent: () => import('./public/blog/blog.component').then(m => m.BlogComponent) },
      { path: 'contact', loadComponent: () => import('./public/contact/contact.component').then(m => m.ContactComponent) },
    ],
  },

  // ── Customer login / signup  →  /customer ───────────────
  {
    path: 'customer',
    loadComponent: () =>
      import('./public/customer-auth/customer-auth.component').then(m => m.CustomerAuthComponent),
  },

  // ── Customer portal  →  /my/* ────────────────────────────
  {
    path: 'my',
    canActivate: [customerGuard],
    loadComponent: () =>
      import('./customer/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      { path: 'dashboard',   loadComponent: () => import('./customer/customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent) },
      { path: 'properties',  loadComponent: () => import('./customer/customer-properties/customer-properties.component').then(m => m.CustomerPropertiesComponent) },
      { path: 'enquiries',   loadComponent: () => import('./customer/customer-enquiries/customer-enquiries.component').then(m => m.CustomerEnquiriesComponent) },
      { path: 'profile',     loadComponent: () => import('./customer/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Admin portal ─────────────────────────────────────────
  {
    path: 'admin',
    children: [
      // Standalone login page — no layout, no guard
      {
        path: 'login',
        loadComponent: () =>
          import('./public/auth/auth.component').then(m => m.AuthComponent),
      },
      // Protected admin shell
      {
        path: '',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: 'dashboard', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'properties', loadComponent: () => import('./admin/properties/admin-properties.component').then(m => m.AdminPropertiesComponent) },
          { path: 'leads', loadComponent: () => import('./admin/leads/admin-leads.component').then(m => m.AdminLeadsComponent) },
          { path: 'users', loadComponent: () => import('./admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
          { path: 'reports', loadComponent: () => import('./admin/reports/admin-reports.component').then(m => m.AdminReportsComponent) },
          { path: 'cms', loadComponent: () => import('./admin/cms/admin-cms.component').then(m => m.AdminCmsComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  // ── Agent portal ──────────────────────────────────────────
  {
    path: 'agent',
    children: [
      // Standalone login page — no layout, no guard
      {
        path: 'login',
        loadComponent: () =>
          import('./public/agent-login/agent-login.component').then(m => m.AgentLoginComponent),
      },
      // Protected agent shell
      {
        path: '',
        canActivate: [agentGuard],
        loadComponent: () =>
          import('./agent/agent-layout/agent-layout.component').then(m => m.AgentLayoutComponent),
        children: [
          { path: 'dashboard', loadComponent: () => import('./agent/dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent) },
          { path: 'leads', loadComponent: () => import('./agent/leads/agent-leads.component').then(m => m.AgentLeadsComponent) },
          { path: 'customers', loadComponent: () => import('./agent/customers/agent-customers.component').then(m => m.AgentCustomersComponent) },
          { path: 'properties', loadComponent: () => import('./agent/properties/agent-properties.component').then(m => m.AgentPropertiesComponent) },
          { path: 'calendar', loadComponent: () => import('./agent/calendar/agent-calendar.component').then(m => m.AgentCalendarComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
