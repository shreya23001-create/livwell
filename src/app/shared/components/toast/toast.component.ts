import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast--{{ t.type }}" (click)="toast.dismiss(t.id)">
          <span class="toast-icon">
            @if (t.type === 'success') { ✓ }
            @else if (t.type === 'error') { ✕ }
            @else if (t.type === 'warning') { ⚠ }
            @else { ℹ }
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="toast.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      max-width: 360px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      border-radius: 0.625rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      pointer-events: all;
      cursor: pointer;
      animation: toast-in 0.22s ease;
      line-height: 1.4;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(60px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .toast--success { background: #10b981; }
    .toast--error   { background: #ef4444; }
    .toast--warning { background: #f59e0b; }
    .toast--info    { background: #6366f1; }
    .toast-icon { font-size: 1rem; flex-shrink: 0; font-style: normal; }
    .toast-msg  { flex: 1; }
    .toast-close {
      background: none; border: none; color: rgba(255,255,255,0.8);
      font-size: 1.1rem; cursor: pointer; padding: 0; line-height: 1;
      flex-shrink: 0;
      &:hover { color: #fff; }
    }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
}
