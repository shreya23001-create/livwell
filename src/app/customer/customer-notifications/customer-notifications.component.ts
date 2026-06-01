import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notif-wrap">

      <!-- I am -->
      <div class="notif-section">
        <div class="notif-row">
          <span class="notif-label">I am</span>
          <div class="notif-checks">
            @for (role of roles; track role) {
              <label class="notif-check-item">
                <input type="checkbox" [(ngModel)]="selectedRoles[role]" />
                {{ role }}
              </label>
            }
          </div>
        </div>
      </div>

      <div class="notif-divider"></div>

      <!-- Notifications -->
      <div class="notif-section">
        <div class="notif-row">
          <span class="notif-label">Notifications</span>
          <div class="notif-checks">
            @for (n of notifOptions; track n) {
              <label class="notif-check-item">
                <input type="checkbox" [(ngModel)]="selectedNotifs[n]" />
                {{ n }}
              </label>
            }
          </div>
        </div>
      </div>

      <div class="notif-actions">
        <button class="notif-save-btn" (click)="save()">Save Preferences</button>
        @if (saved()) {
          <span class="notif-saved-msg">Saved successfully.</span>
        }
      </div>

    </div>
  `,
  styles: [`
    .notif-wrap { max-width: 860px; padding: 1.5rem 2rem; }
    .notif-section { padding: 1.5rem 0; }
    .notif-row { display: flex; gap: 3rem; align-items: flex-start; }
    .notif-label { min-width: 120px; font-size: 0.9rem; color: #374151; font-weight: 500; padding-top: 0.2rem; }
    .notif-checks { display: flex; flex-direction: column; gap: 0.65rem; }
    .notif-check-item {
      display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem; color: #111827; cursor: pointer;
      input[type=checkbox] { width: 16px; height: 16px; accent-color: #1a5c3a; cursor: pointer; }
    }
    .notif-divider { height: 1px; background: #e5e7eb; }
    .notif-actions { margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    .notif-save-btn { padding: 0.6rem 1.5rem; background: #1a5c3a; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; &:hover { background: #154d31; } }
    .notif-saved-msg { font-size: 0.85rem; color: #16a34a; }
  `]
})
export class CustomerNotificationsComponent {
  roles = [
    'Buyer', 'Seller', 'Landlord', 'Tenant', 'Landlord Rep',
    'Real Estate Agent', 'Real Estate Developer', 'Real-estate agency', 'POA Holder'
  ];

  notifOptions = [
    'Property Tech Tools',
    'Sales Transactions In Dubai Land Dept',
    'Distressed Sale',
    'Offers Notification',
    'New Project Launch Notification',
    'Project Construction Progress Notification',
    'Project Handover/Completion Notification',
    'Real Estate Market Update',
    'I Am Not Interested. Do Not Send Me Any Kind Of Notification.',
  ];

  selectedRoles: Record<string, boolean> = {};
  selectedNotifs: Record<string, boolean> = {};
  saved = signal(false);

  save(): void {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}
