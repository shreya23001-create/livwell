import { Component, signal, computed, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminDataService } from '../../shared/services/admin-data.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';
import * as XLSX from 'xlsx';
import { AMENITY_ICONS } from '../../shared/constants/amenity-icons';

export { AMENITY_ICONS };

type MasterTab = 'categories' | 'property-types' | 'statuses' | 'lead-statuses' | 'trending-tabs' | 'locations' | 'communities' | 'amenities' | 'partner-logos' | 'settings';
type SettingsSubTab = 'whatsapp' | 'social' | 'smtp';



@Component({
  selector: 'app-admin-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-master.component.html',
  styleUrl: './admin-master.component.scss',
})
export class AdminMasterComponent implements OnInit {
  private dataSvc = inject(AdminDataService);
  private sanitizer = inject(DomSanitizer);
  private sb = inject(SupabaseService).client;
  private toast = inject(ToastService);

  safeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadPartnerLogos(), this.loadSettings()]);
  }

  private async loadSettings(): Promise<void> {
    const { data } = await this.sb.from('site_settings')
      .select('key, value')
      .in('key', ['whatsapp_number', 'social_links', 'smtp_config']);
    if (!data) return;
    for (const row of data) {
      if (row.key === 'whatsapp_number') {
        const val = row.value ?? '';
        this.whatsappNumber.set(val);
        this.splitWaNumber(val);
      } else if (row.key === 'social_links') {
        try { this.socialLinks.set({ ...this.socialLinks(), ...JSON.parse(row.value) }); } catch { }
      } else if (row.key === 'smtp_config') {
        try { this.smtp.set({ ...this.smtp(), ...JSON.parse(row.value) }); } catch { }
      }
    }
  }

  async saveWhatsapp(): Promise<void> {
    const local = this.waLocalNumber().replace(/\D/g, '');
    if (!local) { this.toast.error('Enter a phone number.'); return; }
    const full = '+' + this.waCountryCode() + local;
    this.whatsappNumber.set(full);
    this.whatsappSaving.set(true);
    const { error } = await this.sb.from('site_settings')
      .upsert({ key: 'whatsapp_number', value: full }, { onConflict: 'key' });
    this.whatsappSaving.set(false);
    if (error) { this.toast.error(error.message); return; }
    this.dataSvc.whatsappNumber.set(full);
    this.whatsappSaved.set(true);
    setTimeout(() => this.whatsappSaved.set(false), 2500);
  }

  async saveSocial(): Promise<void> {
    this.socialSaving.set(true);
    const { error } = await this.sb.from('site_settings')
      .upsert({ key: 'social_links', value: JSON.stringify(this.socialLinks()) }, { onConflict: 'key' });
    this.socialSaving.set(false);
    if (error) { this.toast.error(error.message); return; }
    this.dataSvc.socialLinks.set({ ...this.socialLinks() });
    this.socialSaved.set(true);
    setTimeout(() => this.socialSaved.set(false), 2500);
  }

  updateSocial(field: keyof ReturnType<typeof this.socialLinks>, value: string): void {
    this.socialLinks.update(s => ({ ...s, [field]: value }));
  }

  updateSmtp(field: keyof ReturnType<typeof this.smtp>, value: string): void {
    this.smtp.update(s => ({ ...s, [field]: value }));
  }

  async saveSmtp(): Promise<void> {
    this.smtpSaving.set(true);
    const { error } = await this.sb.from('site_settings')
      .upsert({ key: 'smtp_config', value: JSON.stringify(this.smtp()) }, { onConflict: 'key' });
    this.smtpSaving.set(false);
    if (error) { this.toast.error(error.message); return; }
    this.smtpSaved.set(true);
    setTimeout(() => this.smtpSaved.set(false), 2500);
  }

  async sendTestEmail(): Promise<void> {
    const toEmail = this.smtp().from_email || this.smtp().username;
    if (!toEmail) { this.toast.error('Set a From Email first.'); return; }
    this.smtpTesting.set(true);
    this.smtpTestMsg.set('');
    this.smtpTestOk.set(null);
    await this.saveSmtp();
    try {
      const supabaseUrl = (this.sb as any).supabaseUrl as string;
      const { data: { session } } = await this.sb.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          type: 'smtp_test',
          data: { to_email: toEmail, name: 'Admin', subject: 'SMTP Test from Livwell' },
        }),
      });
      const json = await res.json().catch(() => null);
      this.smtpTesting.set(false);
      if (res.ok || json?.sent) {
        this.smtpTestOk.set(true);
        this.smtpTestMsg.set('✓ Test email sent to ' + toEmail);
      } else {
        this.smtpTestOk.set(false);
        this.smtpTestMsg.set('Failed: ' + (json?.error ?? res.statusText));
      }
    } catch (e: any) {
      this.smtpTesting.set(false);
      this.smtpTestOk.set(false);
      this.smtpTestMsg.set('Error: ' + e.message);
    }
    setTimeout(() => { this.smtpTestMsg.set(''); this.smtpTestOk.set(null); }, 5000);
  }

  activeTab = signal<MasterTab>('categories');

  // Live signals from service
  categories = this.dataSvc.categories;
  propertyTypes = this.dataSvc.propTypes;
  statuses = this.dataSvc.propStatuses;
  leadStatuses = this.dataSvc.leadStatuses;
  trendingTabs = this.dataSvc.trendingTabs;
  locations = this.dataSvc.locations;
  communities = this.dataSvc.communities;
  amenities = this.dataSvc.amenities;

  readonly amenityIconOptions = AMENITY_ICONS;

  // Form fields
  newCategory = signal('');
  categoryError = signal('');
  newType = signal('');
  typeError = signal('');
  newStatus = signal('');
  newStatusColor = signal('#6b7280');
  statusError = signal('');
  newLeadStatus = signal('');
  newLeadStatusColor = signal('#6b7280');
  leadStatusError = signal('');
  newTrendingTab = signal('');
  trendingTabError = signal('');
  newLocation = signal('');
  locationError = signal('');
  locationSearch = signal('');
  importingLoc = signal(false);
  newCommunity = signal('');
  communityError = signal('');
  communitySearch = signal('');
  importingCommunity = signal(false);
  newAmenityName = signal('');
  newAmenityIcon = signal('');
  showIconPicker = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.master-amenity-icon-picker')) {
      this.showIconPicker.set(false);
    }
  }
  amenityError = signal('');
  saving = signal(false);

  // Settings
  settingsSubTab = signal<SettingsSubTab>('whatsapp');

  // WhatsApp
  whatsappNumber = signal('');
  waCountryCode  = signal('971');
  waLocalNumber  = signal('');
  whatsappSaving = signal(false);
  whatsappSaved  = signal(false);

  readonly countryCodeOptions: { code: string; label: string }[] = [
    { code: '971', label: '🇦🇪 +971 (UAE)' },
    { code: '966', label: '🇸🇦 +966 (KSA)' },
    { code: '974', label: '🇶🇦 +974 (Qatar)' },
    { code: '973', label: '🇧🇭 +973 (Bahrain)' },
    { code: '968', label: '🇴🇲 +968 (Oman)' },
    { code: '965', label: '🇰🇼 +965 (Kuwait)' },
    { code: '91',  label: '🇮🇳 +91 (India)' },
    { code: '44',  label: '🇬🇧 +44 (UK)' },
    { code: '1',   label: '🇺🇸 +1 (US/CA)' },
    { code: '49',  label: '🇩🇪 +49 (Germany)' },
    { code: '33',  label: '🇫🇷 +33 (France)' },
    { code: '7',   label: '🇷🇺 +7 (Russia)' },
    { code: '86',  label: '🇨🇳 +86 (China)' },
    { code: '81',  label: '🇯🇵 +81 (Japan)' },
    { code: '92',  label: '🇵🇰 +92 (Pakistan)' },
    { code: '880', label: '🇧🇩 +880 (Bangladesh)' },
    { code: '20',  label: '🇪🇬 +20 (Egypt)' },
    { code: '249', label: '🇸🇩 +249 (Sudan)' },
    { code: '212', label: '🇲🇦 +212 (Morocco)' },
    { code: '213', label: '🇩🇿 +213 (Algeria)' },
  ];

  private splitWaNumber(full: string): void {
    const digits = full.replace(/^\+/, '').replace(/\D/g, '');
    // Try longest code match first (3 digits, then 2, then 1)
    const known = this.countryCodeOptions.map(o => o.code).sort((a, b) => b.length - a.length);
    for (const code of known) {
      if (digits.startsWith(code)) {
        this.waCountryCode.set(code);
        this.waLocalNumber.set(digits.slice(code.length));
        return;
      }
    }
    // fallback: default to 971
    this.waCountryCode.set('971');
    this.waLocalNumber.set(digits);
  }

  // Social media
  socialLinks = signal({
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
  });
  socialSaving = signal(false);
  socialSaved = signal(false);

  // SMTP
  smtp = signal({
    host: '',
    port: '587',
    username: '',
    password: '',
    encryption: 'TLS',
    auth_method: 'Login',
    from_name: '',
    from_email: '',
    reply_to: '',
  });
  smtpSaving = signal(false);
  smtpSaved = signal(false);
  smtpTesting = signal(false);
  smtpTestMsg = signal('');
  smtpTestOk = signal<boolean | null>(null);
  smtpShowPass = signal(false);
  smtpGuideOpen = signal(false);

  // Partner logos
  partnerLogos = signal<{ url: string; name: string; link: string }[]>([]);
  plDragOver = signal(false);
  plUploading = signal(false);
  plSaving = signal(false);
  partnerLogoError = signal('');

  readonly presetLogos = [
    { name: 'Emaar', url: 'images/emaar.png' },
    { name: 'Binghatti', url: 'images/binghatti.png' },
    { name: 'Dubai Properties', url: 'images/dubai_property.png' },
    { name: 'DAMAC', url: 'images/damac.png' },
    { name: 'Meraas', url: 'images/meraas.png' },
    { name: 'Azizi', url: 'images/azizi.png' },
  ];

  filteredLocations = computed(() => {
    const q = this.locationSearch().toLowerCase();
    return q ? this.locations().filter(l => l.toLowerCase().includes(q)) : this.locations();
  });

  filteredCommunities = computed(() => {
    const q = this.communitySearch().toLowerCase();
    return q ? this.communities().filter(c => c.toLowerCase().includes(q)) : this.communities();
  });

  counts = computed(() => ({
    categories: this.categories().length,
    types: this.propertyTypes().length,
    statuses: this.statuses().length,
    leadStatuses: this.leadStatuses().length,
    trendingTabs: this.trendingTabs().length,
    locations: this.locations().length,
    communities: this.communities().length,
    amenities: this.amenities().length,
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

  // ── Lead Statuses ─────────────────────────────────────
  async addLeadStatus(): Promise<void> {
    const val = this.newLeadStatus().trim();
    if (!val) { this.leadStatusError.set('Enter a status name.'); return; }
    if (this.leadStatuses().find(s => s.name === val)) { this.leadStatusError.set('Already exists.'); return; }
    this.saving.set(true);
    const err = await this.dataSvc.addMasterItem('lead_status', val, this.newLeadStatusColor());
    this.saving.set(false);
    if (err) { this.leadStatusError.set(err); return; }
    this.newLeadStatus.set('');
    this.newLeadStatusColor.set('#6b7280');
    this.leadStatusError.set('');
  }

  async removeLeadStatus(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('lead_status', name);
    if (err) this.leadStatusError.set('Delete failed: ' + err);
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
    const icon = this.newAmenityIcon(); // Get the selected icon (could be empty)

    // Validate name only
    if (!name) {
      this.amenityError.set('Enter an amenity name.');
      return;
    }

    // Check for duplicates
    if (this.amenities().find(a => a.name === name)) {
      this.amenityError.set('Already exists.');
      return;
    }

    this.saving.set(true);
    // Pass the icon (could be empty string or null)
    const err = await this.dataSvc.addMasterItem('amenity', name, icon || '');
    this.saving.set(false);

    if (err) {
      this.amenityError.set(err);
      return;
    }

    // Reset form - set to empty string (no default icon)
    this.newAmenityName.set('');
    this.newAmenityIcon.set(''); // ← Empty string, no default
    this.amenityError.set('');
  }

  async removeAmenity(name: string): Promise<void> {
    const err = await this.dataSvc.removeMasterItem('amenity', name);
    if (err) this.amenityError.set('Delete failed: ' + err);
  }

  // ── Partner Logos ──────────────────────────────────────────────
  private async loadPartnerLogos(): Promise<void> {
    const { data } = await this.sb
      .from('site_settings').select('value').eq('key', 'partner_logos').maybeSingle();
    if (data?.value) {
      try { this.partnerLogos.set(JSON.parse(data.value)); } catch { }
    }
  }

  onPartnerLogoDrop(e: DragEvent): void {
    e.preventDefault();
    this.plDragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.uploadPartnerLogo(file);
  }

  onPartnerLogoFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadPartnerLogo(file);
    (e.target as HTMLInputElement).value = '';
  }

  private async uploadPartnerLogo(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) { this.partnerLogoError.set('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { this.partnerLogoError.set('Image must be under 5 MB.'); return; }
    this.partnerLogoError.set('');
    this.plUploading.set(true);
    const ext = file.name.split('.').pop();
    const path = `partners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (error) { this.partnerLogoError.set('Upload failed: ' + error.message); this.plUploading.set(false); return; }
    const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    this.partnerLogos.update(list => [...list, { url: pub.publicUrl, name, link: '' }]);
    this.plUploading.set(false);
  }

  addPresetLogo(preset: { url: string; name: string }): void {
    if (this.partnerLogos().some(l => l.url === preset.url)) {
      this.partnerLogoError.set(`"${preset.name}" is already in the list.`);
      return;
    }
    this.partnerLogoError.set('');
    this.partnerLogos.update(list => [...list, { ...preset, link: '' }]);
  }

  updatePartnerLogoName(index: number, name: string): void {
    this.partnerLogos.update(list => list.map((l, i) => i === index ? { ...l, name } : l));
  }

  updatePartnerLogoLink(index: number, link: string): void {
    this.partnerLogos.update(list => list.map((l, i) => i === index ? { ...l, link } : l));
  }

  removePartnerLogo(index: number): void {
    this.partnerLogos.update(list => list.filter((_, i) => i !== index));
  }

  movePartnerLogo(index: number, dir: -1 | 1): void {
    const list = [...this.partnerLogos()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.partnerLogos.set(list);
  }

  async savePartnerLogos(): Promise<void> {
    this.plSaving.set(true);
    const value = JSON.stringify(this.partnerLogos());
    const { error } = await this.sb
      .from('site_settings')
      .upsert({ key: 'partner_logos', value }, { onConflict: 'key' });
    if (error) this.toast.error(error.message);
    else this.toast.success('Partner logos saved.');
    this.plSaving.set(false);
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
