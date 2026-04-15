import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RateLimitService {
  remaining = signal<number | null>(null);
  limit = signal<number>(10);

  updateFromHeaders(headers: any) {
    if (headers.has('X-RateLimit-Remaining')) {
       this.remaining.set(parseInt(headers.get('X-RateLimit-Remaining')!, 10));
    }
  }
}
