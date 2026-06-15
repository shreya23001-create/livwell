import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let _id = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  private add(type: ToastType, message: string, duration = 3500): void {
    const id = ++_id;
    this.toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration?: number): void { this.add('success', message, duration); }
  error(message: string, duration?: number): void   { this.add('error',   message, duration ?? 5000); }
  info(message: string, duration?: number): void    { this.add('info',    message, duration); }
  warning(message: string, duration?: number): void { this.add('warning', message, duration); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
