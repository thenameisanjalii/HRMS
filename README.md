# 🏢 Human Resource Management System (HRMS)

A full-stack **Human Resource Management System (HRMS)** built with the **MERN stack** to streamline employee management, attendance, leave management, remuneration, document handling, performance evaluation, and role-based access control.

The system provides a centralized platform for organizations to manage employee-related operations while ensuring that users can access only the features and resources permitted by their roles.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* JWT-based authentication
* Secure password hashing using **bcrypt**
* Login using username or email
* Protected backend routes
* Role-based access control (RBAC)
* Dynamic database-driven permissions
* Role hierarchy and validation
* Admin-controlled permission management
* Component-level and feature-level access control

### 👨‍💼 Employee Management

* Create and manage employee profiles
* Employee ID management
* Department and designation management
* Employment information
* Reporting manager hierarchy
* Bank details
* Emergency contact information
* Employee documents
* Profile photo management
* Employee activation/deactivation

### 🕐 Attendance Management

* Employee attendance tracking
* Full-day and half-day attendance
* Attendance records
* Attendance-related dashboard information

### 🏖️ Leave Management

* Apply for leave
* Leave approval/rejection workflow
* Leave balance tracking
* Casual leave management
* On-duty leave
* Leave without pay
* Leave history

### 💰 Remuneration & Payroll

* Employee salary information
* Basic salary
* HRA
* Allowances
* Deductions
* Variable remuneration
* Pay slip management

### 📄 Document & E-Filing Management

* Employee document management
* Resume uploads
* Offer letter uploads
* Identity documents
* Other HR-related documents
* File storage and retrieval

### ⭐ Peer Rating

* Employee peer evaluation
* Peer rating management
* Performance-related feedback

### 📅 Holiday Management

* Organization-wide holiday management
* Holiday records
* Integration with HR operations

### 📊 Dashboard

Provides centralized HR information such as:

* Employee statistics
* Attendance information
* Leave information
* Pending requests
* Remuneration-related information
* Other HR metrics

### ⚙️ Admin Panel

Administrators can manage:

* Users
* Roles
* Permissions
* Components
* Features
* Access control

Permissions are stored in MongoDB, allowing administrators to dynamically configure access without modifying application code.

---

# 🛠️ Tech Stack

## Frontend

* **React.js**
* **Vite**
* JavaScript
* React Context API
* REST API integration
* Lucide React Icons

## Backend

* **Node.js**
* **Express.js**
* REST APIs
* JWT
* bcryptjs
* CORS
* dotenv

## Database

* **MongoDB**
* **Mongoose**

## Development & Deployment

* Git
* GitHub
* Vercel / Node.js-compatible hosting
* Environment variables

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React + Vite    │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                         HTTP / REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Express.js       │
                    │     Backend API      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
          JWT Authentication  RBAC       Validation
                │              │              │
                └──────────────┼──────────────┘
                               │
                               ▼
                       ┌──────────────┐
                       │   Mongoose   │
                       │     ODM      │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   MongoDB    │
                       └──────────────┘
```

---

# 🔐 Authentication Flow

The application uses **JWT-based authentication**.

```text
User
 │
 ▼
Login Form
 │
 ▼
POST /api/auth/login
 │
 ▼
Find User in MongoDB
 │
 ▼
bcrypt Password Verification
 │
 ▼
Generate JWT
 │
 ▼
Frontend receives token
 │
 ▼
Token sent with API requests
 │
 ▼
JWT Middleware verifies token
 │
 ▼
Authenticated User
```

Passwords are never stored as plain text. They are hashed using bcrypt before being stored in MongoDB.

---

# 🛡️ Role-Based Access Control

The HRMS implements role-based access control to restrict system functionality according to user responsibilities.

Example roles include:

```text
ADMIN
CEO
INCUBATION_MANAGER
ACCOUNTANT
OFFICER_IN_CHARGE
FACULTY_IN_CHARGE
EMPLOYEE
```

Permissions can be configured dynamically through the Admin Panel.

### Example

```text
                    ADMIN
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Employee Module    Admin Module
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
      View  Edit  Delete
       ✓     ✓      ✓


                    EMPLOYEE
                      │
                      ▼
                Employee Module
                      │
                 ┌────┴────┐
                 ▼         ▼
                View      Edit
                 ✓          ✗
```

This provides fine-grained control over what each role can access.

---

# 🔑 Permission Architecture

The application supports both **role-level** and **feature/component-level** authorization.

```text
User
 │
 ▼
Role
 │
 ▼
RolePermission
 │
 ├── Component Permissions
 │
 └── Feature Permissions
          │
          ▼
      Frontend UI
```

For example:

```text
employee.view
employee.create
employee.update
employee.delete
```

An administrator can enable or disable individual permissions for a particular role.

---

# 📂 Project Structure

```text
HRMS/
│
├── backend/
│   │
│   ├── config/
│   │   └── database configuration
│   │
│   ├── lib/
│   │   └── shared utilities
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validateRole.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   ├── Holiday.js
│   │   ├── PeerRating.js
│   │   ├── RolePermission.js
│   │   ├── VariableRemuneration.js
│   │   └── FileTransfer.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── attendance.js
│   │   ├── leave.js
│   │   ├── dashboard.js
│   │   ├── efiling.js
│   │   ├── peerRating.js
│   │   ├── remuneration.js
│   │   ├── variableRemuneration.js
│   │   ├── holidays.js
│   │   └── admin.js
│   │
│   ├── uploads/
│   │
│   ├── server.js
│   ├── seed.js
│   ├── seedRoles.js
│   └── package.json
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.js
│
├── ROLE_MANAGEMENT_GUIDE.md
├── hrms_nitrrfie.users.json
└── README.md
```

---

# 🗄️ Database Models

The application uses MongoDB with Mongoose.

Major models include:

| Model                  | Purpose                       |
| ---------------------- | ----------------------------- |
| `User`                 | Employee and user information |
| `Attendance`           | Employee attendance records   |
| `Leave`                | Leave applications and status |
| `Holiday`              | Organization holidays         |
| `PeerRating`           | Employee peer evaluations     |
| `RolePermission`       | Role-based permissions        |
| `VariableRemuneration` | Variable compensation         |
| `FileTransfer`         | File/document management      |

---

# 👤 User Data Model

The `User` model contains multiple categories of employee information.

```text
User
│
├── Authentication
│   ├── username
│   ├── email
│   ├── password
│   └── role
│
├── Profile
│   ├── firstName
│   ├── lastName
│   ├── phone
│   ├── DOB
│   ├── gender
│   ├── address
│   └── emergencyContact
│
├── Employment
│   ├── employeeId
│   ├── designation
│   ├── department
│   ├── joiningDate
│   ├── employmentType
│   └── reportingTo
│
├── Salary
│   ├── basic
│   ├── HRA
│   ├── allowances
│   └── deductions
│
├── Documents
│   ├── Aadhaar
│   ├── PAN
│   ├── Resume
│   └── Offer Letter
│
├── Bank Details
│
└── Leave Balance
```

---

# 🔄 Leave Management Workflow

```text
Employee
   │
   ▼
Apply for Leave
   │
   ▼
Leave Request Created
   │
   ▼
Manager / Authorized User
   │
   ├───────────────┐
   ▼               ▼
Approve          Reject
   │
   ▼
Leave Balance
Updated
```

---

# 📄 File Management

Employee-related documents are stored using the backend upload system.

```text
Frontend
   │
   ▼
Upload Document
   │
   ▼
Express Backend
   │
   ▼
backend/uploads/
   │
   ▼
File Path Stored
   │
   ▼
MongoDB
```

The backend exposes uploaded files through the `/uploads` route.

---

# 🔌 API Structure

The backend provides REST APIs organized by functionality.

```text
/api/auth
/api/users
/api/attendance
/api/leave
/api/dashboard
/api/efiling
/api/peer-rating
/api/remuneration
/api/variable-remuneration
/api/holidays
/api/admin
```

### Example

```http
POST /api/auth/login
```

```http
GET /api/users
```

```http
GET /api/attendance
```

```http
POST /api/leave
```

```http
GET /api/dashboard
```

---

# ⚙️ Installation & Setup

## 1. Clone the repository

```bash
git clone https://github.com/thenameisanjalii/HRMS.git
cd HRMS
```

---

## 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

JWT_EXPIRE=30d

FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

or:

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the required environment configuration if needed and configure the backend API URL.

Start the development server:

```bash
npm run dev
```

The frontend will generally be available at:

```text
http://localhost:5173
```

---

# 🌱 Database Seeding

The backend includes seed scripts for initializing application data.

For example:

```bash
node seed.js
```

and:

```bash
node seedRoles.js
```

These can be used to initialize users, roles and permissions during development.

---

# 🔒 Environment Variables

Never commit sensitive environment variables to GitHub.

Example:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Add `.env` to `.gitignore`.

---

# 🧪 Development Workflow

A typical development workflow is:

```text
1. Start MongoDB
       ↓
2. Start Express backend
       ↓
3. Start React frontend
       ↓
4. Login
       ↓
5. JWT authentication
       ↓
6. Permission retrieval
       ↓
7. Role-aware navigation
       ↓
8. Access HRMS modules
```

---

# 🔐 Security Considerations

The application implements several security practices:

* Password hashing using bcrypt
* JWT authentication
* Protected API routes
* Role-based authorization
* Dynamic permission management
* Role validation
* Environment-based secrets
* Password exclusion from user responses
* CORS configuration

Frontend permission checks are used for UI control, while backend middleware is responsible for enforcing actual authorization.

---

# 📈 Future Improvements

Potential improvements include:

* Refresh token implementation
* HTTP-only secure cookies for authentication
* Two-factor authentication
* Email notifications
* Automated payslip generation
* Advanced attendance analytics
* Payroll automation
* Audit logs
* Advanced HR reports
* Cloud-based document storage
* File type and size validation
* Rate limiting
* API request validation using Joi/Zod
* Automated testing
* Dockerization
* CI/CD pipeline
* Redis caching
* Production-grade centralized logging

---

# 🎯 Learning Outcomes

This project demonstrates practical experience with:

* Full-stack MERN development
* REST API development
* MongoDB data modeling
* Mongoose
* JWT authentication
* Password hashing
* Express middleware
* Role-Based Access Control
* Dynamic permission systems
* React Context API
* File uploads
* CRUD operations
* Business workflow implementation
* Environment configuration
* Modular backend architecture

---

# 👩‍💻 Project Highlights

### Full-Stack Architecture

Built using a separated React frontend and Node/Express backend communicating through REST APIs.

### Secure Authentication

Implemented JWT-based authentication with bcrypt password hashing and protected routes.

### Dynamic RBAC

Implemented database-driven role and permission management allowing administrators to control access dynamically.

### Modular HR Operations

Integrated employee management, attendance, leave, remuneration, documents, holidays and peer evaluation into a unified platform.

### Scalable Structure

Backend functionality is separated into models, routes, middleware and configuration, making the application easier to maintain and extend.

---

# 📌 Project Status

🚧 **Active Development**

The project can be extended with additional HR workflows, analytics, notifications, automated payroll and production-grade security features.

---

# 📄 License

This project is intended for educational and organizational HR management purposes.

---

## ⭐ Acknowledgements

Built using the MERN ecosystem and modern web development practices.

If you find this project useful, consider giving the repository a ⭐ on GitHub.
