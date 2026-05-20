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

  properties = signal<SavedProperty[]>([
    { id: 1, title: 'Luxury 2BR in Downtown Dubai', location: 'Downtown Dubai', price: 'AED 2,800,000', priceNum: 2800000, type: 'Apartment', category: 'sale', beds: 2, baths: 2, area: 1450, savedOn: '2 days ago', status: 'available', agent: 'Sarah Al-Mansouri' },
    { id: 2, title: 'Spacious Villa in Arabian Ranches', location: 'Arabian Ranches', price: 'AED 6,500,000', priceNum: 6500000, type: 'Villa', category: 'sale', beds: 4, baths: 5, area: 4200, savedOn: '5 days ago', status: 'available', agent: 'Ahmed Hassan' },
    { id: 3, title: 'Studio in JVC with Pool View', location: 'Jumeirah Village Circle', price: 'AED 650,000', priceNum: 650000, type: 'Studio', category: 'sale', beds: 0, baths: 1, area: 480, savedOn: '1 week ago', status: 'reserved', agent: 'Priya Nair' },
    { id: 4, title: 'Modern 1BR in Business Bay', location: 'Business Bay', price: 'AED 7,500 / mo', priceNum: 7500, type: 'Apartment', category: 'rent', beds: 1, baths: 1, area: 780, savedOn: '1 week ago', status: 'available', agent: 'Omar Khalid' },
    { id: 5, title: 'Penthouse in Palm Jumeirah', location: 'Palm Jumeirah', price: 'AED 18,000,000', priceNum: 18000000, type: 'Penthouse', category: 'sale', beds: 5, baths: 6, area: 8500, savedOn: '2 weeks ago', status: 'available', agent: 'Sarah Al-Mansouri' },
    { id: 6, title: 'Townhouse in Dubai Hills', location: 'Dubai Hills Estate', price: 'AED 3,200,000', priceNum: 3200000, type: 'Townhouse', category: 'sale', beds: 3, baths: 3, area: 2200, savedOn: '3 weeks ago', status: 'sold', agent: 'Ahmed Hassan' },
  ]);

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
