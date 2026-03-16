/**
 * Production environment configuration
 */
export const environment = {
  production: true,
  apiUrl: '', // Same-origin API base; controllers are mapped at root
  keycloakUrl: 'https://auth.school.at', // Production Keycloak URL
  keycloakRealm: 'school-management',
  keycloakClientId: 'school-management-frontend'
};
