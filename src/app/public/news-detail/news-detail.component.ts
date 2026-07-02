import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import type { NewsArticle } from '../news/news.component';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.scss',
})
export class NewsDetailComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private route     = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  post     = signal<NewsArticle | null>(null);
  related  = signal<NewsArticle[]>([]);
  featured = signal<NewsArticle[]>([]);
  loading  = signal(true);
  notFound = signal(false);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const { data } = await this.sb.from('blogs').select('*').eq('slug', slug).eq('published', true).single();
    if (!data) { this.notFound.set(true); this.loading.set(false); return; }

    // Increment view count (fire-and-forget)
    const newViews = (data.views ?? 0) + 1;
    this.sb.from('blogs').update({ views: newViews }).eq('id', data.id).then(() => {});

    this.post.set({ ...data, views: newViews } as NewsArticle);
    this.loading.set(false);

    const [{ data: rel }, { data: feat }] = await Promise.all([
      this.sb.from('blogs').select('id,title,slug,category,image,published_at,read_time,author,excerpt,body,featured,published,views')
        .eq('published', true).eq('category', data.category).neq('id', data.id).limit(3),
      this.sb.from('blogs').select('id,title,slug,category,image,published_at,read_time,author,excerpt,body,featured,published,views')
        .eq('published', true).eq('featured', true).neq('id', data.id).limit(5),
    ]);
    this.related.set((rel ?? []) as NewsArticle[]);
    this.featured.set((feat ?? []) as NewsArticle[]);
  }

  get safeBody(): SafeHtml {
    const body = this.post()?.body ?? '';
    // If body has HTML tags, render as HTML; otherwise render as paragraphs
    if (body.includes('<')) {
      return this.sanitizer.bypassSecurityTrustHtml(body);
    }
    const html = body.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  authorInitial(name: string): string {
    return (name ?? 'A').charAt(0).toUpperCase();
  }
}
