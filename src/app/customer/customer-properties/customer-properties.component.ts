import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface SavedProperty {
  savedRowId: number;
  id: number;
  title: string;
  location: string;
  price: string;
  priceNum: number;
  type: string;
  category: 'sale' | 'rent';
  beds: number;
  baths: number;
  area: number;
  savedOn: string;
  status: string;
  agent: string;
  image: string;
}

interface InterestedProject {
  id: number;
  title: string;
  developer: string;
  location: string;
  priceLabel: string;
  type: string;
  badge: string;
  status: string;
  image: string;
  enquiredOn: string;
}

@Component({
  selector: 'app-customer-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-properties.component.html',
  styleUrl: './customer-properties.component.scss',
})
export class CustomerPropertiesComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  search             = signal('');
  filterStatus       = signal('all');
  filterType         = signal('all');
  loading            = signal(true);
  activeTab          = signal<'properties' | 'projects'>('properties');

  properties         = signal<SavedProperty[]>([]);
  interestedProjects = signal<InterestedProject[]>([]);

  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const st = this.filterStatus();
    const tp = this.filterType();
    return this.properties().filter(p => {
      const matchQ  = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
      const matchSt = st === 'all' || p.status === st;
      const matchTp = tp === 'all' || p.category === tp;
      return matchQ && matchSt && matchTp;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    // Step 1: get saved rows
    const { data: saved, error: savedErr } = await this.sb
      .from('saved_properties')
      .select('id, created_at, property_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (savedErr) { console.error('[SavedProps]', savedErr.message); this.loading.set(false); return; }

    const userEmail = this.auth.currentUser()?.email ?? '';
    await Promise.all([
      this.loadProperties(userId, saved ?? []),
      this.loadInterestedProjects(userEmail),
    ]);
    this.loading.set(false);
  }

  private async loadProperties(userId: string, saved: any[]): Promise<void> {
    if (!saved || saved.length === 0) return;

    const propIds = saved.map((r: any) => r.property_id);
    const { data: props, error: propsErr } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, bedrooms, bathrooms, area_sqft, type, listing_type, status, images, agent_name')
      .in('id', propIds);

    if (propsErr) { console.error('[SavedProps properties]', propsErr.message); return; }

    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));
    this.properties.set(saved
      .map((r: any) => {
        const p = propMap.get(r.property_id);
        if (!p) return null;
        const rawStatus = (p.status || '').toLowerCase();
        const status = rawStatus === 'sold' ? 'sold'
          : rawStatus === 'reserved' ? 'reserved'
          : 'available';
        return {
          savedRowId: r.id,
          id:         p.id,
          title:      p.title    || '',
          location:   [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
          price:      `AED ${Number(p.price || 0).toLocaleString()}`,
          priceNum:   p.price    || 0,
          type:       p.type     || '',
          category:   (p.listing_type === 'Rent' ? 'rent' : 'sale') as 'sale' | 'rent',
          beds:       p.bedrooms  || 0,
          baths:      p.bathrooms || 0,
          area:       p.area_sqft || 0,
          savedOn:    new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
          status,
          agent:      p.agent_name || 'Livwell Agent',
          image:      (p.images && p.images[0]) || '',
        };
      })
      .filter(Boolean) as SavedProperty[]);
  }

  private async loadInterestedProjects(email: string): Promise<void> {
    if (!email) return;
    const { data: leads } = await this.sb
      .from('admin_leads')
      .select('id, project_id, created_at')
      .eq('email', email)
      .not('project_id', 'is', null)
      .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) return;

    const projectIds = [...new Set(leads.map((r: any) => r.project_id))];
    const { data: projects } = await this.sb
      .from('projects')
      .select('id, title, developer, location, type, price_from, price_label, status, badge, images')
      .in('id', projectIds);

    const projectMap = new Map((projects ?? []).map((p: any) => [p.id, p]));
    const seen = new Set<number>();
    this.interestedProjects.set(leads
      .filter((r: any) => {
        if (seen.has(r.project_id)) return false;
        seen.add(r.project_id);
        return projectMap.has(r.project_id);
      })
      .map((r: any) => {
        const p = projectMap.get(r.project_id);
        return {
          id:          p.id,
          title:       p.title       || '',
          developer:   p.developer   || '',
          location:    p.location    || 'Dubai',
          priceLabel:  p.price_label || (p.price_from ? `AED ${Number(p.price_from).toLocaleString()}` : 'Price on request'),
          type:        p.type        || 'Residential',
          badge:       p.badge       || 'Off-Plan',
          status:      p.status      || 'Off-Plan',
          image:       (p.images && p.images[0]) || '',
          enquiredOn:  new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      }) as InterestedProject[]);
  }

  async removeProperty(savedRowId: number): Promise<void> {
    await this.sb.from('saved_properties').delete().eq('id', savedRowId);
    this.properties.update(list => list.filter(p => p.savedRowId !== savedRowId));
  }

  statusLabel(s: string): string {
    return { available: 'Available', reserved: 'Reserved', sold: 'Sold', Published: 'Available', Draft: 'Draft' }[s] ?? s;
  }
}
