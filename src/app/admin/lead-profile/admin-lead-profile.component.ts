import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AdminDataService } from '../../shared/services/admin-data.service';

interface LeadDetail {
  id: number; name: string; email: string; phone: string;
  status: string; category: string; budget: string;
  location: string; propertyType: string; source: string;
  notes: string; assignedAgent: string;
  createdDate: string; lastContact: string;
  followUpDate: string; followUpNote: string;
}

@Component({
  selector: 'app-admin-lead-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-lead-profile.component.html',
  styleUrl: './admin-lead-profile.component.scss',
})
export class AdminLeadProfileComponent implements OnInit {
  private sb      = inject(SupabaseService).client;
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private dataSvc = inject(AdminDataService);

  lead        = signal<LeadDetail | null>(null);
  loading     = signal(true);
  activeTab   = signal<'overview' | 'followup' | 'activity'>('overview');
  followUps   = signal<any[]>([]);
  fuLoading   = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);

  leadAuditLogs = computed(() => {
    const lead = this.lead();
    if (!lead) return [];
    const name = lead.name.toLowerCase();
    return this.dataSvc.auditLogs().filter(log =>
      log.module === 'lead' && log.detail.toLowerCase().includes(name)
    );
  });

  readonly pipelineStages = [
    { status: 'new',         label: 'New Lead'    },
    { status: 'contacted',   label: 'Contacted'   },
    { status: 'qualified',   label: 'Qualified'   },
    { status: 'negotiating', label: 'Negotiating' },
    { status: 'won',         label: 'Won'         },
    { status: 'lost',        label: 'Lost'        },
  ];

  readonly stageColors: Record<string, string> = {
    new: '#f59e0b', contacted: '#3b82f6', qualified: '#10b981',
    negotiating: '#8b5cf6', won: '#6366f1', lost: '#ef4444',
  };

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/leads']); return; }
    await this.loadLead(id);
    await this.loadFollowUps(id);
  }

  private async loadLead(id: number): Promise<void> {
    this.loading.set(true);
    const { data } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, category, budget, location, property_type, notes, assigned_agent, created_at, last_contact, follow_up_date, follow_up_note')
      .eq('id', id)
      .maybeSingle();
    if (!data) { this.router.navigate(['/admin/leads']); return; }
    this.lead.set({
      id:            data.id,
      name:          data.name          || '',
      email:         data.email         || '',
      phone:         data.phone         || '',
      status:        data.status        || 'new',
      category:      data.category      || 'buy',
      budget:        data.budget        || '',
      location:      data.location      || '',
      propertyType:  data.property_type || '',
      source:        data.source        || 'website',
      notes:         data.notes         || '',
      assignedAgent: data.assigned_agent || 'Unassigned',
      createdDate:   (data.created_at   || '').slice(0, 10),
      lastContact:   data.last_contact  || '',
      followUpDate:  data.follow_up_date || '',
      followUpNote:  data.follow_up_note || '',
    });
    this.loading.set(false);
  }

  private async loadFollowUps(id: number): Promise<void> {
    this.fuLoading.set(true);
    const { data } = await this.sb
      .from('lead_follow_ups')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });
    this.followUps.set(data ?? []);
    this.fuLoading.set(false);
  }

  isPastStage(stage: string, currentStatus: string): boolean {
    const order = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
    return order.indexOf(stage) < order.indexOf(currentStatus) && currentStatus !== 'lost';
  }

  labelStatus(s: string): string {
    const map: Record<string, string> = {
      new: 'New', contacted: 'Contacted', qualified: 'Qualified',
      negotiating: 'Negotiating', won: 'Won', lost: 'Lost',
    };
    return map[s] ?? s;
  }

  labelSource(s: string): string {
    const map: Record<string, string> = {
      website: 'Website', referral: 'Referral', walk_in: 'Walk-in',
      social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call',
    };
    return map[s] ?? s;
  }

  goBack(): void { this.router.navigate(['/admin/leads']); }
}
