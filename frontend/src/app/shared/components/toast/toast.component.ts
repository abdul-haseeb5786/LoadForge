import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 flex flex-col gap-2 z-[9999]">
      <div *ngFor="let toast of toastService.toasts()" class="flex items-center px-4 py-3 rounded-lg min-w-[280px] max-w-[360px] bg-surface text-text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-transparent border-l-4 transition-all duration-300 animate-[slideInFade_0.3s_ease-out_forwards]" [ngClass]="{'border-l-success border-success text-success': toast.type === 'success', 'border-l-error border-error text-error': toast.type === 'error', 'border-l-accent border-accent text-accent': toast.type === 'info'}">
        <div class="mr-3 text-base">
          <ng-container [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">✓</span>
            <span *ngSwitchCase="'error'">✗</span>
            <span *ngSwitchCase="'warning'">⚠️</span>
            <span *ngSwitchCase="'info'">ℹ️</span>
          </ng-container>
        </div>
        <div class="flex-1 text-[13px] font-sans text-text-primary">{{ toast.message }}</div>
        <button class="bg-transparent border-none text-text-muted cursor-pointer text-base px-1 hover:text-text-primary" (click)="toastService.remove(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideInFade {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
