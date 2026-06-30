import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import type { BlogPost } from '../blog-list/blog-list.component';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent, NewsletterSectionComponent],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);

  post    = signal<BlogPost | null>(null);
  related = signal<BlogPost[]>([]);
  loading = signal(true);
  notFound = signal(false);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const { data } = await this.sb.from('blogs').select('*').eq('slug', slug).eq('published', true).single();
    if (!data) { this.notFound.set(true); this.loading.set(false); return; }
    this.post.set(data as BlogPost);
    this.loading.set(false);

    // load related (same category, exclude current)
    const { data: rel } = await this.sb.from('blogs').select('id,title,slug,category,image,published_at,read_time,author,excerpt,body,featured,published')
      .eq('published', true).eq('category', data.category).neq('id', data.id).limit(3);
    this.related.set((rel ?? []) as BlogPost[]);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get paragraphs(): string[] {
    return (this.post()?.body ?? '').split('\n').filter(l => l.trim().length > 0);
  }
}
