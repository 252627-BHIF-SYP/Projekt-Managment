import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

/**
 * Factory function to initialize Keycloak
 */
export function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
  return () => {
    return keycloak.init({
      config: {
        url: environment.keycloakUrl,
        realm: environment.keycloakRealm,
        clientId: environment.keycloakClientId
      },
      initOptions: {
        checkLoginIframe: false,
        silentCheckSsoFallback: false,
        flow: 'standard',
        responseMode: 'query',
        pkceMethod: 'S256',
        useNonce: false,
        enableLogging: false
      },
      loadUserProfileAtStartUp: false,
      enableBearerInterceptor: false
    }).then(() => {
      return true;
    }).catch(() => {
      // Prevent endless callback loop on failed code/state processing
      if (window.location.search.includes('code=') || window.location.search.includes('state=')) {
        window.history.replaceState({}, document.title, '/login');
      }
      return true;
    });
  };
}
