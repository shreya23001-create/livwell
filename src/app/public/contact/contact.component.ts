import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AdminDataService } from '../../shared/services/admin-data.service';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]+$/;
const PHONE_DIGITS = (p: string) => { const d = p.replace(/\D/g, '').length; return d >= 7 && d <= 15; };

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
  private dataSvc = inject(AdminDataService);

  // CMS-driven contact page content
  contactPage = computed(() => this.dataSvc.pages().find(p => p.id === 'contact-info'));
  heroTitle    = computed(() => this.contactPage()?.heading    || 'Get in Touch');
  heroSubtitle = computed(() => this.contactPage()?.subheading || 'Our team of experts is ready to help you find, buy, rent, or sell in Dubai.');

  enquiryTypes = ['Buy Property', 'Rent Property', 'Sell Property', 'Investment', 'General Enquiry'];
  activeType = signal('Buy Property');
  submitted = signal(false);
  formErrors = signal<Record<string, string>>({});

  form = signal<ContactForm>({
    firstName: '', lastName: '', email: '', phone: '',
    subject: '', message: '', consent: false,
  });

  patch(field: keyof ContactForm, value: string | boolean): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  submit(): void {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.firstName.trim())                        e['firstName'] = 'First name is required.';
    if (!f.email.trim())                            e['email']     = 'Email is required.';
    else if (!EMAIL_RE.test(f.email.trim()))        e['email']     = 'Enter a valid email address.';
    if (f.phone.trim() && (!PHONE_RE.test(f.phone.trim()) || !PHONE_DIGITS(f.phone))) e['phone'] = 'Enter a valid phone number (7–15 digits).';
    if (!f.subject.trim())                          e['subject']   = 'Subject is required.';
    if (!f.message.trim())                          e['message']   = 'Message is required.';
    else if (f.message.trim().length < 10)          e['message']   = 'Message must be at least 10 characters.';
    if (!f.consent)                                 e['consent']   = 'You must agree to the terms.';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;
    this.submitted.set(true);
  }

  reset(): void {
    this.submitted.set(false);
    this.formErrors.set({});
    this.form.set({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', consent: false });
  }

  offices: Office[] = [
    { name: 'Al Barsha (HQ)', address: 'Al-Barsha Business Centre, 3rd Floor, Office 311-B, Al Barsha, Dubai', phone: '+971 52 520 9703' },
    { name: 'Dubai Marina', address: '1401 Marina Plaza, Dubai Marina', phone: '+971 52 520 9703' },
    { name: 'Downtown Dubai', address: 'City Walk Boulevard, Shop 8-02, Downtown Dubai', phone: '+971 52 520 9703' },
    { name: 'Palm Jumeirah', address: 'Golden Mile 9, Shop 10 Galleria, Palm Jumeirah', phone: '+971 52 520 9703' },
    { name: 'Dubai Hills', address: 'Park Heights Square, Building 2, Level 6', phone: '+971 52 520 9703' },
    { name: 'Jumeirah Park', address: 'Shop G10, East Pavilion, Jumeirah Park', phone: '+971 52 520 9703' },
    { name: 'Meydan', address: 'Meydan Heights Retail Centre, Unit G10', phone: '+971 52 520 9703' },
    { name: 'Creek Harbour', address: 'GRF-02, Tower 3, North Podium, Creek Harbour', phone: '+971 52 520 9703' },
    { name: 'Motor City', address: 'Control Tower, Unit 2803, Motor City', phone: '+971 52 520 9703' },
    { name: 'Al Furjan', address: 'FRJP R-27B Pavilion, Al Furjan South', phone: '+971 52 520 9703' },
    { name: 'Mudon', address: 'Shop No. 2 & 1, Al Salam, Mudon Community Centre', phone: '+971 52 520 9703' },
    { name: 'Villanova', address: 'Villanova, Wadi Al Safa, Emirates Road', phone: '+971 52 520 9703' },
  ];
}
