import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { map, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  loginWithGoogle() {
    window.location.href = `${environment.apiUrl}/api/auth/google`;
  }

  loginWithGithub() {
    window.location.href = `${environment.apiUrl}/api/auth/github`;
  }

  handleCallback(token: string) {
    if (token) {
      localStorage.setItem('auth_token', token);
    }
  }

  checkAuthStatus(): Observable<boolean> {
    if (!this.getToken()) return of(false);
    return this.http.get(`${environment.apiUrl}/api/auth/me`).pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  getCurrentUser() {
    return this.http.get(`${environment.apiUrl}/api/auth/me`);
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
