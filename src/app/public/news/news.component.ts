import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface NewsArticle {
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
  views: number;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent implements OnInit {
  private sb = inject(SupabaseService).client;

  readonly perPage = 10;

  posts          = signal<NewsArticle[]>([]);
  loading        = signal(true);
  activeCategory = signal('All');
  selectedAuthor = signal('All');
  search         = signal('');
  currentPage    = signal(1);

  authorDropOpen = signal(false);
  authorSearch   = signal('');

  authors = computed(() => {
    const names = [...new Set(this.posts().map(p => p.author).filter(Boolean))].sort();
    return ['All', ...names];
  });

  filteredAuthors = computed(() => {
    const q = this.authorSearch().toLowerCase();
    return this.authors().filter(a => a.toLowerCase().includes(q));
  });

  categories = computed(() => {
    const cats = [...new Set(this.posts().map(p => p.category).filter(Boolean))].sort();
    return ['All', ...cats];
  });

  categoryCounts = computed(() => {
    const map: Record<string, number> = { All: this.posts().length };
    for (const p of this.posts()) {
      map[p.category] = (map[p.category] ?? 0) + 1;
    }
    return map;
  });

  filteredPosts = computed(() => {
    let list = this.posts();
    const cat    = this.activeCategory();
    const author = this.selectedAuthor();
    const q      = this.search().toLowerCase().trim();
    if (cat !== 'All')    list = list.filter(p => p.category === cat);
    if (author !== 'All') list = list.filter(p => p.author === author);
    if (q) list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.excerpt ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  totalPages = computed(() => Math.ceil(this.filteredPosts().length / this.perPage));

  pagedPosts = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.filteredPosts().slice(start, start + this.perPage);
  });

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  featuredPosts = computed(() => this.posts().filter(p => p.featured).slice(0, 5));

  async ngOnInit(): Promise<void> {
    const { data } = await this.sb.from('blogs').select('*').eq('published', true).order('published_at', { ascending: false });
    this.posts.set((data ?? []) as NewsArticle[]);
    this.loading.set(false);
  }

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
    this.currentPage.set(1);
  }

  selectAuthor(author: string): void {
    this.selectedAuthor.set(author);
    this.authorDropOpen.set(false);
    this.authorSearch.set('');
    this.currentPage.set(1);
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSearchInput(val: string): void {
    this.search.set(val);
    this.currentPage.set(1);
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  authorInitial(name: string): string {
    return (name ?? 'A').charAt(0).toUpperCase();
  }

  formatViews(n: number): string {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.news-author-drop-wrap')) {
      this.authorDropOpen.set(false);
    }
  }
}
