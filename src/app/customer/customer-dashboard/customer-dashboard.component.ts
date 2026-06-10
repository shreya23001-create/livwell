import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Enquiry {
  id: number;
  property: string;
  agent: string;
  date: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  message: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss',
})
export class CustomerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private sb = inject(SupabaseService).client;

  today = new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  showWelcome = signal(false);
  loading = signal(true);

  savedCount       = signal(0);
  totalEnquiries   = signal(0);
  recentEnquiries  = signal<Enquiry[]>([]);

  constructor() {
    if (this.auth.newlyRegistered()) {
      this.showWelcome.set(true);
      this.auth.clearNewlyRegistered();
    }
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (!user?.email) { this.loading.set(false); return; }

    const [savedRes, countRes, leadsRes] = await Promise.all([
      this.sb.from('saved_properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      this.sb.from('admin_leads').select('id', { count: 'exact', head: true }).eq('email', user.email),
      this.sb.from('admin_leads')
        .select('id, notes, status, assigned_agent, created_at, location, property_type')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    this.savedCount.set(savedRes.count ?? 0);
    this.totalEnquiries.set(countRes.count ?? 0);

    if (leadsRes.data) {
      this.recentEnquiries.set(leadsRes.data.map((r: any) => ({
        id:       r.id,
        property: r.property_type || r.location || 'Property Enquiry',
        agent:    r.assigned_agent || 'Unassigned',
        date:     new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        status:   r.status || 'new',
        message:  r.notes || '',
      })));
    }

    this.loading.set(false);
  }

  dismissWelcome(): void { this.showWelcome.set(false); }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  firstName(): string {
    return this.auth.currentUser()?.name?.split(' ')[0] ?? 'there';
  }

  statusLabel(s: string): string {
    return { new: 'New', contacted: 'Contacted', qualified: 'Qualified', closed: 'Closed', available: 'Available', reserved: 'Reserved', sold: 'Sold' }[s] ?? s;
  }
}
