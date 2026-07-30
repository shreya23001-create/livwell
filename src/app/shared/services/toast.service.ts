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

  private add(type: ToastType, message: string): void {
    const id = ++_id;
    this.toasts.update(list => [...list, { id, type, message }]);
  }

  success(message: string): void { this.add('success', message); }
  error(message: string): void   { this.add('error',   message); }
  info(message: string): void    { this.add('info',    message); }
  warning(message: string): void { this.add('warning', message); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
