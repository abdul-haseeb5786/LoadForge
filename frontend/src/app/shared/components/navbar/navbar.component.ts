import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TestApiService } from '../../../core/services/test-api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="h-[52px] bg-bg-base/80 backdrop-blur-md border-b border-border-default sticky top-0 z-[100] px-6 flex justify-between items-center">
      <div class="flex items-center">
        <div class="w-2 h-2 bg-accent rounded-sm mr-2"></div>
        <div class="font-mono text-base text-text-primary">LoadForge</div>
      </div>

      <div class="hidden md:flex gap-6 items-center h-full" *ngIf="authService.isAuthenticated()">
        <a routerLink="/dashboard" routerLinkActive="!text-text-primary border-b-2 border-accent" class="font-sans text-[13px] text-text-secondary no-underline transition-colors duration-150 py-4 h-full flex items-center box-border hover:text-text-primary border-b-2 border-transparent">Dashboard</a>
        <a routerLink="/history" routerLinkActive="!text-text-primary border-b-2 border-accent" class="font-sans text-[13px] text-text-secondary no-underline transition-colors duration-150 py-4 h-full flex items-center box-border hover:text-text-primary border-b-2 border-transparent">History</a>
      </div>

      <div class="hidden md:flex items-center gap-4" *ngIf="authService.isAuthenticated()">
        <div class="bg-elevated border border-border-default rounded-md px-2.5 py-1 font-mono text-[11px] text-text-secondary" *ngIf="limits()">
          {{ limits()?.remaining }}/{{ limits()?.limit }} tests
        </div>
        
        <div class="w-7 h-7 rounded-full border border-border-default bg-elevated flex items-center justify-center text-[11px] text-text-primary uppercase font-sans">
           {{ getInitials() }}
        </div>
        
        <button class="bg-transparent border-none text-text-secondary cursor-pointer transition-colors duration-150 p-1 flex items-center hover:text-error" (click)="authService.logout()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>

      <button class="md:hidden bg-transparent border-none text-text-primary text-xl cursor-pointer" *ngIf="authService.isAuthenticated()" (click)="menuOpen = !menuOpen">☰</button>
    </nav>

    <div class="absolute top-[52px] left-0 right-0 bg-surface border-b border-border-default px-6 py-4 flex flex-col gap-4 z-[99] md:hidden" *ngIf="menuOpen && authService.isAuthenticated()">
       <a routerLink="/dashboard" (click)="menuOpen = false" routerLinkActive="!text-text-primary font-medium" class="font-sans text-[13px] text-text-secondary no-underline hover:text-text-primary">Dashboard</a>
       <a routerLink="/history" (click)="menuOpen = false" routerLinkActive="!text-text-primary font-medium" class="font-sans text-[13px] text-text-secondary no-underline hover:text-text-primary">History</a>
       <div class="h-px bg-border-default my-2"></div>
       <button class="bg-transparent border-none text-error text-left p-0 cursor-pointer text-[13px]" (click)="authService.logout()">Logout</button>
    </div>
  `,
  styles: []
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  api = inject(TestApiService);
  limits = signal<any>(null);
  menuOpen = false;

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.api.getLimits().subscribe(res => this.limits.set(res));
    }
  }

  getInitials() {
    const user: any = this.authService.getCurrentUser();
    return user && user.name ? user.name.substring(0, 2) : 'US';
  }
}
