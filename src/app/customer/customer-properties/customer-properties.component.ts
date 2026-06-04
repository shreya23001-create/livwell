import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface SavedProperty {
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
  status: 'available' | 'reserved' | 'sold';
  agent: string;
}

@Component({
  selector: 'app-customer-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-properties.component.html',
  styleUrl: './customer-properties.component.scss',
})
export class CustomerPropertiesComponent {
  search       = signal('');
  filterStatus = signal('all');
  filterType   = signal('all');

  properties = signal<SavedProperty[]>([]);

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const st  = this.filterStatus();
    const tp  = this.filterType();
    return this.properties().filter(p => {
      const matchQ  = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
      const matchSt = st === 'all' || p.status === st;
      const matchTp = tp === 'all' || p.category === tp;
      return matchQ && matchSt && matchTp;
    });
  });

  removeProperty(id: number): void {
    this.properties.update(list => list.filter(p => p.id !== id));
  }

  statusLabel(s: string): string {
    return { available: 'Available', reserved: 'Reserved', sold: 'Sold' }[s] ?? s;
  }
}
