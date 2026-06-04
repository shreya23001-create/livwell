import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Enquiry {
  id: number;
  property: string;
  location: string;
  budget: string;
  agent: string;
  agentInitials: string;
  date: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  message: string;
}

@Component({
  selector: 'app-customer-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-enquiries.component.html',
  styleUrl: './customer-enquiries.component.scss',
})
export class CustomerEnquiriesComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  filterStatus = signal('all');
  expandedId   = signal<number | null>(null);
  loading      = signal(true);

  enquiries = signal<Enquiry[]>([]);

  filtered = computed(() => {
    const s = this.filterStatus();
    return s === 'all' ? this.enquiries() : this.enquiries().filter(e => e.status === s);
  });

  stats = computed(() => ({
    total:     this.enquiries().length,
    new:       this.enquiries().filter(e => e.status === 'new').length,
    contacted: this.enquiries().filter(e => e.status === 'contacted').length,
    qualified: this.enquiries().filter(e => e.status === 'qualified').length,
    closed:    this.enquiries().filter(e => e.status === 'closed').length,
  }));

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user?.email) { this.loading.set(false); return; }

    const { data } = await this.sb
      .from('admin_leads')
      .select('id, name, notes, status, assigned_agent, created_at, location, property_type, budget')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (data) {
      this.enquiries.set(data.map((r: any) => ({
        id:            r.id,
        property:      r.property_type || 'General Enquiry',
        location:      r.location      || '',
        budget:        r.budget        || '',
        agent:         r.assigned_agent || 'Unassigned',
        agentInitials: (r.assigned_agent || 'UA').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        date:          new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        status:        r.status || 'new',
        message:       r.notes  || '',
      })));
    }
    this.loading.set(false);
  }

  toggleExpand(id: number): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  statusLabel(s: string): string {
    return { new: 'New', contacted: 'Contacted', qualified: 'Qualified', closed: 'Closed' }[s] ?? s;
  }
}
