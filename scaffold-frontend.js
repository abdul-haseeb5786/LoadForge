const fs = require('fs');
const path = require('path');

const writeFileSync = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log('Created:', filePath);
};

// ---------------------------------------------
// Frontend Environments
// ---------------------------------------------
writeFileSync('frontend/src/environments/environment.ts', `
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
`);

writeFileSync('frontend/src/environments/environment.prod.ts', `
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
};
`);

// ---------------------------------------------
// Frontend App Config & Main Bootstrapping
// ---------------------------------------------
writeFileSync('frontend/src/app/app.routes.ts', `
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'history', canActivate: [authGuard], loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent) },
  { path: 'test-detail/:id', canActivate: [authGuard], loadComponent: () => import('./features/test-detail/test-detail.component').then(m => m.TestDetailComponent) }
];
`);

writeFileSync('frontend/src/app/app.config.ts', `
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    importProvidersFrom(CoreModule, SharedModule)
  ]
};
`);

writeFileSync('frontend/src/app/app.component.ts', `
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: \`
    <app-navbar></app-navbar>
    <div class="container mx-auto p-4">
      <router-outlet></router-outlet>
    </div>
  \`,
  styles: []
})
export class AppComponent {
  title = 'loadforge-frontend';
}
`);

// ---------------------------------------------
// Core Services, Interceptors & Guards
// ---------------------------------------------
writeFileSync('frontend/src/app/core/services/storage.service.ts', `
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  clearToken() {
    localStorage.removeItem('auth_token');
  }
}
`);

writeFileSync('frontend/src/app/core/services/auth.service.ts', `
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  login(credentials: any) {
    return this.http.post<any>(\`\${environment.apiUrl}/auth/login\`, credentials).pipe(
      tap(res => this.storage.setToken(res.access_token))
    );
  }

  logout() {
    this.storage.clearToken();
  }

  isLoggedIn(): boolean {
    return !!this.storage.getToken();
  }
}
`);

writeFileSync('frontend/src/app/core/guards/auth.guard.ts', `
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }
  return router.parseUrl('/login');
};
`);

writeFileSync('frontend/src/app/core/interceptors/auth.interceptor.ts', `
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const token = storage.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: \`Bearer \${token}\`
      }
    });
  }
  return next(req);
};
`);

writeFileSync('frontend/src/app/core/interceptors/error.interceptor.ts', `
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
`);

writeFileSync('frontend/src/app/core/core.module.ts', `
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
})
export class CoreModule {}
`);

// ---------------------------------------------
// Shared Module & Components
// ---------------------------------------------
writeFileSync('frontend/src/app/shared/components/navbar/navbar.component.ts', `
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: \`
    <nav class="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div class="font-bold text-xl">LoadForge</div>
      <div *ngIf="isLoggedIn()">
        <a routerLink="/dashboard" class="mr-4">Dashboard</a>
        <a routerLink="/history" class="mr-4">History</a>
        <button (click)="logout()" class="bg-red-500 px-3 py-1 rounded">Logout</button>
      </div>
    </nav>
  \`
})
export class NavbarComponent {
  authService = inject(AuthService);
  
  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  logout() {
    this.authService.logout();
  }
}
`);

writeFileSync('frontend/src/app/shared/components/spinner/spinner.component.ts', `
import { Component } from '@angular/core';
@Component({ selector: 'app-spinner', standalone: true, template: '<div class="loader">Loading...</div>' })
export class SpinnerComponent {}
`);

writeFileSync('frontend/src/app/shared/components/toast/toast.component.ts', `
import { Component } from '@angular/core';
@Component({ selector: 'app-toast', standalone: true, template: '<div class="toast">Toast Message</div>' })
export class ToastComponent {}
`);

writeFileSync('frontend/src/app/shared/components/modal/modal.component.ts', `
import { Component } from '@angular/core';
@Component({ selector: 'app-modal', standalone: true, template: '<div class="modal">Modal Content</div>' })
export class ModalComponent {}
`);

writeFileSync('frontend/src/app/shared/shared.module.ts', `
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  // Exporting is obsolete with standalone components but maintained as per requested structure
})
export class SharedModule {}
`);

// ---------------------------------------------
// Features
// ---------------------------------------------
writeFileSync('frontend/src/app/features/auth/login/login.component.ts', `
import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe],
  template: \`
    <div class="flex flex-col max-w-md mx-auto mt-10 p-6 shadow-md border rounded">
      <h2 class="text-2xl mb-4">Login</h2>
      <input [(ngModel)]="email" placeholder="Email" class="mb-2 p-2 border">
      <input [(ngModel)]="password" type="password" placeholder="Password" class="mb-4 p-2 border">
      <button (click)="login()" class="bg-blue-500 text-white p-2 rounded">Login</button>
    </div>
  \`
})
export class LoginComponent {
  email = '';
  password = '';
  auth = inject(AuthService);
  router = inject(Router);

  login() {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => console.error(err)
    });
  }
}
`);

writeFileSync('frontend/src/app/features/auth/register/register.component.ts', `
import { Component } from '@angular/core';
@Component({ selector: 'app-register', standalone: true, template: '<h2>Register</h2>' })
export class RegisterComponent {}
`);

writeFileSync('frontend/src/app/features/dashboard/dashboard.component.ts', `
import { Component } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
// import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: \`
    <h2 class="text-2xl mt-4">Dashboard</h2>
    <p>Welcome to LoadForge. Manage your tests here.</p>
  \`
})
export class DashboardComponent {
}
`);

writeFileSync('frontend/src/app/features/history/history.component.ts', `
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({ selector: 'app-history', standalone: true, imports: [FormsModule], template: '<h2>History</h2>' })
export class HistoryComponent {}
`);

writeFileSync('frontend/src/app/features/test-detail/test-detail.component.ts', `
import { Component } from '@angular/core';
@Component({ selector: 'app-test-detail', standalone: true, template: '<h2>Test Detail</h2>' })
export class TestDetailComponent {}
`);
