/**
 * Production environment configuration
 */
export const environment = {
  production: true,
  apiUrl: '/api', // Production API URL
  keycloakUrl: 'https://auth.school.at', // Production Keycloak URL
  keycloakRealm: 'school-management',
  keycloakClientId: 'school-management-frontend'
};
