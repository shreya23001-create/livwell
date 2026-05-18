import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex h-screen bg-gray-50">
      <aside class="w-64 bg-dark-900 text-white flex flex-col" style="background:#111827">
        <div class="p-6 border-b border-white/10">
          <h2 class="font-display text-xl text-white">Agent Portal</h2>
          <p class="text-xs text-white/40 mt-1">Livwell Real Estate</p>
        </div>
        <nav class="flex-1 p-4 space-y-1">
          <a routerLink="/agent/dashboard" routerLinkActive="bg-primary-700"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium">
            Dashboard
          </a>
          <a routerLink="/agent/leads" routerLinkActive="bg-primary-700"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium">
            My Leads
          </a>
          <a routerLink="/agent/customers" routerLinkActive="bg-primary-700"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium">
            Customers
          </a>
          <a routerLink="/agent/properties" routerLinkActive="bg-primary-700"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium">
            My Properties
          </a>
        </nav>
        <div class="p-4 border-t border-white/10">
          <button (click)="auth.logout()" class="w-full text-left px-4 py-2 text-white/50 hover:text-white text-sm transition-colors">
            Logout
          </button>
        </div>
      </aside>
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AgentLayoutComponent {
  constructor(public auth: AuthService) {}
}
