import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 w-full flex justify-center items-center">
      <div class="glow-card glass p-10 w-full max-w-[420px] flex flex-col gap-10 shadow-[0_0_50px_rgba(110,110,255,0.1)]">
        <div class="flex flex-col items-center text-center gap-3">
          <div class="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(110,110,255,0.3)] border border-accent/30">
            <span class="w-5 h-5 bg-accent rounded-sm rotate-45 shadow-[0_0_15px_rgba(110,110,255,0.8)]"></span>
          </div>
          <h1 class="m-0 text-4xl font-mono font-bold tracking-tight text-text-primary drop-shadow-sm">LoadForge</h1>
          <p class="m-0 text-text-secondary text-sm max-w-[300px] leading-relaxed font-medium">Industrial-grade API load testing for high-performance engineering teams.</p>
        </div>

        <div class="flex flex-col gap-4">
          <button class="flex items-center justify-center gap-3 bg-elevated border border-border-default text-text-primary w-full py-3.5 rounded-lg cursor-pointer text-sm font-medium transition-all hover:bg-border-default hover:border-border-strong active:scale-[0.98]" (click)="loginWithGoogle()">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div class="flex items-center text-center text-text-muted text-[11px] uppercase tracking-widest before:flex-1 before:border-b before:border-border-default after:flex-1 after:border-b after:border-border-default">
            <span class="px-4">Secure Authentication</span>
          </div>

          <button class="flex items-center justify-center gap-3 bg-elevated border border-border-default text-text-primary w-full py-3.5 rounded-lg cursor-pointer text-sm font-medium transition-all hover:bg-border-default hover:border-border-strong active:scale-[0.98]" (click)="loginWithGithub()">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12 0C5.37 0 0 5.42 0 12.13c0 5.36 3.44 9.9 8.2 11.51.6.11.82-.26.82-.58 0-.29-.01-1.06-.02-2.07-3.34.73-4.04-1.63-4.04-1.63-.55-1.41-1.33-1.78-1.33-1.78-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.25 1.83 1.25 1.07 1.83 2.8 1.3 3.49 1 .1-.78.41-1.3.75-1.6-2.66-.3-5.46-1.34-5.46-5.99 0-1.32.47-2.4 1.23-3.24-.12-.3-.54-1.54.12-3.2 0 0 1.01-.33 3.3 1.24a11.3 11.3 0 0 1 3-.41c1.02.01 2.04.14 3-.41 2.29-1.57 3.29-1.24 3.29-1.24.66 1.66.24 2.9.12 3.2.77.84 1.23 1.92 1.23 3.24 0 4.66-2.81 5.68-5.49 5.98.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.22 0 .32.22.7.83.58C20.57 22.03 24 17.5 24 12.13 24 5.42 18.63 0 12 0z"/></svg>
            Continue with GitHub
          </button>
        </div>

        <div class="text-[11px] text-text-muted text-center leading-relaxed">
          By continuing, you agree to our Terms of Service.<br>
          Only test APIs you have explicit permission to access.
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  authService = inject(AuthService);

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  loginWithGithub() {
    this.authService.loginWithGithub();
  }
}
