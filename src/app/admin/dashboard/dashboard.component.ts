import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {

  readonly today = new Date();

  readonly kpis = [
    { label: 'Total Properties', value: '248', change: '+12', up: true, icon: 'home', color: 'blue' },
    { label: 'Active Leads', value: '1,284', change: '+84', up: true, icon: 'leads', color: 'gold' },
    { label: 'Active Agents', value: '32', change: '-2', up: false, icon: 'agents', color: 'green' },
    { label: 'Revenue (AED)', value: '4.2M', change: '+8.3%', up: true, icon: 'revenue', color: 'purple' },
  ];

  readonly revenueMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  readonly revenueValues = [280000, 310000, 295000, 420000, 380000, 510000, 490000, 620000, 580000, 710000, 680000, 750000];

  readonly leadSources = [
    { label: 'Website', pct: 38, color: '#6366f1' },
    { label: 'WhatsApp', pct: 27, color: '#6366f1' },
    { label: 'Referral', pct: 18, color: '#3b82f6' },
    { label: 'Social Media', pct: 11, color: '#8b5cf6' },
    { label: 'Other', pct: 6, color: '#9ca3af' },
  ];

  readonly recentLeads = [
    { name: 'Mohammed Al-Rashidi', email: 'mo.rashidi@gmail.com', property: 'Binghatti Zenith', status: 'New', time: '5 min ago', avatar: 'M' },
    { name: 'Sarah Williams', email: 'sarah.w@hotmail.com', property: 'Emaar Skyrise', status: 'Contacted', time: '22 min ago', avatar: 'S' },
    { name: 'Raj Patel', email: 'raj.patel@yahoo.com', property: 'Nakheel Gardens', status: 'Qualified', time: '1 hr ago', avatar: 'R' },
    { name: 'Fatima Al-Zahra', email: 'fatima.z@gmail.com', property: 'Creek Horizon', status: 'New', time: '2 hr ago', avatar: 'F' },
    { name: 'James Chen', email: 'j.chen@outlook.com', property: 'Sobha Seahaven', status: 'Qualified', time: '3 hr ago', avatar: 'J' },
  ];

  readonly recentProperties = [
    { title: 'Luxury Penthouse with Burj View', community: 'Downtown Dubai', type: 'Penthouse', status: 'Sale', price: 'AED 4.5M', badge: 'Featured' },
    { title: 'Modern Villa with Private Pool', community: 'Palm Jumeirah', type: 'Villa', status: 'Sale', price: 'AED 8.2M', badge: 'Hot' },
    { title: 'Marina View 1BR Apartment', community: 'Dubai Marina', type: 'Apartment', status: 'Rent', price: 'AED 85K/yr', badge: '' },
    { title: 'Sky View Studio Business Bay', community: 'Business Bay', type: 'Apartment', status: 'Sale', price: 'AED 980K', badge: 'Reduced' },
    { title: '2BR Apartment JVC with Pool', community: 'JVC', type: 'Apartment', status: 'Sale', price: 'AED 1.35M', badge: '' },
  ];

  readonly activity = [
    { text: 'New lead from Mohammed Al-Rashidi for Binghatti Zenith', time: '5 min ago', type: 'lead' },
    { text: 'Property "Luxury Penthouse" marked as Featured', time: '18 min ago', type: 'property' },
    { text: 'Agent Sarah Al-Mansouri closed deal — AED 4.5M', time: '1 hr ago', type: 'deal' },
    { text: 'New user registered: raj.patel@yahoo.com', time: '2 hr ago', type: 'user' },
    { text: 'Off-plan project "Emaar Skyrise" published', time: '3 hr ago', type: 'property' },
    { text: 'Lead status updated: Fatima Al-Zahra → Qualified', time: '4 hr ago', type: 'lead' },
    { text: 'Agent Ahmed Hassan updated 3 listings', time: '5 hr ago', type: 'property' },
  ];

  readonly topAgents = [
    { name: 'Sarah Al-Mansouri', deals: 14, revenue: 'AED 24.5M', avatar: 'S', rank: 1 },
    { name: 'Ahmed Hassan', deals: 11, revenue: 'AED 18.2M', avatar: 'A', rank: 2 },
    { name: 'Priya Sharma', deals: 9, revenue: 'AED 14.8M', avatar: 'P', rank: 3 },
    { name: 'Michael Chen', deals: 7, revenue: 'AED 11.4M', avatar: 'M', rank: 4 },
  ];

  getRevenueBarHeight(val: number): number {
    return Math.round((val / Math.max(...this.revenueValues)) * 100);
  }

  getLeadSourceOffset(index: number): number {
    const r = 40;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (this.leadSources[i].pct / 100) * circ;
    }
    return -offset;
  }

  getLeadSourceDash(pct: number): string {
    const r = 40;
    const circ = 2 * Math.PI * r;
    return `${(pct / 100) * circ} ${circ}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'New': return 'status--new';
      case 'Contacted': return 'status--contacted';
      case 'Qualified': return 'status--qualified';
      case 'Lost': return 'status--lost';
      default: return '';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'lead': return '#6366f1';
      case 'deal': return '#6366f1';
      case 'user': return '#3b82f6';
      default: return '#6b7280';
    }
  }
}
