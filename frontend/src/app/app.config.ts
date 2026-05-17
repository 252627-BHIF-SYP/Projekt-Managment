import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { KeycloakService } from 'keycloak-angular';

import { routes } from './app.routes';
import { initializeKeycloak } from './core/init/keycloak-init.factory';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Application configuration (Angular 20, Zoneless, Signals).
 * Keycloak is initialized on bootstrap via provideAppInitializer.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    KeycloakService,
    provideAppInitializer(() => {
      const keycloak = inject(KeycloakService);
      return initializeKeycloak(keycloak)();
    })
  ]
};
