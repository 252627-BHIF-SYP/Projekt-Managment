# 🏛️ Architecture Documentation

## Overview

This document describes the architecture and design decisions of the School Project Management System frontend.

## Technology Stack

### Core Framework
- **Angular 17** (Latest LTS)
  - Standalone components (no NgModules)
  - Signals-ready architecture
  - Modern reactive patterns

### UI Framework
- **Angular Material 17**
  - Pre-built UI components
  - Responsive design
  - Accessibility built-in
  - Theming support

### Language
- **TypeScript 5.2**
  - Strict mode enabled
  - Full type safety
  - Enhanced IntelliSense

### State Management
- **RxJS 7.8**
  - Reactive programming
  - Observable streams
  - Declarative data flow

## Architecture Patterns

### 1. Modular Architecture

```
┌─────────────────────────────────────────┐
│           Application Root              │
│            (AppComponent)               │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌────▼────┐
    │  Core  │          │ Feature │
    │ Module │          │ Modules │
    └───┬────┘          └────┬────┘
        │                    │
    ┌───▼────────────────────▼───┐
    │      Shared Module         │
    └────────────────────────────┘
```

### 2. Layer Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Components, Pages, Layout)          │
├─────────────────────────────────────────┤
│          Business Layer                 │
│        (Services, Guards)               │
├─────────────────────────────────────────┤
│           Data Layer                    │
│      (Models, API Service)              │
├─────────────────────────────────────────┤
│        Infrastructure Layer             │
│   (HTTP, Interceptors, Environment)     │
└─────────────────────────────────────────┘
```

## Core Modules

### Core Module (`src/app/core/`)

**Purpose**: Singleton services and app-wide functionality

**Contents**:
- **Guards**: Route protection (auth, role-based)
- **Interceptors**: HTTP request/response handling
- **Models**: TypeScript interfaces and types
- **Services**: Core services (Auth, API)

**Rules**:
- Import only once in AppConfig
- Never imported by feature modules
- Contains singleton services only

### Feature Modules

#### Pages (`src/app/pages/`)

Route-level components:
- **Dashboard**: Overview and statistics
- **Projects**: List, detail, create
- **Profile**: User profile management
- **Import**: Bulk data import
- **Login**: Authentication

#### Layout (`src/app/layout/`)

Application shell:
- **MainLayout**: Container with sidebar and topbar
- **Sidebar**: Role-based navigation menu
- **Topbar**: User menu and school year selector

#### Services (`src/app/services/`)

Feature-specific business logic:
- **ProjectService**: Project CRUD operations
- **StudentService**: Student management
- **UserService**: User operations
- **SchoolYearService**: Academic year management
- **ImportService**: CSV import functionality
- **ChangeRequestService**: Change request management

### Shared Module (`src/app/shared/`)

**Purpose**: Reusable components and utilities

**Components**:
- **ProjectCard**: Project display card
- **FilterBar**: Search and filter controls
- **StudentPicker**: Multi-select student list
- **ChangeRequestList**: Change request display

**Rules**:
- No business logic
- Purely presentational
- Can be imported by any module

## Design Patterns

### 1. Dependency Injection

```typescript
@Injectable({
  providedIn: 'root'  // Singleton service
})
export class ProjectService {
  constructor(private apiService: ApiService) {}
}
```

**Benefits**:
- Loose coupling
- Easy testing
- Service lifecycle management

### 2. Observable Pattern

```typescript
export class ProjectService {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();
  
  getProjects(): Observable<Project[]> {
    return this.apiService.get<Project[]>('/projects');
  }
}
```

**Benefits**:
- Reactive data flow
- Automatic updates
- Cancellable operations

### 3. Guard Pattern

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated() || redirect('/login');
};
```

**Benefits**:
- Route protection
- Centralized authorization
- Declarative security

### 4. Smart/Dumb Components

**Smart Components** (Containers):
- Manage state
- Call services
- Handle business logic
- Example: `ProjectListComponent`

**Dumb Components** (Presentational):
- Receive data via @Input
- Emit events via @Output
- Pure presentation
- Example: `ProjectCardComponent`

## Data Flow

### 1. Component → Service → API

```
Component
    ↓ (calls method)
Service
    ↓ (HTTP request)
ApiService
    ↓ (network)
Backend API
    ↓ (response)
Observable chain
    ↓ (subscribe)
Component (update UI)
```

### 2. Authentication Flow

```
1. User enters credentials
   ↓
2. LoginComponent calls AuthService.login()
   ↓
3. AuthService validates and stores token
   ↓
4. Navigate to dashboard
   ↓
5. AuthGuard checks authentication
   ↓
6. Route activated or redirect to login
```

### 3. State Management

```typescript
// Service manages state
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();

// Components subscribe
this.authService.currentUser$.subscribe(user => {
  this.currentUser = user;
});
```

## Security Architecture

### 1. Authentication

**Current**: Mock authentication
```typescript
login(credentials: LoginCredentials): Observable<AuthResponse> {
  // Mock validation
  return of(mockAuthResponse);
}
```

**Future**: Keycloak OAuth2/OIDC
```typescript
login(): Observable<AuthResponse> {
  return this.keycloakService.login();
}
```

### 2. Authorization

**Role-Based Access Control (RBAC)**:

```typescript
// Route level
{
  path: 'admin',
  canActivate: [roleGuard],
  data: { roles: [Role.SYS_ADMIN] }
}

// Component level
*ngIf="authService.hasRole(Role.PROFESSOR)"

// Service level
if (!this.authService.hasAnyRole([Role.ADMIN, Role.AV])) {
  throw new UnauthorizedException();
}
```

### 3. HTTP Security

**Interceptors**:
- Add authentication tokens
- Handle errors
- Refresh tokens
- Log requests

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.getToken();
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next.handle(authReq);
  }
}
```

## Performance Optimization

### 1. Lazy Loading

**Route-level**:
```typescript
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes')
}
```

### 2. OnPush Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 3. TrackBy Functions

```typescript
<div *ngFor="let item of items; trackBy: trackByFn">
```

### 4. Async Pipe

```typescript
<div *ngIf="data$ | async as data">
```

## Testing Strategy

### Unit Tests

**Services**:
```typescript
describe('ProjectService', () => {
  it('should fetch projects', () => {
    service.getProjects().subscribe(projects => {
      expect(projects.length).toBeGreaterThan(0);
    });
  });
});
```

**Components**:
```typescript
describe('ProjectListComponent', () => {
  it('should display projects', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelectorAll('.project-card').length).toBe(3);
  });
});
```

### Integration Tests

- Component + Service interaction
- Guard + Route protection
- Form validation flows

### E2E Tests

- User login flow
- Project creation workflow
- Import process

## Error Handling

### 1. Service Level

```typescript
getProjects(): Observable<Project[]> {
  return this.apiService.get<Project[]>('/projects').pipe(
    catchError(error => {
      console.error('Error fetching projects:', error);
      return throwError(() => error);
    })
  );
}
```

### 2. Component Level

```typescript
this.projectService.getProjects().subscribe({
  next: (projects) => this.projects = projects,
  error: (error) => this.handleError(error)
});
```

### 3. Global Error Handler

```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error): void {
    // Log to monitoring service
    // Show user-friendly message
  }
}
```

## Scalability Considerations

### 1. Module Structure

- Feature modules can be extracted to libraries
- Shared components in separate package
- Core functionality in dedicated package

### 2. Code Organization

```
├── libs/
│   ├── core/           # Core functionality
│   ├── shared/         # Shared components
│   ├── features/       # Feature modules
│   └── models/         # Shared models
```

### 3. State Management

For larger apps, consider:
- NgRx for complex state
- Akita for simpler state
- Component stores for local state

## Deployment Architecture

### Development
```
Developer → Git → CI/CD → Dev Server
                           ↓
                    http://dev.school.at
```

### Production
```
Developer → Git → CI/CD → Build → Container → Kubernetes
                                                  ↓
                                           Load Balancer
                                                  ↓
                                           https://school.at
```

## API Integration Strategy

### 1. Development (Current)

```typescript
// Mock data in services
getProjects(): Observable<Project[]> {
  return of(this.mockProjects).pipe(delay(300));
}
```

### 2. Integration (Future)

```typescript
// Real API calls
getProjects(): Observable<Project[]> {
  return this.apiService.get<Project[]>('/projects');
}
```

### 3. Environment-based

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  useMockData: true  // Toggle mock data
};
```

## Monitoring & Logging

### 1. Console Logging

```typescript
if (!environment.production) {
  console.log('Debug info:', data);
}
```

### 2. Error Tracking

Integration points for:
- Sentry
- Rollbar
- Application Insights

### 3. Analytics

Track:
- User flows
- Feature usage
- Performance metrics

## Future Enhancements

### 1. Real-time Updates

```typescript
// WebSocket integration
this.websocketService.on('project-updated').subscribe(project => {
  this.updateProject(project);
});
```

### 2. Offline Support

```typescript
// Service Worker + IndexedDB
@Injectable()
export class OfflineService {
  syncWhenOnline() {
    // Sync pending changes
  }
}
```

### 3. Progressive Web App

- Service Worker
- App manifest
- Push notifications
- Install prompt

### 4. Micro-frontends

- Module federation
- Independent deployments
- Team autonomy

## Best Practices

### 1. Code Style

- Follow Angular style guide
- Use meaningful names
- Keep functions small
- Write self-documenting code

### 2. Type Safety

```typescript
// Good
function getProject(id: string): Observable<Project> { }

// Bad
function getProject(id: any): any { }
```

### 3. Immutability

```typescript
// Good
const updated = { ...project, status: 'COMPLETED' };

// Bad
project.status = 'COMPLETED';
```

### 4. Unsubscribe

```typescript
// Good
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe();
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

## Conclusion

This architecture provides:
- ✅ Scalability for future growth
- ✅ Maintainability through clean code
- ✅ Testability with dependency injection
- ✅ Security through guards and interceptors
- ✅ Performance through best practices
- ✅ Developer experience with TypeScript

The system is production-ready and prepared for backend integration.
