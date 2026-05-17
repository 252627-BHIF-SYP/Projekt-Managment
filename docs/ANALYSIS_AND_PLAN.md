# Analyse und Umbauplan

## Schritt 1: Analyse

### Aktuelle Backend-Struktur

- Solution: `backend/WebApplication/Backend.sln`
- Projekte:
  - `Core`: Entities und Enums
  - `Persistence`: `ApplicationDbContext`, Migrationen, PostgreSQL-Konfiguration
  - `WebAPI`: Controller, DTOs und `ImportService`
- Das fachliche Datenmodell ist bereits grob vorhanden:
  - `SchoolYear`
  - `SchoolYearProject`
  - `StudentClass`
  - `Person`
  - `Student`
  - `Professor`
  - `StudentClassHistory`
  - `Project`
  - `ProjectStudent`
  - `ProjectSupervisor`
- EF-Vererbung ist grundsätzlich angelegt:
  - `Person` als Basisklasse
  - `Student` und `Professor` als TPH-Unterklassen
  - Discriminator-Spalte `PersonType`
- CSV-Import ist als Backend-Service vorhanden und wird von `StudentController` und `ProfessorController` verwendet.

### Erkannte Backend-Probleme

- Backend kompiliert aktuell nicht mit der installierten .NET-Version:
  - lokal ist .NET SDK `9.0.201` installiert
  - `WebAPI` und `Persistence` zielen aber auf `net10.0`
  - `Core` zielt auf `net9.0`
- `ImportService.ImportStudent` verwendet `student.StudentId`, diese Property existiert nicht; korrekt ist `student.Id`.
- `Person.PersonType` ist als required Fachfeld vorhanden, wird beim Erstellen von `Student`/`Professor` aber nicht gesetzt.
- EF-Discriminator und `PersonType` müssen sauber zusammengeführt werden, damit Keycloak-Rollen und fachliche Personenart nicht vermischt werden.
- `ProjectDTO` bildet mehrjährige Projekte nur über ein einzelnes `schoolYearId` ab.
- `ProjectController.ProjectToDto` lädt keine Navigationsdaten per `Include`, verwendet aber `ProjectStudents`, `ProjectSupervisors` und `SchoolYearProjects`.
- `ProjectController.ProjectToDto` übergibt `ProjectType` als Enum an ein DTO-Feld vom Typ `string`.
- Es fehlen wichtige CRUD-Endpunkte:
  - Projekt bearbeiten
  - Projekt löschen
  - Schüler-/Betreuerzuordnung sauber zurückgeben
  - History-ID für Projektschülerzuordnung
- Admin-Statistiken existieren nur verteilt über Count-Endpunkte, aber nicht als klare Systemübersicht.
- Es gibt keine CORS-Konfiguration für Frontend/Backend.
- Keycloak wird im Backend noch nicht für Authentifizierung/Autorisierung verwendet.

### Aktuelle Frontend-Struktur

- Angular 17 mit Standalone Components.
- Struktur:
  - `core`: Models, Guards, API/Auth Services
  - `services`: Feature-Services
  - `layout`: Sidebar, Topbar, MainLayout
  - `pages`: Dashboard, Admin-Dashboard, Projekte, Import, Login, Profile, Students
  - `shared`: ProjectCard, FilterBar, StudentPicker, ChangeRequestList
- Keycloak ist grundsätzlich eingebunden.
- Rollenmenü ist grundsätzlich vorhanden.

### Erkannte Frontend-Probleme

- Viele Models enthalten Felder, die nicht zum Backend-Datenmodell gehören:
  - `maxStudents`, `minStudents`, `tags`, `createdByName`, `className`, `ChangeRequest`, `StudentStatus`, usw.
- Services enthalten viele Mockdaten und Fallbacks, wodurch echte Backend-Fehler verdeckt werden.
- Einige Services rufen hart `https://localhost:7113` auf, statt `environment.apiUrl` bzw. den zentralen `ApiService` zu verwenden.
- `ApiService` liest ein altes Mock-Token aus `localStorage`, aber nicht den echten Keycloak-Token.
- Der HTTP-Interceptor ist nicht wirksam registriert.
- Frontend und Backend verwenden unterschiedliche DTO-Namen:
  - `githubURL`/`logoURL` im Frontend
  - `GithubUrl`/`LogoUrl` fachlich sauberer im Backend
- Projektanlage unterstützt nur ein Schuljahr, obwohl das Datenmodell `SchoolYearProject` für mehrere Schuljahre vorsieht.
- Schülerauswahl braucht eine `historyId`, der verwendete Endpoint existiert im Backend nicht.
- ChangeRequest/Approval ist im Frontend noch sichtbar, soll aber laut aktueller Vorgabe entfernt werden.
- Manuelles Anlegen von Schülern/Professoren ist im Backend begonnen, im Frontend aber nicht sauber nutzbar.
- Rollen sind zu stark in alte Sonderrollen aufgeteilt:
  - fachlich gewünscht sind Admin/SysAdmin, AV, Professor/Lehrer und Schüler.

### Teaching-Repo / Unterrichtsstil

Relevante Vorlagen:

- `D:\Schule\Pose 4 jahr\4bhif-pose-2526\03-ef\02-EF-ModelConfigurations.md`
- `D:\Schule\Pose 4 jahr\4bhif-pose-2526\03-ef\04-ASP-EF-CRUD-Validation.md`
- `D:\Schule\Pose 4 jahr\4bhif-pose-2526\03-ef\06-ServiceLayering.md`
- Beispielprojekt `CityCongestionCharge`

Erkannter Unterrichtsstil:

- EF Core mit sauberen Entities und `DbSet<T> => Set<T>()`.
- Model-Konfiguration bevorzugt zentral über Fluent API:
  - bei mittleren Projekten separate Konfigurationsmethoden
  - bei größeren Projekten `IEntityTypeConfiguration<T>`
- DTOs sollen klar die API-Grenze beschreiben.
- Controller/Endpoints sollen Datenbankfehler und NotFound-Fälle sauber behandeln.
- Services sollen fachliche Operationen kapseln, besonders wenn mehrere Tabellen beteiligt sind.
- Angular verwendet Services für HTTP-Zugriffe und typed DTOs/Models.

### Dateien, die voraussichtlich angepasst werden

Backend:

- `backend/WebApplication/Core/Core.csproj`
- `backend/WebApplication/Persistence/Persistence.csproj`
- `backend/WebApplication/WebAPI/WebAPI.csproj`
- `backend/WebApplication/Core/Entities/*.cs`
- `backend/WebApplication/Persistence/ApplicationDbContext.cs`
- neue EF-Konfigurationsdateien unter `Persistence/Configurations`
- `backend/WebApplication/WebAPI/DTOs/*.cs`
- `backend/WebApplication/WebAPI/Service/ImportService.cs`
- `backend/WebApplication/WebAPI/Controllers/*.cs`
- `backend/WebApplication/WebAPI/Program.cs`
- `backend/WebApplication/WebAPI/appsettings*.json`

Frontend:

- `frontend/src/environments/*.ts`
- `frontend/src/app/core/models/*.ts`
- `frontend/src/app/core/services/*.ts`
- `frontend/src/app/core/init/keycloak-init.factory.ts`
- `frontend/src/app/services/*.ts`
- `frontend/src/app/layout/sidebar/*`
- `frontend/src/app/pages/project-*/*`
- `frontend/src/app/pages/admin-dashboard/*`
- `frontend/src/app/pages/students/*`
- `frontend/src/app/pages/import/*`
- `frontend/src/app/shared/components/*`

Docker/Infra:

- `docker-compose.yml`
- `backend/WebApplication/WebAPI/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `infra/keycloak/realm-import/school-management-realm.json`
- neue Startdokumentation unter `docs/`

### Bestehende Teile, die erhalten bleiben sollen

- Fachliches Datenmodell aus `datamodel.puml`.
- Bestehende Entities als Grundlage.
- Bestehende Enums:
  - `ProjectType`
  - `ProjectStatus`
  - `PersonType`
- Bestehende CSV-Import-Idee und Controller-Endpunkte.
- Angular-Standalone-Struktur.
- Keycloak-Grundkonfiguration und Realm-Datei.
- Bestehende Admin-Count-Endpunkte, soweit sinnvoll.

## Schritt 2: Umbauplan

### Backend

1. Alle Backend-Projekte auf ein konsistentes Ziel bringen:
   - lokal und Docker: `net9.0`
2. EF-Modell nach Unterrichtsstil reparieren:
   - `PersonType` als EF-Discriminator sauber verwenden
   - `ProjectStatus` und `ProjectType` als String speichern
   - Beziehungen und Unique-Indizes in Konfigurationsklassen auslagern
3. DTOs am Datenmodell ausrichten:
   - `ProjectDto`
   - `UpsertProjectDto`
   - `ProjectStudentDto`
   - `ProjectSupervisorDto`
   - `StudentDto`
   - `ProfessorDto`
   - `StudentClassDto`
   - `SchoolYearDto`
   - `ImportResultDto`
   - `AdminStatsDto`
4. Projekt-Endpunkte vervollständigen:
   - `GET /api/Project/All`
   - `GET /api/Project/{id}`
   - `POST /api/Project/Add`
   - `PUT /api/Project/{id}`
   - `DELETE /api/Project/{id}`
   - `GET /api/Project/Types`
   - `GET /api/Project/Statuses`
5. Mehrjährige Projekte über `SchoolYearProject` abbilden:
   - DTO verwendet `schoolYearIds`
   - alter `schoolYearId`-Fall wird als Kompatibilität akzeptiert, falls nötig
6. Schüler/Professoren manuell anlegen:
   - bestehende Add-Endpunkte reparieren
   - Frontend darauf ausrichten
7. CSV-Import erhalten und stabilisieren:
   - bestehende Import-Endpunkte beibehalten
   - Ergebnis als strukturierte Antwort zurückgeben
8. Keycloak und Rollen:
   - JWT Bearer-Konfiguration
   - Rollen aus Realm-Claims auslesen
   - Admin/SysAdmin und AV für administrative Endpunkte verwenden
   - Schüler/Professoren für Projektfunktionen erlauben
9. CORS für lokale Entwicklung und Docker konfigurieren.
10. Backend startet in Docker mit PostgreSQL und legt die Datenbank beim Start an; eine neue Migration kann aus der finalen Fluent-API-Struktur erzeugt werden.

### Frontend

1. Models auf Backend-Datenmodell reduzieren.
2. API-Services auf echte Backend-Endpunkte umstellen.
3. Mock-Fallbacks entfernen oder stark begrenzen, damit Fehler sichtbar werden.
4. Keycloak-Token im `ApiService` korrekt verwenden.
5. Rollenmodell vereinfachen:
   - `SYS_ADMIN`
   - `AV`
   - `PROFESSOR`
   - `STUDENT`
6. Menü:
   - Projekte und Projektanlage für Schüler/Professoren/Admin/AV
   - Admin-Dashboard und Import/Personenverwaltung nur Admin/SysAdmin/AV
7. Projektübersicht:
   - Suche nach Name/Beschreibung/Technologie
   - Filter nach Schuljahr, Klasse, Betreuer, Projekttyp, Status
8. Projektanlage:
   - Projekttyp aus vorhandenen Backend-Enums
   - mehrere Schuljahre auswählbar
   - Schüler mit `historyId`
   - Professoren als Betreuer
9. Projektdetail:
   - keine ChangeRequest/Approval-Ansicht
   - Projekt bearbeiten/löschen rollenlogisch anzeigen
10. Personen-Seite:
   - Schüler oder Professor manuell anlegen
   - Liste danach aktualisieren
11. CSV-Upload:
   - Datei an bestehende Backend-Import-Endpunkte senden
   - strukturierte Ergebnisanzeige aus Backend-Antwort anzeigen.

### Docker

1. Root-Compose für:
   - PostgreSQL
   - Keycloak
   - Backend
   - Frontend
2. Backend-Dockerfile:
   - .NET 9 SDK build
   - ASP.NET 9 runtime
3. Frontend-Dockerfile:
   - Angular build
   - Nginx static hosting
   - `/api`-Proxy zum Backend
4. Keycloak:
   - vorhandene Realm-Datei weiterverwenden
   - Redirects/Web Origins für `http://localhost:4200`
   - Beispielrollen und Beispieluser ergänzen
5. Dokumentation:
   - Start mit `docker compose up --build`
   - wichtige Ports und Testuser erklären.

### Rollenlogik

- Admin/SysAdmin und AV:
  - Admin-Dashboard
  - Personenverwaltung
  - CSV-Import
  - Projekte verwalten
- Professor:
  - Projekte sehen
  - Projekte anlegen/bearbeiten
  - Betreuer sein
  - Schüler Projekten zuordnen
- Schüler:
  - Projekte sehen
  - Projekte anlegen
  - eigenes Projekt bearbeiten
  - kein Admin-Dashboard

### Annahmen

- `Admin` und `SysAdmin` werden frontendseitig und backendseitig als dieselbe Rolle behandelt.
- Keycloak-Rollen werden in Realm-Rollen gepflegt.
- `personType` bleibt fachlich die EF-Personenart und ist unabhängig von Keycloak-Rollen.
- Die bestehende CSV-Import-Funktion wird nicht fachlich neu erfunden, aber robust gegen Header-Reihenfolge, leere Zeilen und Duplikate gemacht.
