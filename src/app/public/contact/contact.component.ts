import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
}

interface Office {
  name: string;
  address: string;
  phone: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  enquiryTypes = ['Buy Property', 'Rent Property', 'Sell Property', 'Investment', 'General Enquiry'];
  activeType = signal('Buy Property');
  submitted = signal(false);

  form = signal<ContactForm>({
    firstName: '', lastName: '', email: '', phone: '',
    subject: '', message: '', consent: false,
  });

  patch(field: keyof ContactForm, value: string | boolean): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  submit(): void {
    const f = this.form();
    if (f.firstName && f.email && f.subject && f.message && f.consent) {
      this.submitted.set(true);
    }
  }

  reset(): void {
    this.submitted.set(false);
    this.form.set({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', consent: false });
  }

  offices: Office[] = [
    { name: 'Bay Square', address: 'Office 801, Building 01, Bay Square, Business Bay', phone: '+971 4 123 4567' },
    { name: 'Dubai Marina', address: '1401 Marina Plaza, Dubai Marina', phone: '+971 4 123 4568' },
    { name: 'Downtown Dubai', address: 'City Walk Boulevard, Shop 8-02, Downtown Dubai', phone: '+971 4 123 4569' },
    { name: 'Palm Jumeirah', address: 'Golden Mile 9, Shop 10 Galleria, Palm Jumeirah', phone: '+971 4 123 4570' },
    { name: 'Dubai Hills', address: 'Park Heights Square, Building 2, Level 6', phone: '+971 4 123 4571' },
    { name: 'Jumeirah Park', address: 'Shop G10, East Pavilion, Jumeirah Park', phone: '+971 4 123 4572' },
    { name: 'Meydan', address: 'Meydan Heights Retail Centre, Unit G10', phone: '+971 4 123 4573' },
    { name: 'Creek Harbour', address: 'GRF-02, Tower 3, North Podium, Creek Harbour', phone: '+971 4 123 4574' },
    { name: 'Motor City', address: 'Control Tower, Unit 2803, Motor City', phone: '+971 4 123 4575' },
    { name: 'Al Furjan', address: 'FRJP R-27B Pavilion, Al Furjan South', phone: '+971 4 123 4576' },
    { name: 'Mudon', address: 'Shop No. 2 & 1, Al Salam, Mudon Community Centre', phone: '+971 4 123 4577' },
    { name: 'Villanova', address: 'Villanova, Wadi Al Safa, Emirates Road', phone: '+971 4 123 4578' },
  ];
}
