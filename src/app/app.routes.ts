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
      { path: 'services', loadComponent: () => import('./public/blog/blog.component').then(m => m.BlogComponent) },
      { path: 'guides', loadComponent: () => import('./public/blog/blog.component').then(m => m.BlogComponent) },
      { path: 'blog', redirectTo: 'guides', pathMatch: 'full' },
      { path: 'contact', loadComponent: () => import('./public/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'commercial', loadComponent: () => import('./public/commercial-properties/commercial-properties.component').then(m => m.CommercialPropertiesComponent) },
      { path: 'commercial/:id', loadComponent: () => import('./public/commercial-property-detail/commercial-property-detail.component').then(m => m.CommercialPropertyDetailComponent) },
      { path: 'luxury-projects', loadComponent: () => import('./public/luxury-projects/luxury-projects.component').then(m => m.LuxuryProjectsComponent) },
      { path: 'luxury-project/:id', loadComponent: () => import('./public/luxury-project-detail/luxury-project-detail.component').then(m => m.LuxuryProjectDetailComponent) },
      { path: 'ultra-luxury-projects', loadComponent: () => import('./public/ultra-luxury-projects/ultra-luxury-projects.component').then(m => m.UltraLuxuryProjectsComponent) },
      { path: 'luxury-properties-for-sale', loadComponent: () => import('./public/luxury-properties-for-sale/luxury-properties-for-sale.component').then(m => m.LuxuryPropertiesForSaleComponent) },
      { path: 'luxury-property/:id', loadComponent: () => import('./public/luxury-property-detail/luxury-property-detail.component').then(m => m.LuxuryPropertyDetailComponent) },
      { path: 'branded-residences', loadComponent: () => import('./public/branded-residences/branded-residences.component').then(m => m.BrandedResidencesComponent) },
      { path: 'branded-residence/:slug', loadComponent: () => import('./public/branded-residence-detail/branded-residence-detail.component').then(m => m.BrandedResidenceDetailComponent) },
      { path: 'areas', loadComponent: () => import('./public/areas/areas.component').then(m => m.AreasComponent) },
      { path: 'areas/:slug', loadComponent: () => import('./public/area-detail/area-detail.component').then(m => m.AreaDetailComponent) },
      { path: 'developers', loadComponent: () => import('./public/developers/developers.component').then(m => m.DevelopersComponent) },
      { path: 'developers/:slug', loadComponent: () => import('./public/developer-detail/developer-detail.component').then(m => m.DeveloperDetailComponent) },
      { path: 'faq', loadComponent: () => import('./public/faq/faq.component').then(m => m.FaqComponent) },
      { path: 'careers', loadComponent: () => import('./public/careers/careers.component').then(m => m.CareersComponent) },
      { path: 'why-invest', loadComponent: () => import('./public/why-invest/why-invest.component').then(m => m.WhyInvestComponent) },
      { path: 'news', loadComponent: () => import('./public/news/news.component').then(m => m.NewsComponent) },
      { path: 'terms-of-use', loadComponent: () => import('./public/terms-of-use/terms-of-use').then(m => m.TermsOfUse) },
      { path: 'privacy-policy', loadComponent: () => import('./public/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy) },
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
      { path: 'dashboard',        loadComponent: () => import('./customer/customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent) },
      { path: 'properties',       loadComponent: () => import('./customer/customer-properties/customer-properties.component').then(m => m.CustomerPropertiesComponent) },
      { path: 'enquiries',        loadComponent: () => import('./customer/customer-enquiries/customer-enquiries.component').then(m => m.CustomerEnquiriesComponent) },
      { path: 'profile',          loadComponent: () => import('./customer/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
      { path: 'shortlist',        loadComponent: () => import('./customer/customer-shortlist/customer-shortlist.component').then(m => m.CustomerShortlistComponent) },
      { path: 'followed-prices',  loadComponent: () => import('./customer/customer-followed-prices/customer-followed-prices.component').then(m => m.CustomerFollowedPricesComponent) },
      { path: 'notifications',    loadComponent: () => import('./customer/customer-notifications/customer-notifications.component').then(m => m.CustomerNotificationsComponent) },
      { path: 'value-tracker',    loadComponent: () => import('./customer/customer-value-tracker/customer-value-tracker.component').then(m => m.CustomerValueTrackerComponent) },
      { path: 'future-interest',  loadComponent: () => import('./customer/customer-future-interest/customer-future-interest.component').then(m => m.CustomerFutureInterestComponent) },
      { path: 'ratings',          loadComponent: () => import('./customer/customer-ratings/customer-ratings.component').then(m => m.CustomerRatingsComponent) },
      { path: 'change-password',  loadComponent: () => import('./customer/customer-change-password/customer-change-password.component').then(m => m.CustomerChangePasswordComponent) },
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
          { path: 'audit-logs', loadComponent: () => import('./admin/audit-logs/admin-audit-logs.component').then(m => m.AdminAuditLogsComponent) },
          { path: 'master', loadComponent: () => import('./admin/master/admin-master.component').then(m => m.AdminMasterComponent) },
          { path: 'profile', loadComponent: () => import('./admin/profile/admin-profile.component').then(m => m.AdminProfileComponent) },
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
          { path: 'profile', loadComponent: () => import('./agent/profile/agent-profile.component').then(m => m.AgentProfileComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
