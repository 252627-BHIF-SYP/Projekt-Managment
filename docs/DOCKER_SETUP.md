# Docker Setup

Start from the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:4200
- Backend API: http://localhost:5144/api/health
- Swagger: http://localhost:5144/swagger
- Keycloak: http://localhost:8081/admin
- PostgreSQL: localhost:5432

Default environment values:

- PostgreSQL database: `project_catalog_db`
- PostgreSQL user: `postgres`
- PostgreSQL password: `postgres`
- Keycloak admin user: `admin`
- Keycloak admin password: `admin`

The compose setup imports the realm from:

```text
infra/keycloak/realm-import/school-management-realm.json
```

Example users:

- `admin` / `admin`
- `av` / `av`
- `professor` / `professor`
- `student` / `student`

Notes:

- The frontend calls the backend through `/api`; Nginx proxies that to the backend container.
- Backend uses PostgreSQL through the `postgres` service name.
- Backend JWT validation is configured for the Docker Keycloak service. `admin` and `sys-admin` are treated as the same permission level.
- If you change the realm import and want Keycloak to import it again, remove the Keycloak volume:

```bash
docker compose down -v
docker compose up --build
```
