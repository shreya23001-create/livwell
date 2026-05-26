import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-seo-links-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seo-links-section.component.html',
  styleUrl: './seo-links-section.component.scss',
})
export class SeoLinksSectionComponent {
  readonly row1: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: 'Dubai Properties',
      links: [
        { label: 'About Livwell', href: '/about' },
        { label: 'Join Livwell', href: '/agents' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Dubai Real Estate Blog', href: '/blog' },
        { label: 'Dubai Real Estate FAQs', href: '/contact' },
        { label: 'Top Real Estate Developers in Dubai', href: '/properties' },
        { label: 'Dubai Property Management', href: '/properties' },
        { label: 'Loan Mortgage Calculator', href: '/properties' },
        { label: 'Sell Your Property in Dubai', href: '/contact' },
      ],
    },
    {
      heading: 'Dubai Properties for Sale',
      links: [
        { label: 'Dubai Penthouse for Sale', href: '/properties' },
        { label: 'Dubai Mansion for Sale', href: '/properties' },
        { label: 'Dubai Apartment for Sale', href: '/properties' },
        { label: 'Dubai Villa for Sale', href: '/properties' },
        { label: 'Houses for Sale in Dubai', href: '/properties' },
        { label: 'Office for Sale in Dubai', href: '/properties' },
        { label: 'Buy Ready Apartments in Dubai', href: '/properties' },
        { label: 'Buy Ready Villas in Dubai', href: '/properties' },
        { label: 'Townhouse for Sale in Dubai', href: '/properties' },
        { label: 'Lands in Dubai for Sale', href: '/properties' },
      ],
    },
    {
      heading: 'Dubai Properties for Rent',
      links: [
        { label: 'Dubai Penthouse for Rent', href: '/properties' },
        { label: 'Dubai Apartment for Rent', href: '/properties' },
        { label: 'Dubai Villa for Rent', href: '/properties' },
        { label: 'Office in Dubai for Rent', href: '/properties' },
        { label: 'Townhouse for Rent in Dubai', href: '/properties' },
        { label: 'Houses for Rent in Dubai', href: '/properties' },
        { label: 'Furnished Apartments for Rent', href: '/properties' },
        { label: 'Furnished Villas for Rent', href: '/properties' },
        { label: 'Furnished Townhouses for Rent', href: '/properties' },
        { label: 'Rent Your Property in Dubai', href: '/contact' },
      ],
    },
    {
      heading: 'Furnished Properties',
      links: [
        { label: 'Furnished Studio For Sale', href: '/properties' },
        { label: 'Furnished 1 Bed Apartment For Sale', href: '/properties' },
        { label: 'Furnished 2 Bed Apartment For Sale', href: '/properties' },
        { label: 'Furnished 3 Bed Apartment For Sale', href: '/properties' },
        { label: 'Furnished 4 Bed Apartment For Sale', href: '/properties' },
        { label: 'Furnished Studio For Rent', href: '/properties' },
        { label: 'Furnished 1 Bed Apartment For Rent', href: '/properties' },
        { label: 'Furnished 2 Bed Apartment For Rent', href: '/properties' },
        { label: 'Furnished 3 Bed Apartment For Rent', href: '/properties' },
        { label: 'Furnished 4 Bed Apartment For Rent', href: '/properties' },
      ],
    },
  ];

  readonly row2: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: 'Luxury Properties',
      links: [
        { label: 'Luxury Apartments For Sale', href: '/properties' },
        { label: 'Luxury Villas For Sale', href: '/properties' },
        { label: 'Luxury Homes For Sale', href: '/properties' },
        { label: 'Luxury Penthouses For Sale', href: '/properties' },
        { label: 'Luxury Apartments For Rent', href: '/properties' },
        { label: 'Luxury Villas For Rent', href: '/properties' },
        { label: 'Luxury Homes For Rent', href: '/properties' },
        { label: 'Luxury Penthouses For Rent', href: '/properties' },
      ],
    },
    {
      heading: 'Beachfront & Waterfront Properties',
      links: [
        { label: 'Beachfront Properties for Sale', href: '/properties' },
        { label: 'Beachfront Properties for Rent', href: '/properties' },
        { label: 'Waterfront Properties for Sale', href: '/properties' },
        { label: 'Waterfront Properties for Rent', href: '/properties' },
        { label: 'Beachfront Villas for Sale', href: '/properties' },
        { label: 'Beachfront Villas for Rent', href: '/properties' },
        { label: 'Beachfront Apartments for Sale', href: '/properties' },
        { label: 'Beachfront Apartments for Rent', href: '/properties' },
      ],
    },
    {
      heading: 'Off Plan Property Dubai',
      links: [
        { label: 'Buy Off Plan Apartments in Dubai', href: '/off-plan' },
        { label: 'Buy Off Plan Villas in Dubai', href: '/off-plan' },
        { label: 'Buy Off Plan Townhouses in Dubai', href: '/off-plan' },
        { label: 'Off Plan Projects in Dubai', href: '/off-plan' },
        { label: 'Off Plan Villa Projects in Dubai', href: '/off-plan' },
        { label: 'Off Plan Apartment Projects in Dubai', href: '/off-plan' },
        { label: 'Off Plan Townhouse Projects in Dubai', href: '/off-plan' },
      ],
    },
    {
      heading: 'Dubai Living Experiences',
      links: [
        { label: 'Dubai Living', href: '/properties' },
        { label: 'Beachfront', href: '/properties' },
        { label: 'Waterfront', href: '/properties' },
        { label: 'Downtown', href: '/properties' },
        { label: 'Golf Course', href: '/properties' },
        { label: 'Island Living', href: '/properties' },
        { label: 'Green Nature Living', href: '/properties' },
        { label: 'Business Center', href: '/properties' },
      ],
    },
  ];

  readonly row3: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: 'Projects In Dubai',
      links: [
        { label: 'Ready Villa Project in Dubai', href: '/properties' },
        { label: 'Ready Apartment Project in Dubai', href: '/properties' },
        { label: 'Ready Townhouse Project in Dubai', href: '/properties' },
        { label: 'Luxury Projects in Dubai', href: '/luxury-projects' },
        { label: 'Ultra Luxury Projects in Dubai', href: '/luxury-projects' },
        { label: 'Dubai Property Reviews', href: '/blog' },
      ],
    },
    {
      heading: 'Dubai in Numbers',
      links: [
        { label: 'Community Service Charges', href: '/blog' },
        { label: 'Projects Completion Date', href: '/blog' },
        { label: 'Project Construction Progress', href: '/blog' },
        { label: 'Best Schools in Dubai', href: '/blog' },
        { label: 'Dubai Property Prices', href: '/blog' },
        { label: 'Dubai Apartment Prices', href: '/blog' },
        { label: 'Dubai Villa Prices', href: '/blog' },
      ],
    },
  ];

  readonly offices: { name: string; address: string }[] = [
    { name: 'Livwell - Al Furjan', address: 'FRJP R-27B Pavilion AL Furjan South Pavillion, Dubai' },
    { name: 'Livwell - Bay Square 1', address: 'Bldg. 01 Office 801,802,806 Bay Square, Business Bay, Dubai' },
    { name: 'Livwell - Building 13', address: 'Bldg. 13, Office 303 & 304 Bay Square Business Bay, Dubai' },
    { name: 'Livwell - City Walk', address: 'City Walk Boulevard Shop 8 -02, Dubai' },
    { name: 'Livwell - Dubai Harbour Beachfront', address: 'Unit 12, Groundfloor Dubai Harbour Masters Bldg., Dubai' },
    { name: 'Livwell - Dubai Hills', address: 'Park Heights Square Building 2- Level 6 Unit 603-604' },
    { name: 'Livwell - Dubai Marina', address: '1401 Marina Plaza, Dubai Marina, Dubai' },
    { name: 'Livwell - Dubai South Branch', address: 'The Pulse Residence Icon - R02 Shop' },
    { name: 'Livwell - Jumeirah Park', address: 'Shop G10, Jumeirah Park East Pavilion, Jumeirah Park, Dubai' },
    { name: 'Livwell - Meydan Branch', address: 'Meydan Heights Retail Centre Unit G 10 Ground Level, Dubai' },
    { name: 'Livwell - Motor City', address: 'Motor City- Control Tower Unit 2803 Dubai' },
    { name: 'Livwell - Mudon', address: 'Shop No. 2 & 1, Al Salam, Mudon Community Center, Dubai Land, Dubai' },
    { name: 'Livwell - Palm Jumeirah', address: 'Golden Mile 9, Shop 10 Galleria, Palm Jumeirah, Dubai' },
    { name: 'Livwell - Villanova', address: 'Villanova, Wadi Al Safa - Emirates Road, Dubai' },
    { name: 'Livwell - Dubai Creek Harbour', address: 'GRF-02, Tower 3, North Podium, Creek Harbour, Dubai' },
    { name: 'Livwell 24/7 Media LLC', address: 'Bldg. 13, Office 303 & 304 Bay Square Business Bay, Dubai' },
  ];
}
