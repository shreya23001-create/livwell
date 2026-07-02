import { Component, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminDataService } from '../../shared/services/admin-data.service';
import * as XLSX from 'xlsx';
import { AMENITY_ICONS } from '../../shared/constants/amenity-icons';

export { AMENITY_ICONS };

type MasterTab = 'categories' | 'property-types' | 'statuses' | 'trending-tabs' | 'locations' | 'communities' | 'amenities';



@Component({
  selector: 'app-admin-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-master.component.html',
  styleUrl:    './admin-master.component.scss',
})
export class AdminMasterComponent {
  private dataSvc   = inject(AdminDataService);
  private sanitizer = inject(DomSanitizer);

  safeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

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
  newAmenityIcon   = signal('');
  showIconPicker   = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.master-amenity-icon-picker')) {
      this.showIconPicker.set(false);
    }
  }
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
