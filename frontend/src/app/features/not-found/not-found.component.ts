import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid min-h-screen place-items-center bg-bg-base p-6 page-container">
      <div class="text-center animate-fadeSlideUp">
        <h1 class="m-0 text-[120px] font-mono font-bold text-accent leading-none select-none opacity-20">404</h1>
        <div class="relative -mt-16">
          <h2 class="text-3xl font-bold text-text-primary mb-3">Gateway Timeout</h2>
          <p class="text-text-secondary max-w-sm mx-auto mb-10 leading-relaxed">
            The resource you are looking for has been purged or never existed in this cluster.
          </p>
          <button class="primary-btn !w-auto !px-8" (click)="router.navigate(['/dashboard'])">
            Return to Command Center
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotFoundComponent {
  router = inject(Router);
}
