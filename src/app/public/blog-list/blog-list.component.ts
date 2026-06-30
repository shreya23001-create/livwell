import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  author: string;
  image: string;
  read_time: string;
  featured: boolean;
  published: boolean;
  published_at: string;
}

const CATEGORIES = ['All', 'Market Insights', 'Investment', 'Lifestyle', 'Regulations', 'Property Guide', 'Dubai Life'];

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FooterComponent, NewsletterSectionComponent],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private sb = inject(SupabaseService).client;

  posts      = signal<BlogPost[]>([]);
  loading    = signal(true);
  activecat  = signal('All');
  search     = signal('');

  readonly categories = CATEGORIES;

  featured = computed(() => this.posts().find(p => p.featured) ?? this.posts()[0]);

  filtered = computed(() => {
    let list = this.posts().filter(p => p.id !== this.featured()?.id);
    const cat = this.activecat();
    const q   = this.search().toLowerCase();
    if (cat !== 'All') list = list.filter(p => p.category === cat);
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    return list;
  });

  async ngOnInit(): Promise<void> {
    const { data } = await this.sb.from('blogs').select('*').eq('published', true).order('published_at', { ascending: false });
    this.posts.set((data ?? []) as BlogPost[]);
    this.loading.set(false);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
