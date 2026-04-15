import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center h-screen text-text-primary page-container">
      <div class="w-10 h-10 border-[3px] border-border-default border-t-accent rounded-full animate-spin-fast mb-4"></div>
      <p>Authenticating...</p>
    </div>
  `,
  styles: []
})
export class CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.handleCallback(token);
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
