import { Component } from '@angular/core';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [NewsletterSectionComponent, FooterComponent],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  currentYear: number = new Date().getFullYear();
}
