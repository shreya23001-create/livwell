import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';

interface Project {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: string;
  status: string;
  price_from: number;
  price_label: string;
  beds: string;
  completion_date: string;
  payment_plan: string;
  images: string[];
  badge: string;
  is_featured: boolean;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
  agent_name: string;
  created_at: string;
}

@Component({
  selector: 'app-agent-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agent-projects.component.html',
  styleUrl: './agent-projects.component.scss',
})
export class AgentProjectsComponent implements OnInit {
  private sb   = inject(SupabaseService).client;
  private auth = inject(AuthService);

  projects     = signal<Project[]>([]);
  loading      = signal(true);
  search       = signal('');
  filterStatus = signal('');

  filtered = computed(() => {
    let list = this.projects();
    const q  = this.search().toLowerCase().trim();
    if (q)  list = list.filter(p => p.title.toLowerCase().includes(q) || (p.developer ?? '').toLowerCase().includes(q));
    if (this.filterStatus()) list = list.filter(p => p.status === this.filterStatus());
    return list;
  });

  stats = computed(() => ({
    total:     this.projects().length,
    published: this.projects().filter(p => p.status === 'Published').length,
    luxury:    this.projects().filter(p => p.is_luxury || p.is_ultra_luxury).length,
  }));

  async ngOnInit() {
    const agentName = this.auth.currentUser()?.name;
    if (!agentName) { this.loading.set(false); return; }

    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('agent_name', agentName)
      .order('created_at', { ascending: false });

    this.projects.set((data as Project[]) ?? []);
    this.loading.set(false);
  }

  formatPrice(n: number) {
    if (!n) return '—';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  statusClass(s: string) {
    return { 'Published': 'badge--green', 'Draft': 'badge--grey', 'Archived': 'badge--red' }[s] ?? '';
  }
}
