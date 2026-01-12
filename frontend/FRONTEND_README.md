# School Project Management System - Frontend

A comprehensive Angular-based frontend for managing school projects, students, supervisors, and project assignments.

## 🚀 Features

- **Authentication System**
  - Mock login with multiple user roles
  - Prepared for Keycloak integration
  - Role-based access control (RBAC)

- **User Roles**
  - `SYS_ADMIN`: System administrator with full access
  - `AV`: Abteilungsvorstand (Department head)
  - `PROFESSOR`: Professor/Teacher
  - `BETREUER`: External supervisor
  - `STUDENT_SEARCHING`: Student looking for a project
  - `STUDENT_PROJECT`: Student assigned to a project

- **Project Management**
  - Create, view, and manage projects
  - Search and filter projects by various criteria
  - Assign students and supervisors
  - Track project status and progress
  - Change request system

- **Student Management**
  - Student profiles with skills and information
  - Class-based filtering
  - Project assignment tracking

- **Import System**
  - Bulk import students, teachers, and projects via CSV
  - File validation and preview
  - Import history tracking

- **Responsive UI**
  - Angular Material design
  - Sidebar navigation based on user roles
  - Global school year selector
  - Mobile-friendly layout

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

## 🛠️ Installation

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Install Angular CLI (if not already installed)

```powershell
npm install -g @angular/cli@17
```

## 🎯 Running the Application

### Development Server

Start the development server:

```powershell
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/` in your browser.

The application will automatically reload if you change any source files.

### Production Build

Build the application for production:

```powershell
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## 🔐 Demo Accounts

The application includes mock authentication with the following demo accounts:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `password` | System administrator |
| AV | `av` | `password` | Department head |
| Professor | `professor` | `password` | Professor/Teacher |
| Student | `student1` | `password` | Student looking for project |
| Student | `student2` | `password` | Student with assigned project |

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Core module (singleton services, guards)
│   │   │   ├── guards/              # Route guards (auth, role)
│   │   │   ├── interceptors/        # HTTP interceptors
│   │   │   ├── models/              # TypeScript interfaces and models
│   │   │   └── services/            # Core services (auth, api)
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── main-layout/         # Main app layout with sidebar
│   │   │   ├── sidebar/             # Navigation sidebar
│   │   │   └── topbar/              # Top navigation bar
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── dashboard/           # Dashboard page
│   │   │   ├── import/              # Data import page
│   │   │   ├── login/               # Login page
│   │   │   ├── profile/             # User profile page
│   │   │   ├── project-create/      # Create project page
│   │   │   ├── project-detail/      # Project detail page
│   │   │   └── project-list/        # Projects list page
│   │   │
│   │   ├── services/                # Feature services
│   │   │   ├── change-request.service.ts
│   │   │   ├── import.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── schoolyear.service.ts
│   │   │   ├── student.service.ts
│   │   │   └── user.service.ts
│   │   │
│   │   ├── shared/                  # Shared/reusable components
│   │   │   └── components/
│   │   │       ├── change-request-list/
│   │   │       ├── filter-bar/
│   │   │       ├── project-card/
│   │   │       └── student-picker/
│   │   │
│   │   ├── app.component.ts         # Root component
│   │   ├── app.config.ts            # App configuration
│   │   └── app.routes.ts            # Route definitions
│   │
│   ├── environments/                # Environment configurations
│   │   ├── environment.ts           # Production environment
│   │   └── environment.development.ts # Development environment
│   │
│   ├── index.html                   # Main HTML file
│   ├── main.ts                      # Application entry point
│   └── styles.scss                  # Global styles
│
├── angular.json                     # Angular CLI configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

## 🏗️ Architecture

### Core Principles

1. **Standalone Components**: Uses Angular 17+ standalone components (no NgModules)
2. **TypeScript Strict Mode**: Full type safety enabled
3. **Modular Design**: Clear separation of concerns
4. **Service Layer**: Centralized business logic
5. **Reactive Programming**: RxJS observables throughout

### Key Components

#### Core Module
- **AuthService**: Handles authentication and user session
- **ApiService**: Centralized HTTP client for API calls
- **Guards**: Protect routes based on authentication and roles
- **Interceptors**: Handle HTTP request/response transformation

#### Services
- All services use mock data for development
- Prepared for easy backend integration
- Observable-based APIs for reactive programming

#### Models
- Comprehensive TypeScript interfaces
- Type-safe throughout the application
- Enums for status values and types

### Routing

The application uses Angular Router with:
- Lazy loading ready
- Route guards for authentication and authorization
- Nested routes with layouts
- Redirects for unauthorized access

## 🔧 Configuration

### API Integration

Update the API URL in environment files:

**Development** (`src/environments/environment.development.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

**Production** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.school.at'
};
```

### Keycloak Integration

When ready to integrate Keycloak:

1. Install Keycloak Angular adapter:
   ```powershell
   npm install keycloak-angular keycloak-js
   ```

2. Update `auth.service.ts` to use Keycloak
3. Configure Keycloak settings in environment files
4. Update `app.config.ts` with Keycloak initialization

## 🎨 Customization

### Theming

The application uses Angular Material theming. To customize:

1. Edit `src/styles.scss`
2. Change Material theme colors
3. Update CSS variables for custom styling

### Adding New Features

1. **Create a new page**:
   ```powershell
   ng generate component pages/your-page --standalone
   ```

2. **Add a new service**:
   ```powershell
   ng generate service services/your-service
   ```

3. **Add route** in `app.routes.ts`

## 📊 Mock Data

The application includes mock data for development:
- Users with different roles
- Sample projects
- Student profiles
- School years and classes
- Import logs
- Change requests

All services are ready to be connected to a real backend API.

## 🚦 Development Workflow

1. **Start development server**: `npm start`
2. **Make changes** to components/services
3. **Test in browser** at `http://localhost:4200`
4. **Build for production**: `npm run build`

## 🧪 Testing

```powershell
# Run unit tests
ng test

# Run end-to-end tests
ng e2e
```

## 📝 Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Document all public methods
- Use meaningful variable names
- Keep components focused and small

## 🔒 Security

- All routes protected with auth guard
- Role-based access control (RBAC)
- HTTP interceptors for token management
- Prepared for Keycloak OAuth2/OIDC

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```powershell
   ng serve --port 4201
   ```

2. **Module not found**:
   ```powershell
   rm -rf node_modules
   npm install
   ```

3. **Build errors**:
   ```powershell
   ng build --configuration development
   ```

## 📦 Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/school-project-management /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```powershell
docker build -t school-management-frontend .
docker run -p 80:80 school-management-frontend
```

### Static Hosting

Build for production and deploy the `dist/` folder to:
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront
- GitHub Pages

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of a school management system.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review the code comments
3. Contact the development team

## 🎓 Next Steps

1. **Backend Integration**: Connect to Spring Boot backend
2. **Keycloak Setup**: Implement OAuth2 authentication
3. **Real-time Updates**: Add WebSocket support
4. **File Management**: Implement document upload/download
5. **Notifications**: Add push notifications
6. **Analytics**: Add usage analytics dashboard

---

**Built with ❤️ using Angular 17 and Material Design**
