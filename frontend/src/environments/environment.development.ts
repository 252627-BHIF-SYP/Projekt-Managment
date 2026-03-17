/**
 * Development environment configuration
 */
export const environment = {
  production: false,
  apiUrl: '', // Use proxy to avoid CORS issues in development
  keycloakUrl: 'http://localhost:8081', // Keycloak URL - to be configured
  keycloakRealm: 'school-management',
  keycloakClientId: 'school-management-frontend'
};
