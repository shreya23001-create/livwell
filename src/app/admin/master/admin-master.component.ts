import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../shared/services/admin-data.service';
import * as XLSX from 'xlsx';

type MasterTab = 'categories' | 'property-types' | 'statuses' | 'trending-tabs' | 'locations' | 'communities' | 'amenities';

export const AMENITY_ICONS: { key: string; label: string; svg: string }[] = [
  { key: 'pool',       label: 'Swimming Pool',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M3 20c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M10.5 6a2.5 2.5 0 1 1 5 0v5H9.5"/></svg>' },
  { key: 'gym',        label: 'Gym',             svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"/></svg>' },
  { key: 'parking',    label: 'Parking',         svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>' },
  { key: 'security',   label: 'Security',        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { key: 'concierge',  label: 'Concierge',       svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"/></svg>' },
  { key: 'spa',        label: 'Spa & Wellness',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>' },
  { key: 'kids',       label: 'Kids Play Area',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"/></svg>' },
  { key: 'garden',     label: 'Garden & BBQ',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5c0 2.485 2.099 4.5 4.692 4.5H12m0 0v3.75m0-3.75h3.558c2.593 0 4.692-2.015 4.692-4.5S18.15 9 15.558 9H12m0 0V5.25m0 3.75C10.686 9 9.75 7.929 9.75 6.75A2.25 2.25 0 0 1 12 4.5c1.243 0 2.25 1.007 2.25 2.25S13.314 9 12 9Z"/></svg>' },
  { key: 'elevator',   label: 'Elevator',        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"/></svg>' },
  { key: 'balcony',    label: 'Balcony',         svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M5 21V10m14 11V10M9 21v-4a3 3 0 0 1 6 0v4"/></svg>' },
  { key: 'ac',         label: 'Central A/C',     svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>' },
  { key: 'pet',        label: 'Pet Friendly',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"/></svg>' },
  { key: 'retail',     label: 'Retail Outlets',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/></svg>' },
  { key: 'view',       label: 'Sea / Skyline View', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>' },
  { key: 'maid',       label: 'Maid Room',       svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>' },
  { key: 'kitchen',    label: 'Fitted Kitchen',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 0A8.966 8.966 0 0 1 18 9H6a8.966 8.966 0 0 1 6-3.75ZM6 9v.75m0 0A3 3 0 0 0 3 12.75m3-3h12m0 0v.75m0 0A3 3 0 0 1 21 12.75m-3-3v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-6"/></svg>' },
  { key: 'tennis',     label: 'Tennis Court',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2 4 2 14 0 18M3 12c4-2 14-2 18 0"/></svg>' },
  { key: 'wifi',       label: 'High-Speed WiFi', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"/></svg>' },
  { key: 'clinic',     label: 'Clinic / Medical',svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>' },
  { key: 'mosque',     label: 'Mosque',          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3L3 9h1v10h16V9h1L12 3Zm0 0v3m-3 6h6m-3-3v6"/></svg>' },
  { key: 'jogging',   label: 'Jogging Track',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 5.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM9 8.25l-1.5 6 3 1.5 1.5 6m4.5-13.5-1.5 6-3 1.5"/></svg>' },
  { key: 'sauna',     label: 'Sauna / Steam',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M3 6h18M3 18h18"/></svg>' },
  { key: 'sports',    label: 'Sports Court',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M12 3v18"/></svg>' },
  { key: 'yoga',      label: 'Yoga Studio',     svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0V9m0 0-4 4.5m4-4.5 4 4.5M9 18l3-4.5 3 4.5"/></svg>' },
  { key: 'lobby',     label: 'Grand Lobby',     svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>' },
  { key: 'cinema',    label: 'Cinema Room',     svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-1c0-.621.504-1.125 1.125-1.125H6M6 18.375V4.5c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v13.875m0 0c0 .621.504 1.125 1.125 1.125h1.5m0 0h.375a1.125 1.125 0 0 0 1.125-1.125V4.5a1.125 1.125 0 0 0-1.125-1.125H18M6 18.375h12"/></svg>' },
  { key: 'cowork',    label: 'Co-Working Space', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 7.409A2.25 2.25 0 0 1 3 5.493V5.25"/></svg>' },
  { key: 'golf',      label: 'Golf Course',     svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M9 21h6M12 3l6 4-6 4V3Z"/></svg>' },
  { key: 'rooftop',   label: 'Rooftop Terrace', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12 12 3l9.75 9M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"/></svg>' },
  { key: 'school',    label: 'School / Nursery', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/></svg>' },
  { key: 'smart',     label: 'Smart Home',      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"/></svg>' },
  { key: 'storage',   label: 'Storage Room',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/></svg>' },
  { key: 'laundry',   label: 'Laundry Room',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h.01"/></svg>' },
  { key: 'lobby2',    label: 'Business Lounge', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.193.163-.432.295-.69.38a39.524 39.524 0 0 1-11.62 0 2.591 2.591 0 0 1-.689-.381m0 0a2.18 2.18 0 0 1-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"/></svg>' },
];


@Component({
  selector: 'app-admin-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-master.component.html',
  styleUrl:    './admin-master.component.scss',
})
export class AdminMasterComponent {
  private dataSvc = inject(AdminDataService);

  activeTab = signal<MasterTab>('categories');

  // Live signals from service
  categories    = this.dataSvc.categories;
  propertyTypes = this.dataSvc.propTypes;
  statuses      = this.dataSvc.propStatuses;
  trendingTabs  = this.dataSvc.trendingTabs;
  locations     = this.dataSvc.locations;
  communities   = this.dataSvc.communities;
  amenities     = this.dataSvc.amenities;

  readonly amenityIconOptions = AMENITY_ICONS;

  // Form fields
  newCategory    = signal('');
  categoryError  = signal('');
  newType        = signal('');
  typeError      = signal('');
  newStatus      = signal('');
  newStatusColor = signal('#6b7280');
  statusError    = signal('');
  newTrendingTab   = signal('');
  trendingTabError = signal('');
  newLocation        = signal('');
  locationError      = signal('');
  locationSearch     = signal('');
  importingLoc       = signal(false);
  newCommunity       = signal('');
  communityError     = signal('');
  communitySearch    = signal('');
  importingCommunity = signal(false);
  newAmenityName   = signal('');
  newAmenityIcon   = signal('pool');
  amenityError     = signal('');
  saving           = signal(false);

  filteredLocations = computed(() => {
    const q = this.locationSearch().toLowerCase();
    return q ? this.locations().filter(l => l.toLowerCase().includes(q)) : this.locations();
  });

  filteredCommunities = computed(() => {
    const q = this.communitySearch().toLowerCase();
    return q ? this.communities().filter(c => c.toLowerCase().includes(q)) : this.communities();
  });

  counts = computed(() => ({
    categories:   this.categories().length,
    types:        this.propertyTypes().length,
    statuses:     this.statuses().length,
    trendingTabs: this.trendingTabs().length,
    locations:    this.locations().length,
    communities:  this.communities().length,
    amenities:    this.amenities().length,
  }));

  // ── Categories ────────────────────────────────────────
  async addCategory(): Promise<void> {
    const val = this.newCategory().trim();
    if (!val) { this.categoryError.set('Enter a category name.'); return; }
    if (this.categories().includes(val)) { this.categoryError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('category', val);
    this.saving.set(false);
    if (err) { this.categoryError.set(err); return; }
    this.newCategory.set('');
    this.categoryError.set('');
  }

  async removeCategory(cat: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('category', cat);
    if (err) this.categoryError.set('Delete failed: ' + err);
  }

  // ── Property Types ────────────────────────────────────
  async addType(): Promise<void> {
    const val = this.newType().trim();
    if (!val) { this.typeError.set('Enter a property type.'); return; }
    if (this.propertyTypes().includes(val)) { this.typeError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('property_type', val);
    this.saving.set(false);
    if (err) { this.typeError.set(err); return; }
    this.newType.set('');
    this.typeError.set('');
  }

  async removeType(t: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('property_type', t);
    if (err) this.typeError.set('Delete failed: ' + err);
  }

  // ── Statuses ──────────────────────────────────────────
  async addStatus(): Promise<void> {
    const val = this.newStatus().trim();
    if (!val) { this.statusError.set('Enter a status name.'); return; }
    if (this.statuses().find(s => s.name === val)) { this.statusError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('status', val, this.newStatusColor());
    this.saving.set(false);
    if (err) { this.statusError.set(err); return; }
    this.newStatus.set('');
    this.newStatusColor.set('#6b7280');
    this.statusError.set('');
  }

  async removeStatus(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('status', name);
    if (err) this.statusError.set('Delete failed: ' + err);
  }

  // ── Trending Tabs ─────────────────────────────────────
  async addTrendingTab(): Promise<void> {
    const val = this.newTrendingTab().trim();
    if (!val) { this.trendingTabError.set('Enter a tab name.'); return; }
    if (this.trendingTabs().includes(val)) { this.trendingTabError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('trending_tab', val);
    this.saving.set(false);
    if (err) { this.trendingTabError.set(err); return; }
    this.newTrendingTab.set('');
    this.trendingTabError.set('');
  }

  async removeTrendingTab(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('trending_tab', name);
    if (err) this.trendingTabError.set('Delete failed: ' + err);
  }

  // ── Locations ─────────────────────────────────────────
  async addLocation(): Promise<void> {
    const val = this.newLocation().trim();
    if (!val) { this.locationError.set('Enter a location name.'); return; }
    if (this.locations().includes(val)) { this.locationError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('location', val);
    this.saving.set(false);
    if (err) { this.locationError.set(err); return; }
    this.newLocation.set('');
    this.locationError.set('');
  }

  async removeLocation(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('location', name);
    if (err) this.locationError.set('Delete failed: ' + err);
  }

  exportLocationsExcel(): void {
    const rows = this.locations().map(l => ({ 'Location': l }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Locations');
    XLSX.writeFile(wb, 'livwell-locations.xlsx');
  }

  downloadSampleLocationsExcel(): void {
    const sample = [
      { 'Location': 'Downtown Dubai' }, { 'Location': 'Palm Jumeirah' },
      { 'Location': 'Dubai Marina' }, { 'Location': 'Business Bay' },
      { 'Location': 'JBR' }, { 'Location': 'Arabian Ranches' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Locations');
    XLSX.writeFile(wb, 'livwell-locations-sample.xlsx');
  }

  async importLocationsExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.importingLoc.set(true);
    this.locationError.set('');
    const buffer = await input.files[0].arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    const existing = new Set(this.locations());
    let added = 0;
    for (const r of rows) {
      const name = (r['Location'] ?? '').toString().trim();
      if (name && !existing.has(name)) {
        await this.dataSvc.addMasterItem('location', name);
        existing.add(name);
        added++;
      }
    }
    this.importingLoc.set(false);
    input.value = '';
    if (added === 0) this.locationError.set('No new locations found in the file.');
  }

  // ── Communities (Developers) ──────────────────────────
  async addCommunity(): Promise<void> {
    const val = this.newCommunity().trim();
    if (!val) { this.communityError.set('Enter a developer name.'); return; }
    if (this.communities().includes(val)) { this.communityError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('community', val);
    this.saving.set(false);
    if (err) { this.communityError.set(err); return; }
    this.newCommunity.set('');
    this.communityError.set('');
  }

  async removeCommunity(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('community', name);
    if (err) this.communityError.set('Delete failed: ' + err);
  }

  exportCommunitiesExcel(): void {
    const rows = this.communities().map(c => ({ 'Developer': c }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Developers');
    XLSX.writeFile(wb, 'livwell-developers.xlsx');
  }

  downloadSampleCommunitiesExcel(): void {
    const sample = [
      { 'Developer': 'Emaar Properties' }, { 'Developer': 'DAMAC Properties' },
      { 'Developer': 'Nakheel' }, { 'Developer': 'Meraas' },
      { 'Developer': 'Azizi Developments' }, { 'Developer': 'Binghatti' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Developers');
    XLSX.writeFile(wb, 'livwell-developers-sample.xlsx');
  }

  // ── Amenities ─────────────────────────────────────────────
  getAmenityIconSvg(key: string): string {
    return AMENITY_ICONS.find(i => i.key === key)?.svg ?? AMENITY_ICONS[0].svg;
  }
  getAmenityIconLabel(key: string): string {
    return AMENITY_ICONS.find(i => i.key === key)?.label ?? key;
  }

  async addAmenity(): Promise<void> {
    const name = this.newAmenityName().trim();
    if (!name) { this.amenityError.set('Enter an amenity name.'); return; }
    if (this.amenities().find(a => a.name === name)) { this.amenityError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('amenity', name, this.newAmenityIcon());
    this.saving.set(false);
    if (err) { this.amenityError.set(err); return; }
    this.newAmenityName.set('');
    this.newAmenityIcon.set('pool');
    this.amenityError.set('');
  }

  async removeAmenity(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('amenity', name);
    if (err) this.amenityError.set('Delete failed: ' + err);
  }

  async importCommunitiesExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.importingCommunity.set(true);
    this.communityError.set('');
    const buffer = await input.files[0].arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    const existing = new Set(this.communities());
    let added = 0;
    for (const r of rows) {
      const name = (r['Developer'] ?? '').toString().trim();
      if (name && !existing.has(name)) {
        await this.dataSvc.addMasterItem('community', name);
        existing.add(name);
        added++;
      }
    }
    this.importingCommunity.set(false);
    input.value = '';
    if (added === 0) this.communityError.set('No new developers found in the file.');
  }
}
