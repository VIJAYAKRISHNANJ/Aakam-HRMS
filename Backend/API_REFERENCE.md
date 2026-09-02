# Aakam HRMS Backend - API Authorization Reference

## Authentication

All protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

Login to get token:

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## HTTP Status Codes

- **200 OK** - Successful request
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Authenticated but insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Business rule violation (e.g., duplicate email)
- **500 Internal Server Error** - Server error

---

## Role Reference

1. **SUPER_ADMINISTRATOR** - Full platform access
2. **COMPANY_ADMINISTRATOR** - Company-level management
3. **HR_ADMINISTRATOR** - HR and employee management
4. **RECRUITER** - Recruitment management
5. **PAYROLL_ADMINISTRATOR** - Payroll management
6. **MANAGER** - Team management
7. **EMPLOYEE** - Self-service employee
8. **CLIENT_USER** - Restricted client access

---

## Protected Endpoints

### Authentication & Users

| Method | Endpoint                  | Permission | Roles | Notes               |
| ------ | ------------------------- | ---------- | ----- | ------------------- |
| POST   | /api/auth/login           | -          | ALL   | No auth required    |
| GET    | /api/auth/me              | -          | AUTH  | Get current user    |
| POST   | /api/auth/logout          | -          | AUTH  | Logout current user |
| POST   | /api/auth/change-password | -          | AUTH  | Change own password |

### Employees

| Method | Endpoint           | Permission       | Roles                     | Notes                         |
| ------ | ------------------ | ---------------- | ------------------------- | ----------------------------- |
| GET    | /api/employees     | employees.view   | HR_ADMIN, CO_ADMIN, SUPER | List all employees in company |
| GET    | /api/employees/:id | employees.view   | HR_ADMIN, CO_ADMIN, SUPER | Get employee details          |
| POST   | /api/employees     | employees.create | HR_ADMIN, CO_ADMIN, SUPER | Create employee               |
| PUT    | /api/employees/:id | employees.update | HR_ADMIN, CO_ADMIN, SUPER | Update employee               |
| DELETE | /api/employees/:id | employees.delete | HR_ADMIN, SUPER           | Delete employee               |

### Users (Access Control)

| Method | Endpoint                      | Permission   | Roles           | Notes                    |
| ------ | ----------------------------- | ------------ | --------------- | ------------------------ |
| GET    | /api/users                    | users.view   | CO_ADMIN, SUPER | List users in company    |
| GET    | /api/users/:id                | users.view   | CO_ADMIN, SUPER | Get user details         |
| POST   | /api/users                    | users.create | CO_ADMIN, SUPER | Create user              |
| PUT    | /api/users/:id                | users.update | CO_ADMIN, SUPER | Update user              |
| PATCH  | /api/users/:id/status         | users.update | CO_ADMIN, SUPER | Activate/deactivate user |
| PATCH  | /api/users/:id/role           | users.role   | SUPER           | Assign roles to user     |
| POST   | /api/users/:id/reset-password | users.update | CO_ADMIN, SUPER | Reset user password      |

### Recruitment

| Method | Endpoint                              | Permission         | Roles                      | Notes                  |
| ------ | ------------------------------------- | ------------------ | -------------------------- | ---------------------- |
| GET    | /api/recruitment/jobs                 | recruitment.view   | RECRUITER, HR_ADMIN, SUPER | List job positions     |
| POST   | /api/recruitment/jobs                 | recruitment.create | RECRUITER, HR_ADMIN, SUPER | Create job position    |
| PUT    | /api/recruitment/jobs/:id             | recruitment.update | RECRUITER, HR_ADMIN, SUPER | Update job position    |
| DELETE | /api/recruitment/jobs/:id             | recruitment.delete | RECRUITER, HR_ADMIN, SUPER | Delete job position    |
| GET    | /api/recruitment/candidates           | candidates.view    | RECRUITER, HR_ADMIN, SUPER | List candidates        |
| POST   | /api/recruitment/candidates           | candidates.manage  | RECRUITER, HR_ADMIN, SUPER | Create candidate       |
| PUT    | /api/recruitment/candidates/:id       | candidates.manage  | RECRUITER, HR_ADMIN, SUPER | Update candidate       |
| PUT    | /api/recruitment/candidates/:id/stage | candidates.manage  | RECRUITER, HR_ADMIN, SUPER | Update candidate stage |
| DELETE | /api/recruitment/candidates/:id       | recruitment.delete | RECRUITER, HR_ADMIN, SUPER | Delete candidate       |

### Onboarding

| Method     | Endpoint                                 | Permission            | Roles               | Notes                           |
| ---------- | ---------------------------------------- | --------------------- | ------------------- | ------------------------------- |
| GET        | /api/onboarding                          | onboarding.view       | HR_ADMIN, SUPER     | List onboarding records         |
| GET        | /api/onboarding/:id                      | onboarding.view       | HR_ADMIN, SUPER     | Get onboarding details          |
| POST       | /api/onboarding                          | onboarding.create     | HR_ADMIN, SUPER     | Create onboarding               |
| PUT        | /api/onboarding/:id                      | onboarding.update     | HR_ADMIN, SUPER     | Update onboarding               |
| DELETE     | /api/onboarding/:id                      | onboarding.delete     | HR_ADMIN, SUPER     | Delete onboarding               |
| GET        | /api/onboarding/:id/documents            | onboarding.view       | HR_ADMIN, SUPER     | List documents                  |
| POST       | /api/onboarding/:id/documents            | onboarding.create     | HR_ADMIN, SUPER     | Create document                 |
| PUT        | /api/onboarding/:id/documents/:docId     | onboarding.update     | HR_ADMIN, SUPER     | Update document                 |
| **DELETE** | **/api/onboarding/:id/documents/:docId** | **onboarding.delete** | **HR_ADMIN, SUPER** | **Delete document ✓ NEW**       |
| GET        | /api/onboarding/:id/tasks                | onboarding.view       | HR_ADMIN, SUPER     | List tasks                      |
| POST       | /api/onboarding/:id/tasks                | onboarding.create     | HR_ADMIN, SUPER     | Create task                     |
| PUT        | /api/onboarding/:id/tasks/:taskId        | onboarding.update     | HR_ADMIN, SUPER     | Update task                     |
| **DELETE** | **/api/onboarding/:id/tasks/:taskId**    | **onboarding.delete** | **HR_ADMIN, SUPER** | **Delete task ✓ NEW**           |
| POST       | /api/onboarding/:id/create-employee      | onboarding.create     | HR_ADMIN, SUPER     | Create employee from onboarding |
| POST       | /api/onboarding/:id/join                 | onboarding.update     | HR_ADMIN, SUPER     | Mark as joined                  |
| POST       | /api/onboarding/:id/complete             | onboarding.update     | HR_ADMIN, SUPER     | Complete onboarding             |

### Payroll

| Method | Endpoint                  | Permission      | Roles                | Notes               |
| ------ | ------------------------- | --------------- | -------------------- | ------------------- |
| GET    | /api/payroll              | payroll.view    | PAYROLL_ADMIN, SUPER | List payroll runs   |
| GET    | /api/payroll/:id          | payroll.view    | PAYROLL_ADMIN, SUPER | Get payroll details |
| POST   | /api/payroll              | payroll.create  | PAYROLL_ADMIN, SUPER | Create payroll run  |
| PUT    | /api/payroll/:id          | payroll.update  | PAYROLL_ADMIN, SUPER | Update payroll      |
| POST   | /api/payroll/:id/process  | payroll.update  | PAYROLL_ADMIN, SUPER | Start processing    |
| POST   | /api/payroll/:id/approve  | payroll.approve | PAYROLL_ADMIN, SUPER | Record approval     |
| POST   | /api/payroll/:id/complete | payroll.update  | PAYROLL_ADMIN, SUPER | Complete payroll    |

### Notifications

| Method | Endpoint                        | Permission           | Roles | Notes                    |
| ------ | ------------------------------- | -------------------- | ----- | ------------------------ |
| GET    | /api/notifications              | notifications.view   | AUTH  | Get user's notifications |
| GET    | /api/notifications/unread-count | notifications.view   | AUTH  | Get unread count         |
| GET    | /api/notifications/:id          | notifications.view   | AUTH  | Get notification details |
| POST   | /api/notifications              | notifications.create | AUTH  | Create notification      |
| PUT    | /api/notifications/:id/read     | notifications.view   | AUTH  | Mark as read             |
| PUT    | /api/notifications/read-all     | notifications.view   | AUTH  | Mark all as read         |
| DELETE | /api/notifications/:id          | notifications.delete | AUTH  | Delete notification      |

### Leave Management

| Method | Endpoint               | Permission    | Roles                    | Notes                |
| ------ | ---------------------- | ------------- | ------------------------ | -------------------- |
| GET    | /api/leave             | leave.view    | AUTH                     | List leave requests  |
| POST   | /api/leave             | leave.create  | AUTH                     | Request leave        |
| PUT    | /api/leave/:id         | leave.update  | AUTH                     | Update leave request |
| POST   | /api/leave/:id/approve | leave.approve | MANAGER, HR_ADMIN, SUPER | Approve leave        |
| POST   | /api/leave/:id/reject  | leave.approve | MANAGER, HR_ADMIN, SUPER | Reject leave         |

### Attendance

| Method | Endpoint            | Permission        | Roles                    | Notes             |
| ------ | ------------------- | ----------------- | ------------------------ | ----------------- |
| GET    | /api/attendance     | attendance.view   | MANAGER, HR_ADMIN, SUPER | List attendance   |
| POST   | /api/attendance     | attendance.create | HR_ADMIN, SUPER          | Create attendance |
| PUT    | /api/attendance/:id | attendance.update | HR_ADMIN, SUPER          | Update attendance |

### Performance

| Method | Endpoint             | Permission         | Roles                    | Notes         |
| ------ | -------------------- | ------------------ | ------------------------ | ------------- |
| GET    | /api/performance     | performance.view   | MANAGER, HR_ADMIN, SUPER | List reviews  |
| POST   | /api/performance     | performance.create | MANAGER, HR_ADMIN, SUPER | Create review |
| PUT    | /api/performance/:id | performance.update | MANAGER, HR_ADMIN, SUPER | Update review |

### Training

| Method | Endpoint                      | Permission      | Roles           | Notes           |
| ------ | ----------------------------- | --------------- | --------------- | --------------- |
| GET    | /api/training                 | training.view   | AUTH            | List programs   |
| POST   | /api/training                 | training.create | HR_ADMIN, SUPER | Create program  |
| PUT    | /api/training/:id             | training.update | HR_ADMIN, SUPER | Update program  |
| POST   | /api/training/:id/enrollments | training.manage | HR_ADMIN, SUPER | Enroll employee |

### Exit Management

| Method | Endpoint               | Permission   | Roles           | Notes             |
| ------ | ---------------------- | ------------ | --------------- | ----------------- |
| GET    | /api/exits             | exit.view    | HR_ADMIN, SUPER | List exit records |
| POST   | /api/exits             | exit.create  | HR_ADMIN, SUPER | Create exit       |
| PUT    | /api/exits/:id         | exit.update  | HR_ADMIN, SUPER | Update exit       |
| POST   | /api/exits/:id/approve | exit.approve | HR_ADMIN, SUPER | Approve exit      |

### Company & Branches

| Method | Endpoint           | Permission      | Roles           | Notes          |
| ------ | ------------------ | --------------- | --------------- | -------------- |
| GET    | /api/companies     | company.view    | CO_ADMIN, SUPER | List companies |
| GET    | /api/companies/:id | company.view    | CO_ADMIN, SUPER | Get company    |
| POST   | /api/companies     | company.create  | SUPER           | Create company |
| PUT    | /api/companies/:id | company.update  | CO_ADMIN, SUPER | Update company |
| GET    | /api/branches      | branches.view   | CO_ADMIN, SUPER | List branches  |
| POST   | /api/branches      | branches.create | CO_ADMIN, SUPER | Create branch  |
| PUT    | /api/branches/:id  | branches.update | CO_ADMIN, SUPER | Update branch  |

### Reports

| Method | Endpoint                 | Permission   | Roles                      | Notes              |
| ------ | ------------------------ | ------------ | -------------------------- | ------------------ |
| GET    | /api/reports/summary     | reports.view | MANAGER+, SUPER            | Dashboard summary  |
| GET    | /api/reports/workforce   | reports.view | MANAGER+, SUPER            | Workforce report   |
| GET    | /api/reports/payroll     | reports.view | PAYROLL_ADMIN, SUPER       | Payroll report     |
| GET    | /api/reports/recruitment | reports.view | RECRUITER, HR_ADMIN, SUPER | Recruitment report |

### Audit Logs (Admin Only)

| Method | Endpoint                         | Permission      | Roles | Notes                |
| ------ | -------------------------------- | --------------- | ----- | -------------------- |
| GET    | /api/audit-logs                  | audit_logs.view | SUPER | List all audit logs  |
| GET    | /api/audit-logs/entity/:type/:id | audit_logs.view | AUTH  | Get audit for entity |
| GET    | /api/audit-logs/user/:userId     | audit_logs.view | AUTH  | Get user's actions   |

---

## Common Request Headers

```
Authorization: Bearer <token>           # Required for protected endpoints
Content-Type: application/json          # For POST/PUT requests
X-Company-Id: 1                         # Optional, defaults to user's company
```

---

## Common Response Format

**Success (2xx):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error (4xx/5xx):**

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Error Response Examples

**401 Unauthorized - Missing token:**

```json
{
  "success": false,
  "message": "Missing or invalid authorization token"
}
```

**403 Forbidden - Insufficient permissions:**

```json
{
  "success": false,
  "message": "Insufficient permission access"
}
```

**403 Forbidden - Company isolation:**

```json
{
  "success": false,
  "message": "You do not have access to this company"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Resource not found"
}
```

**409 Conflict - Business rule:**

```json
{
  "success": false,
  "message": "Completed payroll runs cannot be updated"
}
```

---

## Frontend Integration Checklist

- [ ] Store JWT token securely (httpOnly cookie or secure storage)
- [ ] Include Authorization header in all API requests
- [ ] Handle 401 response by redirecting to login
- [ ] Handle 403 response by showing "Access Denied" message
- [ ] Display UI elements only for roles with permissions
- [ ] Disable buttons for actions user cannot perform
- [ ] Pass X-Company-Id header if supporting multiple companies
- [ ] Show user's role and permissions on dashboard
- [ ] Implement logout functionality
- [ ] Refresh token before expiry (8 hours)

---

## Special Notes

- **Deleted Onboarding Documents/Tasks** ✓ NEW - Now supported via DELETE endpoints
- **Payroll Approval** - pending_approvals must reach 0 before completion
- **Company Isolation** - All queries automatically scoped to user's company
- **Audit Logging** - Critical actions are logged automatically
- **Notification Scoping** - Users see only their own notifications

---

## Support

For issues or questions:

1. Check error message and HTTP status code
2. Verify user has required role/permission
3. Check company isolation (X-Company-Id header)
4. Review auth.middleware.js for authorization logic
5. Check audit logs for failed action details
