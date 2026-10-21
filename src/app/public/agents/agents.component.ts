import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { SupabaseService } from '../../shared/services/supabase.service';

interface PublicAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  bio: string;
  avatar_url: string | null;
}

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent implements OnInit {
  private sb       = inject(SupabaseService).client;
  private titleSvc = inject(Title);
  private metaSvc  = inject(Meta);

  agents  = signal<PublicAgent[]>([]);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    this.titleSvc.setTitle('Our Business Associates | Livwell');
    this.metaSvc.updateTag({ name: 'description', content: 'Meet Livwell\'s team of RERA-registered Dubai real estate agents. Expert advice for buyers, sellers and investors.' });
    const { data } = await this.sb
      .from('profiles')
      .select('id, name, email, phone, avatar_url, bio, designation')
      .eq('role', 'agent')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (data) {
      this.agents.set(data.map((r: any) => ({
        id:          r.id,
        name:        r.name        ?? 'Agent',
        email:       r.email       ?? '',
        phone:       r.phone       ?? '',
        designation: r.designation ?? 'Real Estate Agent',
        bio:         r.bio         ?? '',
        avatar_url:  (r.avatar_url && !r.avatar_url.startsWith('data:') && /\/avatars\/[^/]+/.test(r.avatar_url)) ? r.avatar_url : null,
      })));
    }
    this.loading.set(false);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AG';
  }

  waLink(phone: string): string {
    return 'https://wa.me/' + phone.replace(/[^0-9]/g, '');
  }
}
