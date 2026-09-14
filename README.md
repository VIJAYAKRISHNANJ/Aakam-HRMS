I have a full-stack project called "Aakam HRMS" (Aakam Human Resource Management System).

I want you to create a COMPLETE, PROFESSIONAL GitHub README.md for this project.

Use the same overall style, structure, formatting, emoji usage, and professional presentation as this example README:

# 🚀 VijayX StartupWin

A modern AI-powered startup valuation web application that helps founders estimate their startup's worth in minutes...

The README should NOT copy the VijayX content. Instead, create completely original content specifically for Aakam HRMS based on the actual project files I provide.

I have provided:
- Frontend project
- Backend project
- Project screenshots

IMPORTANT:
- Analyze the actual source code, package.json files, routes, services, components, database files, authentication implementation, and configuration before writing the README.
- Do NOT invent technologies, features, APIs, libraries, database functionality, authentication methods, or deployment platforms that are not actually present.
- Use the actual technologies found in the project.
- Do not mention technologies simply because they are common for this type of application.
- Do not claim a feature is implemented unless the source code supports it.
- Do not expose passwords, API keys, database credentials, JWT secrets, or other sensitive information.
- Do not include the contents of .env files.
- The README should describe the current working project, not planned/future functionality.

PROJECT NAME:
Aakam HRMS

PROJECT DESCRIPTION:
A modern full-stack Human Resource Management System designed to centralize and simplify HR operations including workforce management, organization management, recruitment, onboarding, payroll, performance, training, reporting, notifications, and administrative settings.

==================================================
README STRUCTURE
==================================================

Create the README with the following sections.

# 🚀 Aakam HRMS

Write a polished 2–3 paragraph introduction explaining what Aakam HRMS is, what problem it solves, and what HR operations it centralizes.

## 🚀 Live Demo

Include the deployed application URL if it is available from the project/configuration information I provide.

Use:

🔗 [**Aakam HRMS**](DEPLOYED_URL)

If the deployment URL cannot be reliably determined, use a placeholder rather than inventing one.

## 📸 Screenshots

Use the screenshots located in:

ScreenShots/

The current screenshots are:

- Login.png
- Dashboard.png
- Dashboard2.png / Recruitment.png depending on the final filename
- Organization.png
- Reports.png
- Settings.png

Create professional screenshot sections similar to:

### 🔐 Login

![Aakam HRMS Login](ScreenShots/Login.png)

### 📊 HR Dashboard

![Aakam HRMS Dashboard](ScreenShots/Dashboard.png)

### 🎯 Recruitment Management

![Aakam HRMS Recruitment](ScreenShots/Recruitment.png)

### 🏢 Organization Management

![Aakam HRMS Organization](ScreenShots/Organization.png)

### 📑 Reports

![Aakam HRMS Reports](ScreenShots/Reports.png)

### ⚙️ Settings

![Aakam HRMS Settings](ScreenShots/Settings.png)

Do not add screenshots that do not exist.

## ✨ Features

Create a comprehensive feature list based ONLY on the actual implementation.

Potential areas to verify from the code include:

- Employee/workforce management
- Organization management
- Company management
- Branch management
- Department management
- Recruitment
- Job positions
- Candidate management
- Recruitment pipeline
- Employee onboarding
- Payroll
- Performance management
- Training management
- Client management
- Exit management
- Notifications
- Reports
- Dashboard analytics
- Settings
- Authentication
- Authorization
- Role-based permissions
- Audit logging
- Tenant/company isolation
- CRUD operations
- Search/filter functionality
- Profile/details pages

Only include features that are actually implemented.

## 🏢 HR Modules

Explain the major modules individually.

### 👥 Workforce Management

Explain employee management based on the actual implementation.

### 🏢 Organization Management

Explain:
- Companies
- Branches
- Departments
- Organization structure

Only include the parts actually implemented.

### 🎯 Recruitment Management

Explain:
- Job positions
- Candidates
- Candidate profiles
- Recruitment pipeline
- Hiring stages

Only include implemented functionality.

### 📋 Onboarding

Explain the actual employee onboarding workflow.

### 💰 Payroll

Explain the implemented payroll functionality.

### 📊 Performance

Explain the implemented performance review/management functionality.

### 🎓 Training

Explain training programs, enrollments, assessments, completion tracking, etc., ONLY if implemented.

### 👥 Clients

Explain client management functionality if implemented.

### 🚪 Exit Management

Explain employee exit/exit-record functionality if implemented.

### 📑 Reports

Explain the reporting functionality and the types of HR information available.

### 🔔 Notifications

Explain the implemented notification system.

## 📊 Dashboard & Analytics

Describe the HR dashboard based on the actual implementation.

The dashboard may include information such as:

- Total employees
- New joiners
- Open positions
- Pending leave
- Employee headcount growth
- Department distribution
- Attendance
- Recruitment pipeline
- Payroll readiness
- Upcoming actions
- Recent HR activity

Verify these against the actual code before including them.

## 🔐 Authentication & Authorization

Explain the actual authentication implementation.

Inspect:
- Login
- Protected routes
- Authentication context
- JWT implementation
- Password hashing
- Authorization middleware
- Roles and permissions

Only describe what is actually implemented.

## 🛡️ Security

Describe actual security-related implementation, such as:

- Password hashing
- JWT authentication
- Protected routes
- Authorization middleware
- Role-based access
- Tenant isolation
- CORS
- Environment variables
- Audit logging

Do not claim security mechanisms that are not present.

## 🏗️ System Architecture

Create a clear explanation of the architecture.

Use a structure similar to:

Frontend
↓
REST API
↓
Backend
↓
PostgreSQL Database

Explain how the frontend communicates with the backend and how the backend interacts with the database.

Do not claim an ORM if the project does not actually use one.

## 🛠️ Tech Stack

This section is VERY IMPORTANT.

Determine the actual technology stack by inspecting package.json and source code.

Separate it into categories:

### Frontend

List all significant technologies actually used.

For example, verify:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React
- ESLint

Do not add libraries such as Framer Motion, Recharts, Redux, Zustand, etc. unless they are actually present in the project.

### Backend

Inspect Backend/package.json and source code.

The current backend should be checked for technologies such as:

- Node.js
- Express.js
- JavaScript
- PostgreSQL driver
- bcryptjs
- JSON Web Token
- dotenv
- CORS

Use the exact technologies actually found.

### Database

Inspect the database folder and schema.

Determine:
- Database technology
- Tables/entities
- Relationships
- Migrations
- Seed data
- Tenant isolation
- Roles/permissions

Do NOT claim Prisma or another ORM unless it actually exists.

### Development Tools

Include actual tools used, such as:
- Git
- GitHub
- VS Code
- ESLint

Only include relevant technologies.

### Deployment

Determine deployment platforms from actual project configuration and provided deployment information.

For example, check:
- Vercel configuration
- Render configuration
- vercel.json
- Backend deployment information

Do not invent deployment services.

## 📦 Installation

Create accurate installation instructions for BOTH frontend and backend.

Explain:

1. Clone repository
2. Navigate into frontend
3. Install frontend dependencies
4. Navigate into backend
5. Install backend dependencies
6. Configure environment variables
7. Configure PostgreSQL
8. Run the backend
9. Run the frontend

Use the actual npm scripts found in package.json.

Do not invent npm scripts.

## 🔑 Environment Variables

Inspect the source code for environment variable usage.

Create a safe example showing variable NAMES only.

Example:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=your_port
