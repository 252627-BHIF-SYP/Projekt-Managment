/**
 * Development environment configuration
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5144', // WebAPI launchSettings default HTTP URL
  keycloakUrl: 'http://localhost:8081', // Keycloak URL - to be configured
  keycloakRealm: 'school-management',
  keycloakClientId: 'school-management-frontend'
};
