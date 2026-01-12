/**
 * Development environment configuration
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // Backend API URL - update when backend is ready
  keycloakUrl: 'http://localhost:8081', // Keycloak URL - to be configured
  keycloakRealm: 'school-management',
  keycloakClientId: 'school-management-frontend'
};
