import { Component } from '@angular/core';
import { SeoLinksSectionComponent } from '../seo-links-section/seo-links-section.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [SeoLinksSectionComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
