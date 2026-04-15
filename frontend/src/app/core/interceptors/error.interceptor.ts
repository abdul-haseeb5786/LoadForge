import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      } else if (error.status === 429) {
        toastService.show('warning', 'Rate limit exceeded. Try again in an hour.');
      } else if (error.status >= 500) {
        toastService.show('error', 'Server error. Please try again.');
      } else if (error.status === 0) {
        toastService.show('error', 'Cannot connect to server.');
      }
      return throwError(() => error);
    })
  );
};
