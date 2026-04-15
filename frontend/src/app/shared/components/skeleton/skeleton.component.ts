import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-elevated rounded animate-pulse" [ngStyle]="{'width': width, 'height': height}"></div>
  `,
  styles: []
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '20px';
}
