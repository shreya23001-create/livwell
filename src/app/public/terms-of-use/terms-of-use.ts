import { Component } from '@angular/core';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [NewsletterSectionComponent, FooterComponent],
  templateUrl: './terms-of-use.html',
  styleUrl: './terms-of-use.scss',
})
export class TermsOfUse {
  currentYear: number = new Date().getFullYear();
}
