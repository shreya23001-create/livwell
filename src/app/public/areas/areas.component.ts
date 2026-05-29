import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface Area {
  slug: string;
  name: string;
  location: string;
  image: string;
  propertiesForSale: number;
  propertiesForRent: number;
  avgPriceSale: string;
  avgPriceRent: string;
  types: string[];
  category: 'Freehold' | 'Leasehold' | 'Both';
  featured?: boolean;
  description: string;
}

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.scss',
})
export class AreasComponent {
  searchQuery = signal('');
  activeCategory = signal('All');
  activeType = signal('All');

  readonly categories = ['All', 'Freehold', 'Leasehold', 'Both'];
  readonly propertyTypes = ['All', 'Apartments', 'Villas', 'Townhouses', 'Offices', 'Plots'];

  readonly faqs = [
    { q: 'Which areas in Dubai are freehold for expats?', a: 'Dubai has designated over 60 freehold areas where non-UAE nationals can purchase property. Key freehold areas include Downtown Dubai, Dubai Marina, Palm Jumeirah, Business Bay, JBR, JVC, Dubai Hills Estate, MBR City, and DAMAC Hills.', open: false },
    { q: 'What is the most affordable area to buy property in Dubai?', a: 'Jumeirah Village Circle (JVC), International City, Discovery Gardens, Dubai South, and Dubailand are among the most affordable areas to buy property in Dubai, with studios and 1-bedroom apartments starting from AED 350,000.', open: false },
    { q: 'Which Dubai community is best for families?', a: 'Dubai Hills Estate, Arabian Ranches, The Springs, Mudon, and Jumeirah are widely regarded as the best family-oriented communities. They offer schools, parks, community centres, and a safe, suburban environment.', open: false },
    { q: 'What is the average rental price in Dubai Marina?', a: 'As of 2026, average rental prices in Dubai Marina range from AED 70,000–90,000/yr for a studio, AED 100,000–130,000/yr for a 1-bed, and AED 140,000–200,000/yr for a 2-bed apartment, depending on the tower and view.', open: false },
    { q: 'Which areas offer the highest rental yield in Dubai?', a: 'JVC, Dubai Sports City, International City, Business Bay, and DAMAC Hills 2 consistently deliver the highest rental yields in Dubai — typically 7–9% gross per annum — driven by affordable entry prices and strong tenant demand.', open: false },
    { q: 'What makes a Dubai area eligible for the Golden Visa through property?', a: 'To qualify for the UAE Golden Visa through property, investors must purchase a completed (not off-plan) property worth a minimum of AED 2,000,000. The property must be in a freehold area and fully paid (not mortgaged, or the equity portion must exceed AED 2M).', open: false },
  ];

  openFaq = signal<number | null>(null);
  toggleFaq(i: number) { this.openFaq.set(this.openFaq() === i ? null : i); }

  readonly areas: Area[] = [
    { slug: 'downtown-dubai', name: 'Downtown Dubai', location: 'Central Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', propertiesForSale: 342, propertiesForRent: 218, avgPriceSale: 'AED 2.8M', avgPriceRent: 'AED 120K/yr', types: ['Apartments', 'Penthouses'], category: 'Freehold', featured: true, description: 'Home to the Burj Khalifa and Dubai Mall, Downtown is Dubai\'s most iconic address.' },
    { slug: 'dubai-marina', name: 'Dubai Marina', location: 'New Dubai', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800&q=80', propertiesForSale: 489, propertiesForRent: 376, avgPriceSale: 'AED 1.9M', avgPriceRent: 'AED 95K/yr', types: ['Apartments', 'Penthouses'], category: 'Freehold', featured: true, description: 'A vibrant waterfront district with world-class dining, a yacht marina, and stunning tower views.' },
    { slug: 'palm-jumeirah', name: 'Palm Jumeirah', location: 'Palm Island', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80', propertiesForSale: 276, propertiesForRent: 142, avgPriceSale: 'AED 5.2M', avgPriceRent: 'AED 180K/yr', types: ['Apartments', 'Villas', 'Townhouses'], category: 'Freehold', featured: true, description: 'Dubai\'s iconic palm-shaped island, home to luxury villas, beachfront apartments, and world-famous hotels.' },
    { slug: 'business-bay', name: 'Business Bay', location: 'Central Dubai', image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80', propertiesForSale: 401, propertiesForRent: 312, avgPriceSale: 'AED 1.6M', avgPriceRent: 'AED 85K/yr', types: ['Apartments', 'Offices'], category: 'Freehold', featured: true, description: 'A commercial and residential hub on the Dubai Canal, adjacent to Downtown Dubai.' },
    { slug: 'jumeirah-village-circle', name: 'Jumeirah Village Circle', location: 'New Dubai', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', propertiesForSale: 654, propertiesForRent: 421, avgPriceSale: 'AED 750K', avgPriceRent: 'AED 55K/yr', types: ['Apartments', 'Townhouses', 'Villas'], category: 'Freehold', featured: true, description: 'One of Dubai\'s most popular affordable communities with high rental yields and family-friendly amenities.' },
    { slug: 'dubai-hills-estate', name: 'Dubai Hills Estate', location: 'Dubai Hills', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80', propertiesForSale: 312, propertiesForRent: 187, avgPriceSale: 'AED 3.1M', avgPriceRent: 'AED 130K/yr', types: ['Villas', 'Townhouses', 'Apartments'], category: 'Freehold', featured: true, description: 'A master-planned community wrapped around an 18-hole championship golf course.' },
    { slug: 'jumeirah-lake-towers', name: 'Jumeirah Lake Towers', location: 'New Dubai', image: 'https://images.unsplash.com/photo-1582407947304-fd86f28f4e94?w=800&q=80', propertiesForSale: 287, propertiesForRent: 244, avgPriceSale: 'AED 1.1M', avgPriceRent: 'AED 65K/yr', types: ['Apartments', 'Offices'], category: 'Both', description: 'A DMCC free zone community with 79 towers, lakefront promenades, and excellent connectivity.' },
    { slug: 'arabian-ranches', name: 'Arabian Ranches', location: 'Dubailand', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', propertiesForSale: 198, propertiesForRent: 94, avgPriceSale: 'AED 4.2M', avgPriceRent: 'AED 160K/yr', types: ['Villas', 'Townhouses'], category: 'Freehold', description: 'Emaar\'s flagship villa community, known for its spacious homes, equestrian club, and polo fields.' },
    { slug: 'jumeirah-beach-residence', name: 'Jumeirah Beach Residence', location: 'New Dubai', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', propertiesForSale: 221, propertiesForRent: 189, avgPriceSale: 'AED 2.2M', avgPriceRent: 'AED 100K/yr', types: ['Apartments'], category: 'Freehold', description: 'Dubai\'s original beachfront community — 40 towers lining the famous JBR Walk.' },
    { slug: 'mbr-city', name: 'Mohammed Bin Rashid City', location: 'MBR City', image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80', propertiesForSale: 267, propertiesForRent: 98, avgPriceSale: 'AED 3.8M', avgPriceRent: 'AED 145K/yr', types: ['Villas', 'Apartments', 'Townhouses'], category: 'Freehold', description: 'A mega-development encompassing Meydan, District One, and Crystal Lagoons.' },
    { slug: 'difc', name: 'DIFC', location: 'Central Dubai', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', propertiesForSale: 87, propertiesForRent: 156, avgPriceSale: 'AED 6.1M', avgPriceRent: 'AED 280K/yr', types: ['Apartments', 'Offices'], category: 'Both', description: 'Dubai\'s financial centre — prestigious offices, luxury residences, and world-class restaurants.' },
    { slug: 'damac-hills', name: 'DAMAC Hills', location: 'Dubailand', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', propertiesForSale: 223, propertiesForRent: 134, avgPriceSale: 'AED 2.4M', avgPriceRent: 'AED 95K/yr', types: ['Villas', 'Townhouses', 'Apartments'], category: 'Freehold', description: 'A Trump International Golf Course community with villas, townhouses, and luxury apartments.' },
    { slug: 'the-springs', name: 'The Springs', location: 'Emirates Living', image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80', propertiesForSale: 142, propertiesForRent: 89, avgPriceSale: 'AED 2.8M', avgPriceRent: 'AED 120K/yr', types: ['Villas', 'Townhouses'], category: 'Freehold', description: 'A tranquil Emaar community with lake-facing townhouses and a peaceful suburban lifestyle.' },
    { slug: 'dubai-sports-city', name: 'Dubai Sports City', location: 'Dubailand', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80', propertiesForSale: 198, propertiesForRent: 176, avgPriceSale: 'AED 650K', avgPriceRent: 'AED 40K/yr', types: ['Apartments', 'Villas'], category: 'Freehold', description: 'A sports-themed city with cricket stadium, football academies, and affordable residential units.' },
    { slug: 'al-barsha', name: 'Al Barsha', location: 'Central Dubai', image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80', propertiesForSale: 167, propertiesForRent: 234, avgPriceSale: 'AED 1.2M', avgPriceRent: 'AED 60K/yr', types: ['Apartments', 'Villas'], category: 'Both', description: 'A well-established mixed community near Mall of the Emirates with schools, clinics, and retail.' },
    { slug: 'international-city', name: 'International City', location: 'Dubailand', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', propertiesForSale: 312, propertiesForRent: 289, avgPriceSale: 'AED 380K', avgPriceRent: 'AED 28K/yr', types: ['Apartments'], category: 'Freehold', description: 'Dubai\'s most affordable residential community, offering studios and 1-bedrooms for investors seeking high yields.' },
    { slug: 'bluewaters-island', name: 'Bluewaters Island', location: 'JBR', image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80', propertiesForSale: 78, propertiesForRent: 54, avgPriceSale: 'AED 4.8M', avgPriceRent: 'AED 200K/yr', types: ['Apartments', 'Penthouses'], category: 'Freehold', description: 'A luxury island destination home to Ain Dubai (the world\'s largest observation wheel) and Caesars Palace.' },
    { slug: 'sobha-hartland', name: 'Sobha Hartland', location: 'MBR City', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', propertiesForSale: 187, propertiesForRent: 76, avgPriceSale: 'AED 2.9M', avgPriceRent: 'AED 120K/yr', types: ['Apartments', 'Villas', 'Townhouses'], category: 'Freehold', description: 'An ultra-lush, green community built around 2.4 million sqft of landscaped parkland in MBR City.' },
    { slug: 'jumeirah', name: 'Jumeirah', location: 'Old Dubai', image: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80', propertiesForSale: 156, propertiesForRent: 112, avgPriceSale: 'AED 5.8M', avgPriceRent: 'AED 200K/yr', types: ['Villas'], category: 'Both', description: 'A prestigious beachside neighbourhood famous for luxury villas, private beaches, and diplomatic residences.' },
    { slug: 'dubai-creek-harbour', name: 'Dubai Creek Harbour', location: 'Creek', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80', propertiesForSale: 234, propertiesForRent: 87, avgPriceSale: 'AED 1.8M', avgPriceRent: 'AED 80K/yr', types: ['Apartments'], category: 'Freehold', description: 'Emaar\'s ambitious waterfront city, set to be home to Dubai Creek Tower, the world\'s tallest structure.' },
    { slug: 'al-furjan', name: 'Al Furjan', location: 'New Dubai', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', propertiesForSale: 189, propertiesForRent: 156, avgPriceSale: 'AED 1.4M', avgPriceRent: 'AED 65K/yr', types: ['Villas', 'Townhouses', 'Apartments'], category: 'Freehold', description: 'A Nakheel master community near Ibn Battuta Mall, offering villa plots, townhouses, and apartments.' },
    { slug: 'tilal-al-ghaf', name: 'Tilal Al Ghaf', location: 'Dubailand', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', propertiesForSale: 143, propertiesForRent: 42, avgPriceSale: 'AED 3.6M', avgPriceRent: 'AED 145K/yr', types: ['Villas', 'Townhouses'], category: 'Freehold', description: 'Majid Al Futtaim\'s master community centred around a crystal lagoon and pristine beach.' },
    { slug: 'meydan', name: 'Meydan', location: 'MBR City', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80', propertiesForSale: 176, propertiesForRent: 68, avgPriceSale: 'AED 2.2M', avgPriceRent: 'AED 90K/yr', types: ['Villas', 'Apartments'], category: 'Freehold', description: 'Home to the famous Meydan Racecourse and an emerging premium residential community.' },
    { slug: 'dubai-south', name: 'Dubai South', location: 'Dubai South', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80', propertiesForSale: 198, propertiesForRent: 89, avgPriceSale: 'AED 550K', avgPriceRent: 'AED 32K/yr', types: ['Apartments', 'Villas', 'Plots'], category: 'Freehold', description: 'The city of the future built around Al Maktoum International Airport and Expo City Dubai.' },
  ];

  filtered = computed(() => {
    let list = [...this.areas];
    const cat = this.activeCategory();
    const type = this.activeType();
    const q = this.searchQuery().toLowerCase().trim();
    if (cat !== 'All') list = list.filter(a => a.category === cat);
    if (type !== 'All') list = list.filter(a => a.types.includes(type));
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
    return list;
  });

  featured = computed(() => this.areas.filter(a => a.featured));
}
