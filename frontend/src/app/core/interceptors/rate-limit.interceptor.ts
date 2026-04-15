import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { RateLimitService } from '../services/rate-limit.service';

export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const rateLimitService = inject(RateLimitService);
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        rateLimitService.updateFromHeaders(event.headers);
      }
    })
  );
};
