# Local Keycloak (Team Setup)

This folder provides a shared Keycloak setup so everyone in the team runs the same container and realm configuration.

## Start

From this folder:

```powershell
docker compose up -d
```

## Stop

```powershell
docker compose down
```

## Open Admin Console

- URL: http://localhost:8081/admin
- User: `admin`
- Password: `admin`

## Notes

- Realm `school-management` is imported from `realm-import/school-management-realm.json`.
- Client `school-management-frontend` is preconfigured.
- If you need a clean re-import, remove the volume first:

```powershell
docker compose down -v
```

Then start again with `docker compose up -d`.
