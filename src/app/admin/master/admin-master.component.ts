import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../shared/services/admin-data.service';

type MasterTab = 'categories' | 'property-types' | 'statuses';

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

  // Form fields
  newCategory    = signal('');
  categoryError  = signal('');
  newType        = signal('');
  typeError      = signal('');
  newStatus      = signal('');
  newStatusColor = signal('#6b7280');
  statusError    = signal('');
  saving         = signal(false);

  counts = computed(() => ({
    categories: this.categories().length,
    types:      this.propertyTypes().length,
    statuses:   this.statuses().length,
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
}
