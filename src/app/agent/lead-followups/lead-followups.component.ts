import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';

interface FollowUpRecord {
  id: number; date: string; time: string; remarks: string; status: string; by: string;
}

@Component({
  selector: 'app-lead-followups',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lead-followups.component.html',
  styleUrl: './lead-followups.component.scss',
})
export class LeadFollowupsComponent implements OnInit {
  private sb     = inject(SupabaseService).client;
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  leadId   = signal<number>(0);
  leadName = signal('');
  records  = signal<FollowUpRecord[]>([]);
  loading  = signal(true);

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/agent/leads']); return; }
    this.leadId.set(id);

    const [leadRes, fuRes] = await Promise.all([
      this.sb.from('admin_leads').select('name').eq('id', id).maybeSingle(),
      this.sb.from('lead_follow_ups').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
    ]);

    this.leadName.set(leadRes.data?.name || 'Lead');
    this.records.set((fuRes.data ?? []).map((r: any) => ({
      id:      r.id,
      date:    r.follow_up_date ? new Date(r.follow_up_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      time:    r.follow_up_time || '—',
      remarks: r.remarks || '—',
      status:  r.status || '',
      by:      r.created_by || '—',
    })));
    this.loading.set(false);
  }

  labelStatus(s: string): string {
    const map: Record<string, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' };
    return map[s] ?? s;
  }

  goBack(): void { this.router.navigate(['/agent/leads', this.leadId()]); }
}
