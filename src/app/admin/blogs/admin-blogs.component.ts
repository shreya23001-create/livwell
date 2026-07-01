import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';

export interface BlogPost {
  id?: number;
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
  published_at?: string;
  created_at?: string;
}

const BLANK_POST = (): Omit<BlogPost, 'id' | 'created_at'> => ({
  title: '', slug: '', category: '', excerpt: '', body: '',
  author: '', image: '', read_time: '3 min read',
  featured: false, published: false,
});

const CATEGORIES = ['Market Insights', 'Investment', 'Lifestyle', 'Regulations', 'Property Guide', 'Dubai Life'];

@Component({
  selector: 'app-admin-blogs',
  standalone: true,
  imports: [CommonModule, FormsModule, RichEditorComponent],
  templateUrl: './admin-blogs.component.html',
  styleUrl: './admin-blogs.component.scss',
})
export class AdminBlogsComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private auth  = inject(AuthService);
  private toast = inject(ToastService);

  posts       = signal<BlogPost[]>([]);
  loading     = signal(true);
  saving      = signal(false);
  search      = signal('');
  filterCat   = signal('');
  filterPub   = signal('');

  showModal   = signal(false);
  editingId   = signal<number | null>(null);
  deleteId    = signal<number | null>(null);
  form        = signal<Omit<BlogPost, 'id' | 'created_at'>>(BLANK_POST());
  formErrors  = signal<Record<string, string>>({});

  imgDragging  = signal(false);
  imgUploading = signal(false);

  readonly categories = CATEGORIES;

  filtered = computed(() => {
    let list = this.posts();
    const q = this.search().toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    if (this.filterCat()) list = list.filter(p => p.category === this.filterCat());
    if (this.filterPub() === 'published')   list = list.filter(p => p.published);
    if (this.filterPub() === 'draft')       list = list.filter(p => !p.published);
    if (this.filterPub() === 'featured')    list = list.filter(p => p.featured);
    return list;
  });

  stats = computed(() => ({
    total:     this.posts().length,
    published: this.posts().filter(p => p.published).length,
    drafts:    this.posts().filter(p => !p.published).length,
    featured:  this.posts().filter(p => p.featured).length,
  }));

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    await this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.sb.from('blogs').select('*').order('created_at', { ascending: false });
    if (error) { this.toast.error(error.message); this.loading.set(false); return; }
    if (data && data.length > 0) {
      this.posts.set(data as BlogPost[]);
    } else {
      await this.seedBlogs();
    }
    this.loading.set(false);
  }

  private async seedBlogs(): Promise<void> {
    const seeds = [
      {
        title: 'Dubai Real Estate Market Hits Record AED 141 Billion in 2025 Transactions',
        slug: 'dubai-real-estate-record-2025',
        category: 'Market Insights',
        excerpt: 'The UAE property market continues its remarkable growth trajectory, with off-plan sales driving unprecedented demand across premium communities.',
        body: `Dubai's real estate market has shattered all previous records, registering over AED 141 billion in transactions during 2025. The surge has been driven primarily by off-plan sales, which now account for more than 60% of all deals.\n\nKey communities leading the charge include Dubai Creek Harbour, Downtown Dubai, and Palm Jumeirah, where demand from both end-users and investors remains exceptionally strong.\n\nInternational buyers from Europe, Asia, and the GCC continue to pour capital into Dubai, drawn by the emirate's tax-free environment, world-class infrastructure, and long-term residency pathways through the Golden Visa programme.\n\nAnalysts project continued growth into 2026, with handover volumes expected to peak and secondary market activity intensifying as early investors cash out on significant capital gains.`,
        author: 'Sarah Al-Mansouri',
        image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
        read_time: '5 min read',
        featured: true,
        published: true,
        published_at: new Date('2026-05-14').toISOString(),
      },
      {
        title: 'Top 5 Communities for ROI in Dubai: Where Smart Money Is Flowing',
        slug: 'top-5-communities-roi-dubai-2026',
        category: 'Investment',
        excerpt: 'From Business Bay to Jumeirah Village Circle, we break down which communities are delivering the strongest rental yields for investors in 2026.',
        body: `Investors seeking strong rental returns in Dubai need look no further than these five communities consistently outperforming the market in 2026.\n\n**1. Jumeirah Village Circle (JVC)**\nAverage gross yield: 8.2%. Affordable entry price combined with strong tenant demand makes JVC a perennial favourite for buy-to-let investors.\n\n**2. Business Bay**\nAverage gross yield: 7.6%. Proximity to Downtown and the DIFC drives sustained corporate rental demand, particularly for one and two-bedroom apartments.\n\n**3. Dubai Marina**\nAverage gross yield: 6.8%. The lifestyle appeal of marina living keeps vacancy rates low and short-term rental premiums high.\n\n**4. Dubai Creek Harbour**\nAverage gross yield: 7.1%. A newer community with significant infrastructure investment and Emaar's long-term masterplan backing.\n\n**5. Arjan / Dubailand**\nAverage gross yield: 8.5%. Emerging communities with lower price-per-sqft and growing amenities are generating the highest yields in the city.\n\nDiversifying across two or three of these communities offers a balanced risk-return profile for both new and seasoned investors.`,
        author: 'Ahmed Hassan',
        image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
        read_time: '4 min read',
        featured: false,
        published: true,
        published_at: new Date('2026-05-12').toISOString(),
      },
      {
        title: 'Palm Jumeirah Residences: A Complete Living Guide for New Homeowners',
        slug: 'palm-jumeirah-living-guide',
        category: 'Lifestyle',
        excerpt: "Everything you need to know about settling into one of the world's most iconic addresses — from amenities to community life.",
        body: `Congratulations on your Palm Jumeirah purchase. As one of Dubai's most iconic addresses, life on the Palm offers a truly unique blend of beachfront serenity and urban convenience.\n\n**Getting Around**\nThe Palm Monorail connects the trunk to Atlantis at the tip, while water taxis provide a scenic alternative. Most residents rely on private vehicles or ride-hailing apps for daily commutes.\n\n**Dining & Entertainment**\nFrom Nobu and Nammos to Ossiano and La Mer, the Palm is home to over 100 restaurants and beach clubs. The Pointe and Nakheel Mall offer extensive retail and dining options on your doorstep.\n\n**Schools & Healthcare**\nBritish curriculum schools including GEMS Wellington and Nord Anglia are within a 10-minute drive. King's College Hospital and Mediclinic Palm Jumeirah serve the community's healthcare needs.\n\n**Community Management**\nNakheel manages the common areas and infrastructure. Register with the Nakheel Community Management portal for maintenance requests and community updates.\n\n**Tips for New Residents**\nRegister with DEWA early to avoid delays in utility activation. Factor in Salik toll costs when calculating daily commute expenses, as two toll gates serve the Palm.`,
        author: 'Priya Sharma',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        read_time: '6 min read',
        featured: false,
        published: true,
        published_at: new Date('2026-05-10').toISOString(),
      },
      {
        title: 'New UAE Golden Visa Rules: How Property Ownership Qualifies You',
        slug: 'uae-golden-visa-property-rules-2026',
        category: 'Regulations',
        excerpt: 'Updated guidelines make it easier than ever for property investors to secure long-term residency through real estate investments above AED 2 million.',
        body: `The UAE Golden Visa programme continues to evolve, with updated regulations in 2026 broadening eligibility for real estate investors and simplifying the application process.\n\n**Who Qualifies?**\nProperty owners holding real estate valued at AED 2 million or above are eligible to apply. The property can be mortgaged, provided equity held equals or exceeds AED 2 million. Off-plan properties from approved developers also qualify upon reaching the AED 2 million threshold.\n\n**Key Benefits**\nA 10-year renewable residency visa with no requirement for a UAE national sponsor. Family members including spouse and children can be sponsored under the same visa. Domestic workers can also be sponsored.\n\n**Application Process**\n1. Obtain a property valuation certificate from a RERA-approved valuator.\n2. Submit application via the ICA Smart Services portal or authorised typing centres.\n3. Medical fitness test and Emirates ID enrolment.\n4. Visa stamping — typically completed within 5 working days.\n\n**Important Notes**\nThe Golden Visa does not replace a trade licence if you wish to conduct business in the UAE. Consult a UAE-registered legal advisor to ensure your specific circumstances meet current eligibility criteria.`,
        author: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
        read_time: '3 min read',
        featured: false,
        published: true,
        published_at: new Date('2026-05-08').toISOString(),
      },
    ];

    const { data } = await this.sb.from('blogs').insert(seeds).select();
    if (data) this.posts.set(data as BlogPost[]);
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.set({ ...BLANK_POST(), author: this.auth.currentUser()?.name ?? '' });
    this.formErrors.set({});
    this.imgDragging.set(false);
    this.showModal.set(true);
  }

  openEdit(p: BlogPost): void {
    this.editingId.set(p.id!);
    this.form.set({ title: p.title, slug: p.slug, category: p.category, excerpt: p.excerpt, body: p.body, author: p.author, image: p.image, read_time: p.read_time, featured: p.featured, published: p.published });
    this.formErrors.set({});
    this.imgDragging.set(false);
    this.showModal.set(true);
  }

  onImgDragOver(e: DragEvent): void { e.preventDefault(); this.imgDragging.set(true); }
  onImgDragLeave(): void            { this.imgDragging.set(false); }
  onImgDrop(e: DragEvent): void {
    e.preventDefault();
    this.imgDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.uploadImage(file);
  }
  onImgFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadImage(file);
  }

  private async uploadImage(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) { this.toast.error('Please select an image file.'); return; }
    this.imgUploading.set(true);
    const ext  = file.name.split('.').pop();
    const path = `blogs/${Date.now()}.${ext}`;
    const { error } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (error) { this.toast.error('Upload failed: ' + error.message); this.imgUploading.set(false); return; }
    const { data } = this.sb.storage.from('imagesFolder').getPublicUrl(path);
    this.form.update(f => ({ ...f, image: data.publicUrl }));
    this.imgUploading.set(false);
  }

  removeImage(): void { this.form.update(f => ({ ...f, image: '' })); }

  generateSlug(): void {
    const slug = this.form().title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    this.form.update(f => ({ ...f, slug }));
  }

  async save(): Promise<void> {
    const f = this.form();
    const errs: Record<string, string> = {};
    if (!f.title.trim())   errs['title']   = 'Title is required.';
    if (!f.slug.trim())    errs['slug']     = 'Slug is required.';
    if (!f.category)       errs['category'] = 'Category is required.';
    if (!f.excerpt.trim()) errs['excerpt']  = 'Excerpt is required.';
    if (!f.body.trim())    errs['body']     = 'Body content is required.';
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    const payload: any = { ...f, published_at: f.published ? new Date().toISOString() : null };
    const id = this.editingId();
    const { error } = id
      ? await this.sb.from('blogs').update(payload).eq('id', id)
      : await this.sb.from('blogs').insert(payload);
    this.saving.set(false);
    if (error) { this.toast.error(error.message); return; }
    this.toast.success(id ? 'Post updated.' : 'Post created.');
    this.showModal.set(false);
    await this.loadPosts();
  }

  async togglePublished(p: BlogPost): Promise<void> {
    const published = !p.published;
    await this.sb.from('blogs').update({ published, published_at: published ? new Date().toISOString() : null }).eq('id', p.id!);
    await this.loadPosts();
    this.toast.success(published ? 'Post published.' : 'Post unpublished.');
  }

  async toggleFeatured(p: BlogPost): Promise<void> {
    await this.sb.from('blogs').update({ featured: !p.featured }).eq('id', p.id!);
    await this.loadPosts();
  }

  async doDelete(): Promise<void> {
    const id = this.deleteId();
    if (!id) return;
    await this.sb.from('blogs').delete().eq('id', id);
    this.deleteId.set(null);
    this.toast.success('Post deleted.');
    await this.loadPosts();
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
