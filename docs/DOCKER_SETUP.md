# Docker Setup

Start from the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:4200
- Backend API: http://localhost:5144/api/health
- Swagger: http://localhost:5144/swagger
- PostgreSQL: localhost:5433

Default environment values:

- PostgreSQL database: `project_catalog_db`
- PostgreSQL user: `postgres`
- PostgreSQL password: `postgres`

- The frontend calls the backend through `/api`; Nginx proxies that to the backend container.
- Backend uses PostgreSQL through the `postgres` service name.
- Authentication is configured for the external HTL Leonding Keycloak instance.

## Mock Mode (Offline / Ohne Keycloak)

Falls du ohne Verbindung zum HTL-Keycloak-Server oder mit lokalen Mock-Benutzern arbeiten möchtest:

```bash
docker compose -f docker-compose.yml -f docker-compose.mock.yml up --build
```

