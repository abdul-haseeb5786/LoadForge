import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { rateLimitInterceptor } from './core/interceptors/rate-limit.interceptor';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, rateLimitInterceptor])),
    importProvidersFrom(CoreModule, SharedModule),
    provideAngularQuery(new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          retry: 2
        }
      }
    }))
  ]
};
