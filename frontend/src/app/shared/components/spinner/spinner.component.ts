import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-full border-solid border-white/10 border-t-accent animate-spin-fast" 
         [ngClass]="{
           'w-4 h-4 border-2': size === 'sm',
           'w-6 h-6 border-2': size === 'md',
           'w-10 h-10 border-[3px]': size === 'lg'
         }"></div>
  `,
  styles: []
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
