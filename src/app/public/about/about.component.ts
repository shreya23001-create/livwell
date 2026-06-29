import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { AdminDataService } from '../../shared/services/admin-data.service';

interface Stat { value: string; label: string; }
interface CoreValue { title: string; body: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent, NewsletterSectionComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  private dataSvc = inject(AdminDataService);

  aboutPage = computed(() => this.dataSvc.pages().find(p => p.id === 'about-hero'));
  heroTitle = computed(() => this.aboutPage()?.heading || 'About Livwell');
  heroSubtitle = computed(() => this.aboutPage()?.subheading || "Dubai's most trusted real estate partner — connecting people with exceptional properties since 2008.");
  stats: Stat[] = [
    { value: '20+', label: 'Expert Agents' },
    { value: '17 Years', label: 'of Excellence' },
    { value: '25', label: 'Offices Across Dubai' },
    { value: '18,000+', label: 'Clients & Investors' },
  ];

  coreValues: CoreValue[] = [
    { title: 'Integrity', body: 'We uphold the highest ethical standards, ensuring transparency and honesty in all our dealings.' },
    { title: 'Innovation', body: 'We continuously seek creative solutions and leverage cutting-edge technology to deliver better outcomes for our clients.' },
    { title: 'Excellence', body: 'We are committed to delivering the highest quality service at every stage of your real estate journey.' },
    { title: 'Respect', body: 'We value and respect our clients, teammates, and partners, fostering a culture of trust and mutual respect.' },
    { title: 'Authenticity', body: 'We foster authentic relationships built on trust and collaboration, putting your interests at the heart of every recommendation.' },
    { title: 'Collaboration', body: 'Collaboration is at the core of what we do — internally across departments, and externally with all valued partners.' },
    { title: 'Social Responsibility', body: 'We are committed to sustainable practices for the communities we serve, operating with purpose beyond profit.' },
    { title: 'Kindness', body: 'We inspire a positive and caring working environment, and simply enjoy doing business with a smile — every interaction matters.' },
  ];

  promises: string[] = [
    'We will always provide you with the most sound and user-friendly technology, ensuring seamless client interactions at all times.',
    'We will always ensure you have the support of an experienced and dedicated team to assist and guide your efforts at every step.',
    'We will always be transparent and ensure that you are never faced with information asymmetry between you and your competitors.',
    'We will always look for new and better ways to work, grow, and deliver — and share in our collective success together.',
    'We will never instruct you to compromise your ethics or mislead a client in any way, shape, or form.',
    'We will never make you share your company contacts, your clients, just take the lead.',
  ];
}
