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
  readonly row1: { heading: string; links: { label: string; href: string; params?: Record<string, string> }[] }[] = [
    {
      heading: 'Dubai Properties',
      links: [
        { label: 'About Livwell',                      href: '/about' },
        { label: 'Join Livwell',                       href: '/agents' },
        { label: 'Contact Us',                         href: '/contact' },
        { label: 'Dubai Real Estate Blog',             href: '/blog' },
        { label: 'Dubai Real Estate FAQs',             href: '/faq' },
        { label: 'Top Real Estate Developers in Dubai',href: '/developers' },
        { label: 'Dubai Property Management',          href: '/services' },
        { label: 'Loan Mortgage Calculator',           href: '/why-invest' },
        { label: 'Sell Your Property in Dubai',        href: '/contact' },
      ],
    },
    {
      heading: 'Dubai Properties for Sale',
      links: [
        { label: 'Dubai Penthouse for Sale',        href: '/properties', params: { status: 'Sale', type: 'Penthouse' } },
        { label: 'Dubai Mansion for Sale',          href: '/properties', params: { status: 'Sale', q: 'Mansion' } },
        { label: 'Dubai Apartment for Sale',        href: '/properties', params: { status: 'Sale', type: 'Apartment' } },
        { label: 'Dubai Villa for Sale',            href: '/properties', params: { status: 'Sale', type: 'Villa' } },
        { label: 'Houses for Sale in Dubai',        href: '/properties', params: { status: 'Sale', type: 'Villa' } },
        { label: 'Office for Sale in Dubai',        href: '/commercial',  params: { status: 'Sale', type: 'Office' } },
        { label: 'Buy Ready Apartments in Dubai',   href: '/properties', params: { status: 'Sale', type: 'Apartment' } },
        { label: 'Buy Ready Villas in Dubai',       href: '/properties', params: { status: 'Sale', type: 'Villa' } },
        { label: 'Townhouse for Sale in Dubai',     href: '/properties', params: { status: 'Sale', type: 'Townhouse' } },
        { label: 'Lands in Dubai for Sale',         href: '/properties', params: { status: 'Sale', type: 'Plot' } },
      ],
    },
    {
      heading: 'Dubai Properties for Rent',
      links: [
        { label: 'Dubai Penthouse for Rent',        href: '/properties', params: { status: 'Rent', type: 'Penthouse' } },
        { label: 'Dubai Apartment for Rent',        href: '/properties', params: { status: 'Rent', type: 'Apartment' } },
        { label: 'Dubai Villa for Rent',            href: '/properties', params: { status: 'Rent', type: 'Villa' } },
        { label: 'Office in Dubai for Rent',        href: '/commercial',  params: { status: 'Rent', type: 'Office' } },
        { label: 'Townhouse for Rent in Dubai',     href: '/properties', params: { status: 'Rent', type: 'Townhouse' } },
        { label: 'Houses for Rent in Dubai',        href: '/properties', params: { status: 'Rent', type: 'Villa' } },
        { label: 'Furnished Apartments for Rent',   href: '/properties', params: { status: 'Rent', type: 'Apartment', furnished: 'Furnished' } },
        { label: 'Furnished Villas for Rent',       href: '/properties', params: { status: 'Rent', type: 'Villa', furnished: 'Furnished' } },
        { label: 'Furnished Townhouses for Rent',   href: '/properties', params: { status: 'Rent', type: 'Townhouse', furnished: 'Furnished' } },
        { label: 'Rent Your Property in Dubai',     href: '/contact' },
      ],
    },
    {
      heading: 'Furnished Properties',
      links: [
        { label: 'Furnished Studio For Sale',           href: '/properties', params: { status: 'Sale', beds: 'Studio', furnished: 'Furnished' } },
        { label: 'Furnished 1 Bed Apartment For Sale',  href: '/properties', params: { status: 'Sale', type: 'Apartment', beds: '1', furnished: 'Furnished' } },
        { label: 'Furnished 2 Bed Apartment For Sale',  href: '/properties', params: { status: 'Sale', type: 'Apartment', beds: '2', furnished: 'Furnished' } },
        { label: 'Furnished 3 Bed Apartment For Sale',  href: '/properties', params: { status: 'Sale', type: 'Apartment', beds: '3', furnished: 'Furnished' } },
        { label: 'Furnished 4 Bed Apartment For Sale',  href: '/properties', params: { status: 'Sale', type: 'Apartment', beds: '4', furnished: 'Furnished' } },
        { label: 'Furnished Studio For Rent',           href: '/properties', params: { status: 'Rent', beds: 'Studio', furnished: 'Furnished' } },
        { label: 'Furnished 1 Bed Apartment For Rent',  href: '/properties', params: { status: 'Rent', type: 'Apartment', beds: '1', furnished: 'Furnished' } },
        { label: 'Furnished 2 Bed Apartment For Rent',  href: '/properties', params: { status: 'Rent', type: 'Apartment', beds: '2', furnished: 'Furnished' } },
        { label: 'Furnished 3 Bed Apartment For Rent',  href: '/properties', params: { status: 'Rent', type: 'Apartment', beds: '3', furnished: 'Furnished' } },
        { label: 'Furnished 4 Bed Apartment For Rent',  href: '/properties', params: { status: 'Rent', type: 'Apartment', beds: '4', furnished: 'Furnished' } },
      ],
    },
  ];

  readonly row2: { heading: string; links: { label: string; href: string; params?: Record<string, string> }[] }[] = [
    {
      heading: 'Luxury Properties',
      links: [
        { label: 'Luxury Apartments For Sale',   href: '/luxury-properties-for-sale', params: { status: 'Sale', type: 'Apartment' } },
        { label: 'Luxury Villas For Sale',        href: '/luxury-properties-for-sale', params: { status: 'Sale', type: 'Villa' } },
        { label: 'Luxury Homes For Sale',         href: '/luxury-properties-for-sale', params: { status: 'Sale' } },
        { label: 'Luxury Penthouses For Sale',    href: '/luxury-properties-for-sale', params: { status: 'Sale', type: 'Penthouse' } },
        { label: 'Luxury Apartments For Rent',    href: '/luxury-properties-for-sale', params: { status: 'Rent', type: 'Apartment' } },
        { label: 'Luxury Villas For Rent',        href: '/luxury-properties-for-sale', params: { status: 'Rent', type: 'Villa' } },
        { label: 'Luxury Homes For Rent',         href: '/luxury-properties-for-sale', params: { status: 'Rent' } },
        { label: 'Luxury Penthouses For Rent',    href: '/luxury-properties-for-sale', params: { status: 'Rent', type: 'Penthouse' } },
      ],
    },
    {
      heading: 'Beachfront & Waterfront Properties',
      links: [
        { label: 'Beachfront Properties for Sale', href: '/properties', params: { status: 'Sale', q: 'Beachfront' } },
        { label: 'Beachfront Properties for Rent', href: '/properties', params: { status: 'Rent', q: 'Beachfront' } },
        { label: 'Waterfront Properties for Sale', href: '/properties', params: { status: 'Sale', q: 'Waterfront' } },
        { label: 'Waterfront Properties for Rent', href: '/properties', params: { status: 'Rent', q: 'Waterfront' } },
        { label: 'Beachfront Villas for Sale',     href: '/properties', params: { status: 'Sale', type: 'Villa', q: 'Beachfront' } },
        { label: 'Beachfront Villas for Rent',     href: '/properties', params: { status: 'Rent', type: 'Villa', q: 'Beachfront' } },
        { label: 'Beachfront Apartments for Sale', href: '/properties', params: { status: 'Sale', type: 'Apartment', q: 'Beachfront' } },
        { label: 'Beachfront Apartments for Rent', href: '/properties', params: { status: 'Rent', type: 'Apartment', q: 'Beachfront' } },
      ],
    },
    {
      heading: 'Off Plan Property Dubai',
      links: [
        { label: 'Buy Off Plan Apartments in Dubai',      href: '/off-plan', params: { type: 'Apartment' } },
        { label: 'Buy Off Plan Villas in Dubai',          href: '/off-plan', params: { type: 'Villa' } },
        { label: 'Buy Off Plan Townhouses in Dubai',      href: '/off-plan', params: { type: 'Townhouse' } },
        { label: 'Off Plan Projects in Dubai',            href: '/off-plan' },
        { label: 'Off Plan Villa Projects in Dubai',      href: '/off-plan', params: { type: 'Villa' } },
        { label: 'Off Plan Apartment Projects in Dubai',  href: '/off-plan', params: { type: 'Apartment' } },
        { label: 'Off Plan Townhouse Projects in Dubai',  href: '/off-plan', params: { type: 'Townhouse' } },
      ],
    },
    {
      heading: 'Dubai Living Experiences',
      links: [
        { label: 'Dubai Living',        href: '/properties', params: { location: 'Dubai' } },
        { label: 'Beachfront',          href: '/properties', params: { q: 'Beachfront' } },
        { label: 'Waterfront',          href: '/properties', params: { q: 'Waterfront' } },
        { label: 'Downtown',            href: '/properties', params: { location: 'Downtown Dubai' } },
        { label: 'Golf Course',         href: '/properties', params: { q: 'Golf Course' } },
        { label: 'Island Living',       href: '/properties', params: { q: 'Palm Jumeirah' } },
        { label: 'Green Nature Living', href: '/properties', params: { q: 'Nature' } },
        { label: 'Business Center',     href: '/properties', params: { location: 'Business Bay' } },
      ],
    },
  ];

  readonly row3: { heading: string; links: { label: string; href: string; params?: Record<string, string> }[] }[] = [
    {
      heading: 'Projects In Dubai',
      links: [
        { label: 'Ready Villa Project in Dubai',      href: '/projects', params: { type: 'Villa' } },
        { label: 'Ready Apartment Project in Dubai',  href: '/projects', params: { type: 'Apartment' } },
        { label: 'Ready Townhouse Project in Dubai',  href: '/projects', params: { type: 'Townhouse' } },
        { label: 'Luxury Projects in Dubai',          href: '/luxury-projects' },
        { label: 'Ultra Luxury Projects in Dubai',    href: '/ultra-luxury-projects' },
        { label: 'Dubai Property Reviews',            href: '/blog' },
      ],
    },
    {
      heading: 'Dubai in Numbers',
      links: [
        { label: 'Community Service Charges',    href: '/why-invest' },
        { label: 'Projects Completion Date',     href: '/projects' },
        { label: 'Project Construction Progress',href: '/projects' },
        { label: 'Best Schools in Dubai',        href: '/areas' },
        { label: 'Dubai Property Prices',        href: '/why-invest' },
        { label: 'Dubai Apartment Prices',       href: '/properties', params: { type: 'Apartment' } },
        { label: 'Dubai Villa Prices',           href: '/properties', params: { type: 'Villa' } },
      ],
    },
  ];

  readonly offices: { name: string; address: string }[] = [
    { name: 'Livwell - Al Furjan',               address: 'FRJP R-27B Pavilion AL Furjan South Pavillion, Dubai' },
    { name: 'Livwell - Bay Square 1',            address: 'Bldg. 01 Office 801,802,806 Bay Square, Business Bay, Dubai' },
    { name: 'Livwell - Building 13',             address: 'Bldg. 13, Office 303 & 304 Bay Square Business Bay, Dubai' },
    { name: 'Livwell - City Walk',               address: 'City Walk Boulevard Shop 8 -02, Dubai' },
    { name: 'Livwell - Dubai Harbour Beachfront',address: 'Unit 12, Groundfloor Dubai Harbour Masters Bldg., Dubai' },
    { name: 'Livwell - Dubai Hills',             address: 'Park Heights Square Building 2- Level 6 Unit 603-604' },
    { name: 'Livwell - Dubai Marina',            address: '1401 Marina Plaza, Dubai Marina, Dubai' },
    { name: 'Livwell - Dubai South Branch',      address: 'The Pulse Residence Icon - R02 Shop' },
    { name: 'Livwell - Jumeirah Park',           address: 'Shop G10, Jumeirah Park East Pavilion, Jumeirah Park, Dubai' },
    { name: 'Livwell - Meydan Branch',           address: 'Meydan Heights Retail Centre Unit G 10 Ground Level, Dubai' },
    { name: 'Livwell - Motor City',              address: 'Motor City- Control Tower Unit 2803 Dubai' },
    { name: 'Livwell - Mudon',                   address: 'Shop No. 2 & 1, Al Salam, Mudon Community Center, Dubai Land, Dubai' },
    { name: 'Livwell - Palm Jumeirah',           address: 'Golden Mile 9, Shop 10 Galleria, Palm Jumeirah, Dubai' },
    { name: 'Livwell - Villanova',               address: 'Villanova, Wadi Al Safa - Emirates Road, Dubai' },
    { name: 'Livwell - Dubai Creek Harbour',     address: 'GRF-02, Tower 3, North Podium, Creek Harbour, Dubai' },
    { name: 'Livwell 24/7 Media LLC',            address: 'Bldg. 13, Office 303 & 304 Bay Square Business Bay, Dubai' },
  ];
}
