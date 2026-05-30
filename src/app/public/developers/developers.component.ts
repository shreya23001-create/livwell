import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Developer {
  slug: string;
  name: string;
  logo: string;
  established: number;
  projects: number;
  deliveredProjects: number;
  about: string;
  nationality: string;
  featured?: boolean;
}

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './developers.component.html',
  styleUrl: './developers.component.scss',
})
export class DevelopersComponent {
  searchQuery = signal('');
  activeFilter = signal('All');

  readonly filters = ['All', 'Featured', 'UAE', 'International'];

  readonly developers: Developer[] = [
    { slug: 'emaar', name: 'Emaar Properties', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Emaar_Properties_logo.svg/320px-Emaar_Properties_logo.svg.png', established: 1997, projects: 87, deliveredProjects: 62, about: 'Creator of the Burj Khalifa, Dubai Mall, and Downtown Dubai. One of the largest real estate developers in the world.', nationality: 'UAE', featured: true },
    { slug: 'damac', name: 'DAMAC Properties', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/DAMAC_Logo.svg/320px-DAMAC_Logo.svg.png', established: 2002, projects: 65, deliveredProjects: 48, about: 'Luxury real estate developer known for DAMAC Hills, Cavalli Tower, and branded residences across Dubai.', nationality: 'UAE', featured: true },
    { slug: 'nakheel', name: 'Nakheel', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Nakheel_Logo.svg/320px-Nakheel_Logo.svg.png', established: 2000, projects: 54, deliveredProjects: 41, about: "Creator of Palm Jumeirah, Palm Jebel Ali, and The World Islands — Dubai's iconic island developments.", nationality: 'UAE', featured: true },
    { slug: 'meraas', name: 'Meraas', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Meraas_logo.svg/320px-Meraas_logo.svg.png', established: 2007, projects: 38, deliveredProjects: 29, about: 'Developer of Bluewaters Island, City Walk, Port de La Mer, and La Mer — lifestyle-led destinations.', nationality: 'UAE', featured: true },
    { slug: 'meydan', name: 'Meydan', logo: 'https://upload.wikimedia.org/wikipedia/en/7/74/Meydan_Group_logo.png', established: 2007, projects: 24, deliveredProjects: 16, about: 'Developer of District One, Meydan Avenue, and Grandeur Residences in Mohammed Bin Rashid City.', nationality: 'UAE', featured: true },
    { slug: 'sobha', name: 'Sobha Realty', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Sobha_Realty_Logo.svg/320px-Sobha_Realty_Logo.svg.png', established: 1976, projects: 32, deliveredProjects: 22, about: 'Premium quality developer known for Sobha Hartland, Sobha One, and Creek Vistas — built with in-house expertise.', nationality: 'UAE', featured: true },
    { slug: 'aldar', name: 'Aldar Properties', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Aldar_Properties_logo.svg/320px-Aldar_Properties_logo.svg.png', established: 2004, projects: 45, deliveredProjects: 34, about: "Abu Dhabi's leading developer expanding rapidly into Dubai with premium residential and commercial projects.", nationality: 'UAE', featured: true },
    { slug: 'omniyat', name: 'OMNIYAT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Omniyat_logo.svg/320px-Omniyat_logo.svg.png', established: 2005, projects: 14, deliveredProjects: 9, about: 'Ultra-luxury developer behind The Dorchester Collection Dubai, Dorchester Residences, and AETERNA by Omniyat.', nationality: 'UAE', featured: true },
    { slug: 'select-group', name: 'Select Group', logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&q=80', established: 2002, projects: 28, deliveredProjects: 21, about: 'Developer of Six Senses Residences Palm Jumeirah, Marina Gate, and The Sterling in Business Bay.', nationality: 'UAE' },
    { slug: 'majid-al-futtaim', name: 'Majid Al Futtaim', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/28/Majid_Al_Futtaim_Logo.svg/320px-Majid_Al_Futtaim_Logo.svg.png', established: 1992, projects: 19, deliveredProjects: 14, about: 'Creator of Tilal Al Ghaf, Mall of the Emirates, and My City Centre — integrating retail with lifestyle living.', nationality: 'UAE' },
    { slug: 'ithra-dubai', name: 'Ithra Dubai', logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&q=80', established: 2012, projects: 8, deliveredProjects: 5, about: "Developer of One Za'abeel — home to the world's longest cantilevered sky concourse — and The Link.", nationality: 'UAE' },
    { slug: 'ellington', name: 'Ellington Properties', logo: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=120&q=80', established: 2014, projects: 22, deliveredProjects: 15, about: 'Design-led boutique developer known for Ellington Ocean House, DT1, and Wilton Park Residences.', nationality: 'UAE' },
    { slug: 'dubai-properties', name: 'Dubai Properties', logo: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=120&q=80', established: 2004, projects: 31, deliveredProjects: 24, about: 'Developer of Jumeirah Beach Residence (JBR), Business Bay, Mudon, and Al Furjan master communities.', nationality: 'UAE' },
    { slug: 'azizi', name: 'Azizi Developments', logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=120&q=80', established: 2007, projects: 58, deliveredProjects: 42, about: "One of Dubai's most prolific developers with projects in Palm Jumeirah, MBR City, Al Furjan, and Meydan.", nationality: 'UAE' },
    { slug: 'samana', name: 'Samana Developers', logo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&q=80', established: 2016, projects: 36, deliveredProjects: 18, about: 'Fast-growing developer known for resort-style apartments with private pools in JVC, Dubailand, and DSO.', nationality: 'International' },
    { slug: 'binghatti', name: 'Binghatti Developers', logo: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=120&q=80', established: 2008, projects: 44, deliveredProjects: 38, about: 'Known for distinct façade architecture and fast delivery timelines across Business Bay, JVC, and Dubai Silicon Oasis.', nationality: 'UAE' },
    { slug: 'tiger-group', name: 'Tiger Group', logo: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&q=80', established: 1976, projects: 28, deliveredProjects: 22, about: 'Established developer with projects across JVC, Motor City, and Sports City. Known for timely delivery.', nationality: 'International' },
    { slug: 'danube', name: 'Danube Properties', logo: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=120&q=80', established: 2014, projects: 42, deliveredProjects: 31, about: 'Affordable luxury developer offering 1% monthly payment plans. Projects in Arjan, JVC, and Al Furjan.', nationality: 'UAE' },
  ];

  filtered = computed(() => {
    let list = [...this.developers];
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    if (f === 'Featured') list = list.filter(d => d.featured);
    else if (f === 'UAE') list = list.filter(d => d.nationality === 'UAE');
    else if (f === 'International') list = list.filter(d => d.nationality === 'International');
    if (q) list = list.filter(d => d.name.toLowerCase().includes(q) || d.about.toLowerCase().includes(q));
    return list;
  });

  featuredDevs = computed(() => this.developers.filter(d => d.featured).slice(0, 8));
}
