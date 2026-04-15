import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100]">
      <div class="bg-surface border border-border-default rounded-[10px] p-8 max-w-[420px] text-center">
        <h2 class="m-0 mb-3 font-mono text-xl text-text-primary">{{ title }}</h2>
        <p class="text-sm text-text-secondary m-0 mb-6 leading-relaxed">{{ message }}</p>
        <div class="flex gap-3 justify-center">
          <button class="ghost-btn" (click)="onCancel()">{{ cancelText }}</button>
          <button class="bg-error border-none text-white px-4 py-2 rounded-md cursor-pointer text-[13px] font-sans hover:bg-error/90 transition-colors" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ConfirmationModalComponent {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Output() confirmed = new EventEmitter<boolean>();

  onConfirm() { this.confirmed.emit(true); }
  onCancel()  { this.confirmed.emit(false); }
}
