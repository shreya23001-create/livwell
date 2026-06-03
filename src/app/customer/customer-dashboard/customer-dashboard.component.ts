import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

interface SavedProperty {
  id: number;
  title: string;
  location: string;
  price: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  savedOn: string;
  status: 'available' | 'reserved' | 'sold';
}

interface Enquiry {
  id: number;
  property: string;
  agent: string;
  date: string;
  status: 'pending' | 'replied' | 'closed';
  message: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss',
})
export class CustomerDashboardComponent {
  today = new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  showWelcome = signal(false);

  savedProperties = signal<SavedProperty[]>([
    { id: 1, title: 'Luxury 2BR in Downtown Dubai', location: 'Downtown Dubai', price: 'AED 2,800,000', type: 'Apartment', beds: 2, baths: 2, area: 1450, savedOn: '2 days ago', status: 'available' },
    { id: 2, title: 'Spacious Villa in Arabian Ranches', location: 'Arabian Ranches', price: 'AED 6,500,000', type: 'Villa', beds: 4, baths: 5, area: 4200, savedOn: '5 days ago', status: 'available' },
    { id: 3, title: 'Studio in JVC with Pool View', location: 'Jumeirah Village Circle', price: 'AED 650,000', type: 'Studio', beds: 0, baths: 1, area: 480, savedOn: '1 week ago', status: 'reserved' },
  ]);

  recentEnquiries = signal<Enquiry[]>([
    { id: 1, property: 'Luxury 2BR in Downtown Dubai', agent: 'Sarah Al-Mansouri', date: '2 days ago', status: 'replied', message: 'I am interested in scheduling a viewing this weekend.' },
    { id: 2, property: 'Studio in JVC with Pool View', agent: 'Ahmed Hassan', date: '5 days ago', status: 'pending', message: 'Can you share more details about the payment plan?' },
    { id: 3, property: 'Penthouse in Palm Jumeirah', agent: 'Priya Nair', date: '2 weeks ago', status: 'closed', message: 'Is the price negotiable for a cash buyer?' },
  ]);

  constructor(public auth: AuthService) {
    if (auth.newlyRegistered()) {
      this.showWelcome.set(true);
      auth.clearNewlyRegistered();
    }
  }

  dismissWelcome(): void { this.showWelcome.set(false); }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  firstName(): string {
    return this.auth.currentUser()?.name?.split(' ')[0] ?? 'there';
  }

  statusLabel(s: string): string {
    return { available: 'Available', reserved: 'Reserved', sold: 'Sold', pending: 'Pending', replied: 'Replied', closed: 'Closed' }[s] ?? s;
  }
}
