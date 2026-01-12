# 🚀 Quick Start Guide

Complete setup instructions for the School Project Management System frontend.

## ⚡ Quick Setup (5 minutes)

```powershell
# Navigate to frontend directory
cd "C:\Users\semih\OneDrive\Desktop\Projekt-Managment\frontend"

# Install all dependencies
npm install

# Start the development server
npm start
```

Open your browser to **http://localhost:4200**

Login with:
- Username: `admin` or `professor` or `student1`
- Password: `password`

## 📋 Detailed Setup Instructions

### Step 1: Prerequisites Check

Make sure you have Node.js installed:

```powershell
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

If not installed, download from: https://nodejs.org/

### Step 2: Install Angular CLI Globally (Optional but Recommended)

```powershell
npm install -g @angular/cli@17
```

Verify installation:

```powershell
ng version
```

### Step 3: Install Project Dependencies

```powershell
cd "C:\Users\semih\OneDrive\Desktop\Projekt-Managment\frontend"
npm install
```

This will install:
- Angular 17 framework
- Angular Material UI components
- RxJS for reactive programming
- TypeScript
- Development tools

### Step 4: Run the Application

**Option 1: Using npm**
```powershell
npm start
```

**Option 2: Using Angular CLI**
```powershell
ng serve
```

**Option 3: With custom port**
```powershell
ng serve --port 4201
```

**Option 4: Open browser automatically**
```powershell
ng serve --open
```

The application will be available at **http://localhost:4200**

## 🎭 Demo Accounts

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `password` | SYS_ADMIN | Full system access |
| `av` | `password` | AV | Department head |
| `professor` | `password` | PROFESSOR | Create and manage projects |
| `student1` | `password` | STUDENT_SEARCHING | Student without project |
| `student2` | `password` | STUDENT_PROJECT | Student with project |

## 🏗️ Build for Production

### Development Build
```powershell
ng build --configuration development
```

### Production Build
```powershell
ng build --configuration production
```

The build artifacts will be in `dist/school-project-management/`

## 🧪 Testing

### Run Unit Tests
```powershell
ng test
```

### Run Tests with Coverage
```powershell
ng test --code-coverage
```

## 🛠️ Development Commands

### Generate New Component
```powershell
ng generate component pages/my-page --standalone
```

### Generate New Service
```powershell
ng generate service services/my-service
```

### Generate New Guard
```powershell
ng generate guard guards/my-guard --functional
```

### Generate New Model/Interface
```powershell
ng generate interface models/my-model
```

## 📱 Features Tour

Once running, you can explore:

### 1. **Login Page** (`/login`)
- Try different user roles
- See role-based navigation

### 2. **Dashboard** (`/dashboard`)
- Overview statistics
- Quick actions based on role

### 3. **Projects** (`/projects`)
- View all projects
- Search and filter
- Click a card to see details

### 4. **Create Project** (`/projects/create`)
- Multi-step wizard
- Select students
- Assign supervisors
- Only available for Professor/AV/Admin

### 5. **Profile** (`/profile`)
- Edit user information
- Student-specific fields for students

### 6. **Import** (`/import`)
- Bulk import students, teachers, projects
- CSV validation
- Import history
- Only available for Admin/AV

## 🎨 Customization

### Change Theme Colors

Edit `src/styles.scss`:

```scss
// Add custom Material theme
@use '@angular/material' as mat;

$my-primary: mat.define-palette(mat.$indigo-palette);
$my-accent: mat.define-palette(mat.$pink-palette);

$my-theme: mat.define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
  )
));

@include mat.all-component-themes($my-theme);
```

### Add New Route

Edit `src/app/app.routes.ts`:

```typescript
{
  path: 'my-page',
  component: MyPageComponent,
  canActivate: [authGuard]
}
```

## 🔧 Troubleshooting

### Problem: Port 4200 is already in use

**Solution:**
```powershell
ng serve --port 4201
```

### Problem: Module not found errors

**Solution:**
```powershell
rm -rf node_modules package-lock.json
npm install
```

### Problem: Build fails

**Solution:**
```powershell
# Clear Angular cache
rm -rf .angular

# Reinstall dependencies
npm ci

# Try development build first
ng build --configuration development
```

### Problem: TypeScript errors

**Solution:**
Check `tsconfig.json` and ensure strict mode is properly configured.

## 📊 Project Structure Overview

```
frontend/
├── src/app/
│   ├── core/               # Singleton services, guards, interceptors
│   ├── layout/             # Layout components (sidebar, topbar)
│   ├── pages/              # Page/route components
│   ├── services/           # Feature services
│   ├── shared/             # Reusable components
│   └── app.routes.ts       # Route configuration
├── src/environments/       # Environment configs
└── src/styles.scss         # Global styles
```

## 🎯 Next Steps

1. **Explore the Code**: Start with `src/app/app.routes.ts` to understand routing
2. **Check Services**: Look at `src/app/services/` for mock data and API calls
3. **Review Components**: Examine page components in `src/app/pages/`
4. **Customize**: Modify mock data in services to match your needs

## 🔄 Backend Integration (Future)

When backend is ready:

1. Update `environment.ts`:
   ```typescript
   apiUrl: 'http://localhost:8080/api'
   ```

2. Services will automatically use the API:
   - All `TODO` comments mark API integration points
   - Mock data will be replaced with real API calls

## 📞 Getting Help

- **Documentation**: Check `FRONTEND_README.md`
- **Code Comments**: All files are well-documented
- **Angular Docs**: https://angular.dev
- **Material UI**: https://material.angular.io

## ✅ Verification Checklist

After setup, verify:

- [ ] Application runs on http://localhost:4200
- [ ] You can login with demo accounts
- [ ] Dashboard shows statistics
- [ ] You can navigate between pages
- [ ] Projects list is visible
- [ ] Role-based menus work (try different users)
- [ ] No console errors

## 🎉 You're Ready!

The application is now running with:
- ✅ Full authentication system
- ✅ Role-based access control
- ✅ Project management
- ✅ Student management  
- ✅ Import system
- ✅ Responsive Material UI

**Happy coding! 🚀**
