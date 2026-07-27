import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-newsletter-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-section.component.html',
  styleUrl: './newsletter-section.component.scss',
})
export class NewsletterSectionComponent {
  private sb = inject(SupabaseService).client;

  newsletterEmail     = signal('');
  newsletterSubmitted = signal(false);
  newsletterError     = signal('');
  subscribing         = signal(false);

  async subscribeNewsletter(): Promise<void> {
    const email = this.newsletterEmail().trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.newsletterError.set('Please enter a valid email address.');
      return;
    }
    this.subscribing.set(true);
    this.newsletterError.set('');

    // Upsert — if already exists keep subscribed, if unsubscribed re-subscribe
    const { error } = await this.sb.from('newsletter_subscribers').upsert(
      { email, status: 'subscribed' },
      { onConflict: 'email' }
    );

    this.subscribing.set(false);
    if (error) {
      this.newsletterError.set('Something went wrong. Please try again.');
      return;
    }
    this.newsletterSubmitted.set(true);
  }
}
