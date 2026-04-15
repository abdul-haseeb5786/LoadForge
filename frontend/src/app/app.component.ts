import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent, SpinnerComponent, CommonModule],
  template: `
    <ng-container *ngIf="isChecking; else appContent">
       <div class="fixed inset-0 bg-bg-base flex items-center justify-center z-[9999]">
          <app-spinner size="lg"></app-spinner>
       </div>
    </ng-container>
    
    <ng-template #appContent>
      <app-navbar *ngIf="!isAuthPage"></app-navbar>
      <app-toast></app-toast>
      <main 
        class="min-h-screen w-full overflow-x-hidden transition-all duration-300" 
        [ngClass]="{
          'pt-[52px]': !isAuthPage,
          'grid place-items-center': isAuthPage
        }"
      >
         <router-outlet></router-outlet>
      </main>
    </ng-template>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
  `]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  isChecking = true;
  isAuthPage = false;
  
  ngOnInit() {
    this.authService.checkAuthStatus().subscribe({
      next: () => this.isChecking = false,
      error: () => this.isChecking = false
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAuthPage = ['/login', '/auth/callback'].some(path => event.urlAfterRedirects.startsWith(path));
    });
  }
}
