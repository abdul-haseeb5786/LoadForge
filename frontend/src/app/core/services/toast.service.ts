import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string) {
    const id = Math.random().toString(36).substr(2, 9);
    this.toasts.update(t => [...t, { id, type, message }]);
    
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
  }
  
  remove(id: string) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
