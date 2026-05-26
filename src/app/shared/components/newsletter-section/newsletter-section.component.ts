import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-section.component.html',
  styleUrl: './newsletter-section.component.scss',
})
export class NewsletterSectionComponent {
  newsletterEmail = signal('');
  newsletterSubmitted = signal(false);

  subscribeNewsletter() {
    if (this.newsletterEmail()) {
      this.newsletterSubmitted.set(true);
    }
  }
}
