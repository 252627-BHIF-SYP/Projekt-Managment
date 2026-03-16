# Keycloak Integration Setup Guide

## Overview

The School Project Management frontend now supports authentication via Keycloak, an open-source Identity and Access Management solution.

## Prerequisites

- Docker + Docker Compose
- Node.js and npm installed
- Angular project dependencies installed

## Team Standard: Shared Docker Setup (recommended)

Use the committed setup so everyone runs the same Keycloak version and realm config.

1. Open [infra/keycloak/docker-compose.yml](../infra/keycloak/docker-compose.yml)
2. Start Keycloak from `infra/keycloak`:
   - `docker compose up -d`
3. Open Admin Console:
   - `http://localhost:8081/admin`
   - user: `admin`
   - password: `admin`

Included defaults:
- Realm import: [infra/keycloak/realm-import/school-management-realm.json](../infra/keycloak/realm-import/school-management-realm.json)
- Realm: `school-management`
- Client: `school-management-frontend`
- Redirect URIs: `http://localhost:4200/*`, `http://localhost:4200/dashboard`
- Web Origins: `http://localhost:4200`

If you need a fresh re-import:
- `docker compose down -v`
- `docker compose up -d`

## Installation

The required packages are already installed:
- `keycloak-angular@15`
- `keycloak-js@23`

## Keycloak Server Configuration

### 1. Create a New Realm

1. Log in to your Keycloak Admin Console
2. Create a new realm called `school-management` (or use an existing one)
3. Note down the realm name

### 2. Create a Client

1. Go to **Clients** → **Create**
2. Configure the client:
   - **Client ID**: `school-management-frontend`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `public`
   - **Valid Redirect URIs**: 
     - `http://localhost:4200/*` (development)
     - Your production URL (e.g., `https://school.example.com/*`)
   - **Web Origins**: 
     - `http://localhost:4200` (development)
     - Your production URL
   - **Base URL**: `http://localhost:4200`

### 3. Configure Roles

Create the following roles in Keycloak (either realm roles or client roles):

- `sys-admin` - System Administrator
- `av` - Abteilungsvorstand (Department Head)
- `professor` - Professor/Teacher
- `betreuer` - Supervisor
- `student-searching` - Student looking for project
- `student-project` - Student already in project

**Important**: Role names in Keycloak should be lowercase with hyphens (e.g., `sys-admin`), they will be automatically mapped to the application roles (e.g., `SYS_ADMIN`).

### 4. Create Users

1. Go to **Users** → **Add User**
2. Create test users for each role
3. Set passwords in the **Credentials** tab
4. Assign roles in the **Role Mappings** tab

## Environment Configuration

### Development Environment

Update `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  keycloakUrl: 'http://localhost:8081',  // Your Keycloak URL
  keycloakRealm: 'school-management',     // Your realm name
  keycloakClientId: 'school-management-frontend'
};
```

### Production Environment

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  keycloakUrl: 'https://auth.school.at',  // Your production Keycloak URL
  keycloakRealm: 'school-management',
  keycloakClientId: 'school-management-frontend'
};
```

## Application Configuration

### Toggle Keycloak On/Off

In `src/app/core/services/auth.service.ts`, you can toggle between Keycloak and mock authentication:

```typescript
private readonly USE_KEYCLOAK = true; // Set to false for mock authentication
```

When `USE_KEYCLOAK = false`, the application uses the built-in mock authentication for development without requiring a Keycloak server.

## User Mapping

The application automatically maps Keycloak user profiles to the internal User model:

- **id**: Keycloak user ID
- **username**: Keycloak username
- **email**: Keycloak email
- **firstName**: Keycloak first name
- **lastName**: Keycloak last name
- **roles**: Extracted from Keycloak realm and client roles

## Features

### Login Flow

1. User clicks "Sign in with Keycloak" button
2. Redirected to Keycloak login page
3. After successful authentication, redirected back to the application
4. User information is loaded from Keycloak
5. User is redirected to the dashboard

### Dashboard Display

The dashboard displays:
- Full name in the welcome message
- Username below the welcome message
- User information in the top navigation bar

### Token Management

- Access tokens are automatically included in API requests
- Tokens are refreshed automatically when they expire
- Bearer token interceptor is enabled by default

### Logout

When user logs out:
- Keycloak session is terminated
- Local session is cleared
- User is redirected to the Keycloak logout page
- Then redirected back to the application

## Development Testing

### Using Mock Authentication

Set `USE_KEYCLOAK = false` in `auth.service.ts` to use mock users:

- **admin** / password - System Admin
- **av** / password - AV
- **professor** / password - Professor
- **student1** / password - Student

### Using Keycloak

1. Start your Keycloak server
2. Configure the realm, client, and users as described above
3. Set `USE_KEYCLOAK = true` in `auth.service.ts`
4. Update environment variables with your Keycloak URL
5. Start the Angular application: `npm start`
6. Navigate to `http://localhost:4200`
7. Click "Sign in with Keycloak"

## Troubleshooting

### Common Issues

#### "Failed to initialize Keycloak"
- Check that Keycloak server is running
- Verify the Keycloak URL in environment configuration
- Check browser console for CORS errors

#### "Invalid redirect URI"
- Ensure the redirect URI is configured in Keycloak client settings
- Check that the URL matches exactly (including protocol and port)

#### "User has no roles"
- Verify roles are created in Keycloak
- Check role mappings for the user
- Ensure role names follow the lowercase-with-hyphens format

#### "Token not included in API requests"
- Verify `enableBearerInterceptor: true` in `keycloak-init.factory.ts`
- Check that API URLs are not in the excluded list

### Browser Console Debugging

Enable Keycloak debug logging:

```typescript
// In keycloak-init.factory.ts
initOptions: {
  onLoad: 'check-sso',
  enableLogging: true  // Add this line
}
```

## Security Best Practices

1. **Never commit secrets**: Keep client secrets out of source control
2. **Use HTTPS in production**: Always use secure connections for Keycloak
3. **Configure CORS properly**: Restrict origins to trusted domains
4. **Regular updates**: Keep Keycloak and dependencies up to date
5. **Token expiration**: Configure appropriate token lifetimes
6. **Role-based access**: Use roles to restrict access to sensitive features

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [keycloak-angular GitHub](https://github.com/mauriciovigolo/keycloak-angular)
- [Keycloak Server Setup Guide](https://www.keycloak.org/getting-started)

## Support

For issues related to:
- **Keycloak configuration**: Consult Keycloak documentation
- **Application integration**: Check the application logs and browser console
- **Role mapping**: Review the `extractRoles()` method in `keycloak.service.ts`
