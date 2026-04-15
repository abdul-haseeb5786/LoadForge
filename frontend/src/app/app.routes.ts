import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/callback', loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.CallbackComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'history', canActivate: [authGuard], loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent) },
  { path: 'test-detail/:id', canActivate: [authGuard], loadComponent: () => import('./features/test-detail/test-detail.component').then(m => m.TestDetailComponent) },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
