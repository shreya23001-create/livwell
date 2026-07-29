import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { ToastComponent } from './shared/components/toast/toast.component';

const ROUTE_TITLES: Record<string, string> = {
  '':                            'Livwell — Dubai Real Estate',
  'properties':                  'Properties for Sale & Rent | Livwell',
  'off-plan':                    'Off-Plan Projects | Livwell',
  'projects':                    'Projects | Livwell',
  'agents':                      'Our Agents | Livwell',
  'about':                       'About Us | Livwell',
  'contact':                     'Contact Us | Livwell',
  'commercial':                  'Commercial Properties | Livwell',
  'luxury-projects':             'Luxury Projects | Livwell',
  'ultra-luxury-projects':       'Ultra Luxury Projects | Livwell',
  'luxury-properties-for-sale':  'Luxury Properties | Livwell',
  'branded-residences':          'Branded Residences | Livwell',
  'areas':                       'Areas in Dubai | Livwell',
  'developers':                  'Developers | Livwell',
  'faq':                         'FAQ | Livwell',
  'careers':                     'Careers | Livwell',
  'why-invest':                  'Why Invest in Dubai | Livwell',
  'news':                        'News | Livwell',
  'blog':                        'Blog | Livwell',
  'guides':                      'Property Guides | Livwell',
  'services':                    'Services | Livwell',
  'terms-of-use':                'Terms of Use | Livwell',
  'privacy-policy':              'Privacy Policy | Livwell',
  'customer':                    'Sign In | Livwell',
  'admin/login':                 'Admin Login | Livwell',
  'admin/dashboard':             'Dashboard | Livwell Admin',
  'admin/properties':            'Properties | Livwell Admin',
  'admin/projects':              'Projects | Livwell Admin',
  'admin/leads':                 'Leads | Livwell Admin',
  'admin/lead-profile':          'Lead Profile | Livwell Admin',
  'admin/users':                 'Users | Livwell Admin',
  'admin/reports':               'Reports | Livwell Admin',
  'admin/cms':                   'CMS | Livwell Admin',
  'admin/blogs':                 'Blogs | Livwell Admin',
  'admin/news':                  'News | Livwell Admin',
  'admin/master':                'Master Data | Livwell Admin',
  'admin/developers':            'Developers | Livwell Admin',
  'admin/careers':               'Careers | Livwell Admin',
  'admin/templates':             'Templates | Livwell Admin',
  'admin/profile':               'My Profile | Livwell Admin',
  'admin/audit-logs':            'Audit Logs | Livwell Admin',
  'agent/dashboard':             'Dashboard | Livwell Agent',
  'agent/properties':            'Properties | Livwell Agent',
  'agent/projects':              'Projects | Livwell Agent',
  'agent/leads':                 'Leads | Livwell Agent',
  'agent/customers':             'Customers | Livwell Agent',
  'agent/lead-profile':          'Lead Profile | Livwell Agent',
  'agent/lead-followups':        'Follow-Up History | Livwell Agent',
  'agent/calendar':              'Calendar | Livwell Agent',
  'agent/profile':               'My Profile | Livwell Agent',
  'my/dashboard':                'My Dashboard | Livwell',
  'my/properties':               'Saved Properties | Livwell',
  'my/shortlist':                'Shortlist | Livwell',
  'my/enquiries':                'My Enquiries | Livwell',
  'my/profile':                  'My Profile | Livwell',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `<router-outlet /><app-toast />`,
})
export class App implements OnInit {
  private titleSvc = inject(Title);
  private router   = inject(Router);

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url: string = e.urlAfterRedirects ?? e.url ?? '';
        // Strip leading slash and query params/fragments
        const path = url.replace(/^\//, '').split('?')[0].split('#')[0];

        // Exact match first
        if (ROUTE_TITLES[path]) {
          this.titleSvc.setTitle(ROUTE_TITLES[path]);
          return;
        }

        // Segment-based match (handles detail pages — title set by each component via Title service)
        // Fall back to first-segment match
        const firstSegment = path.split('/')[0];
        const secondSegment = path.split('/').slice(0, 2).join('/');
        if (ROUTE_TITLES[secondSegment]) {
          this.titleSvc.setTitle(ROUTE_TITLES[secondSegment]);
          return;
        }
        if (ROUTE_TITLES[firstSegment]) {
          this.titleSvc.setTitle(ROUTE_TITLES[firstSegment]);
          return;
        }

        this.titleSvc.setTitle('Livwell — Dubai Real Estate');
      });
  }
}
