# Aakam HRMS Backend - Implementation Guide

## 1. DATABASE SETUP

### Run Migrations

Execute the migration files in order:

```bash
# Connect to PostgreSQL as superuser or admin
psql -U postgres -d aakam_hrms -f database/migration-001-add-tenant-isolation.sql

# Seed roles and permissions
psql -U postgres -d aakam_hrms -f database/roles-permissions-seed.sql

# Existing seed data (if not already run)
psql -U postgres -d aakam_hrms -f database/seed.sql
```

### Verify Schema

After running migrations, verify with:

```sql
-- Check permissions table
SELECT COUNT(*) FROM permissions;  -- Should be 60+

-- Check roles table
SELECT * FROM roles;  -- Should show 8 roles

-- Check role_permissions
SELECT COUNT(*) FROM role_permissions;  -- Should be 100+

-- Check new columns
\d users              -- Should have company_id column
\d employees          -- Should have company_id column
\d notifications      -- Should have user_id, company_id columns
```

---

## 2. ENVIRONMENT CONFIGURATION

Add/update `.env` file with:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aakam_hrms
DB_USER=postgres
DB_PASSWORD=<your-password>

JWT_SECRET=<your-very-long-random-secret-key>
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=12
AUTH_MAX_FAILED_LOGIN_ATTEMPTS=5
AUTH_LOCKOUT_MINUTES=15
PASSWORD_EXPIRY_DAYS=90

PORT=5000
NODE_ENV=development
```

---

## 3. INITIALIZE FIRST COMPANY AND SUPER ADMIN USER

```sql
-- Insert first company
INSERT INTO companies (
  company_code, legal_name, display_name, registration_number,
  payroll_frequency, status
) VALUES (
  'AAK001', 'Aakam Technologies', 'Aakam', 'REG123456', 'MONTHLY', 'ACTIVE'
) RETURNING id;

-- Note the company ID (let's assume it's 1)

-- Insert super admin user
INSERT INTO users (
  username, email, password_hash, first_name, last_name,
  is_active, company_id
) VALUES (
  'admin', 'admin@aakam.com',
  '$2b$12$...', -- Use bcrypt hashed password
  'System', 'Administrator',
  TRUE, 1
) RETURNING id;

-- Assign SUPER_ADMINISTRATOR role
INSERT INTO user_roles (user_id, role_id)
SELECT $1, id FROM roles WHERE name = 'SUPER_ADMINISTRATOR';

-- Assign company access
INSERT INTO user_companies (user_id, company_id)
VALUES ($1, 1);
```

---

## 4. START BACKEND SERVER

```bash
npm install                # Install dependencies (if not done)
npm run dev               # Start with auto-reload
# OR
npm start                 # Start in production mode
```

The backend should start on http://localhost:5000

Test health check:

```bash
curl http://localhost:5000/api/health
```

---

## 5. REMAINING CRITICAL TASKS

### 5.1 Apply Authorization to Protected Routes

The following routes need `authenticate` and `authorizePermissions` middleware applied:

**routes/employees.routes.js**

```javascript
// Top of file, add imports:
import {
  authenticate,
  authorizePermissions,
} from "../middleware/auth.middleware.js";

// Wrap all endpoints with authentication:
router.get(
  "/",
  authenticate,
  authorizePermissions("employees.view"),
  async (req, res) => {
    // Add company isolation:
    // WHERE company_id = $X (req.user.company_id or req.user.requestedCompanyId)
    // ...
  },
);
```

**Authorization Mapping:**

- GET /employees - `employees.view`
- POST /employees - `employees.create`
- PUT /employees/:id - `employees.update`
- DELETE /employees/:id - `employees.delete`

**routes/payroll.routes.js**

- GET /payroll - `payroll.view`
- POST /payroll - `payroll.create`
- PUT /payroll/:id - `payroll.update`
- POST /payroll/:id/process - `payroll.update`
- POST /payroll/:id/approve - `payroll.approve`
- POST /payroll/:id/complete - `payroll.update`

**routes/recruitment.routes.js**

- GET /recruitment/jobs - `recruitment.view`
- POST /recruitment/jobs - `recruitment.create`
- GET /recruitment/candidates - `candidates.view`
- POST /recruitment/candidates - `candidates.manage`

**routes/onboarding.routes.js**

- GET /onboarding - `onboarding.view`
- POST /onboarding - `onboarding.create`
- PUT /onboarding/:id - `onboarding.update`
- DELETE /onboarding/:id - `onboarding.delete` (already implemented)

**routes/users.routes.js** - Already has some authorization

- Review and ensure all endpoints are protected

**routes/company.routes.js, branches.routes.js, departments.routes.js**

- Apply appropriate authorization checks

### 5.2 Add Company Isolation to Queries

For EVERY database query in protected routes:

**Current (WRONG):**

```javascript
const result = await pool.query(`SELECT * FROM employees WHERE id = $1`, [id]);
```

**Updated (CORRECT):**

```javascript
// For single record
const result = await pool.query(
  `SELECT * FROM employees WHERE id = $1 AND company_id = $2`,
  [id, req.user.company_id || req.user.requestedCompanyId],
);

// For lists
const result = await pool.query(
  `SELECT * FROM employees WHERE company_id = $1`,
  [req.user.company_id || req.user.requestedCompanyId],
);
```

### 5.3 Add Audit Logging

Import the audit utility in routes:

```javascript
import { logAuditEvent, AUDIT_ACTIONS } from "../utils/audit.js";
```

Log critical actions:

```javascript
// After creating a user
await logAuditEvent(
  req.user.id,
  AUDIT_ACTIONS.USER_CREATED,
  "USER",
  newUser.id,
  { username: newUser.username, email: newUser.email },
);

// After approving payroll
await logAuditEvent(
  req.user.id,
  AUDIT_ACTIONS.PAYROLL_APPROVED,
  "PAYROLL_RUN",
  payrollId,
  { payrollMonth, approversRemaining: pendingApprovals },
);
```

### 5.4 Ensure INSERT Queries Include company_id

**Current (INCOMPLETE):**

```javascript
const result = await pool.query(
  `INSERT INTO employees (employee_code, first_name, last_name, email, joining_date)
   VALUES ($1, $2, $3, $4, $5)`,
  [employeeCode, firstName, lastName, email, joiningDate],
);
```

**Updated (CORRECT):**

```javascript
const result = await pool.query(
  `INSERT INTO employees (employee_code, first_name, last_name, email, joining_date, company_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [
    employeeCode,
    firstName,
    lastName,
    email,
    joiningDate,
    req.user.company_id || req.user.requestedCompanyId,
  ],
);
```

---

## 6. TESTING AUTHORIZATION

### Manual API Testing with cURL

**1. Login as Super Admin:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourPassword123"
  }'

# Response will include: { "token": "eyJhbGc..." }
export TOKEN="eyJhbGc..."
```

**2. Test Protected Endpoint:**

```bash
# Should work - Super admin has all permissions
curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer $TOKEN"

# Response: { "success": true, "data": [...], "total": N }
```

**3. Test Company Isolation:**

```bash
# Create second company and user
# Then login as that user and verify they see different data

curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer $TOKEN2"
# Should return DIFFERENT employees than company 1
```

**4. Test 401 Unauthenticated:**

```bash
curl -X GET http://localhost:5000/api/employees
# Response: { "success": false, "message": "Missing or invalid authorization token" }
```

**5. Test 403 Insufficient Permissions:**

```bash
# Login as EMPLOYEE role user
curl -X POST http://localhost:5000/api/employees \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "employeeCode": "EMP001", ... }'

# Response: { "success": false, "message": "Insufficient permission access" }
```

### Role Permission Matrix

| Endpoint                         | GET | POST | PUT | DELETE | Required Roles                   |
| -------------------------------- | --- | ---- | --- | ------ | -------------------------------- |
| /employees                       | ✓   | ✓    | ✓   | ✓      | HR_ADMIN, CO_ADMIN, SUPER_ADMIN  |
| /payroll                         | ✓   | ✓    | ✓   | -      | PAYROLL_ADMIN, SUPER_ADMIN       |
| /payroll/:id/approve             | -   | ✓    | -   | -      | PAYROLL_ADMIN, SUPER_ADMIN       |
| /recruitment/jobs                | ✓   | ✓    | ✓   | ✓      | RECRUITER, HR_ADMIN, SUPER_ADMIN |
| /candidates                      | ✓   | ✓    | ✓   | ✓      | RECRUITER, HR_ADMIN, SUPER_ADMIN |
| /onboarding                      | ✓   | ✓    | ✓   | ✓      | HR_ADMIN, SUPER_ADMIN            |
| /onboarding/:id/documents/:docId | -   | -    | -   | ✓      | HR_ADMIN, SUPER_ADMIN            |

---

## 7. DEPLOYMENT CHECKLIST

- [ ] All database migrations applied
- [ ] Roles and permissions seeded
- [ ] First company created
- [ ] Super admin user created
- [ ] All routes have `authenticate` middleware
- [ ] All protected routes have `authorizePermissions` checks
- [ ] All queries include company_id filtering
- [ ] All INSERT queries include company_id
- [ ] Audit logging implemented for critical actions
- [ ] Environment variables configured
- [ ] npm run check passes (no syntax errors)
- [ ] npm start runs without errors
- [ ] Health check endpoint responds
- [ ] Login endpoint works
- [ ] Protected endpoint returns 401 without token
- [ ] Protected endpoint returns 403 with insufficient permissions
- [ ] Cross-company isolation verified
- [ ] Delete endpoints return 403 for unauthorized users

---

## 8. TROUBLESHOOTING

### "Insufficient permission access" error

- Check if user has the required role
- Verify role_permissions table has the required permission
- Ensure permission name matches exactly

### "You do not have access to this company" error

- Verify user's company_id or user_companies entries
- Check X-Company-Id header value
- Ensure user belongs to the company

### "Cannot update COMPLETED payroll runs"

- This is by design - payroll in COMPLETED status is immutable
- Create a new payroll run for corrections if needed

### NULL company_id in records

- Need to apply migration and update existing records:

```sql
UPDATE employees SET company_id = 1 WHERE company_id IS NULL;
UPDATE users SET company_id = 1 WHERE company_id IS NULL;
-- Repeat for other tables
```

---

## 9. NEXT PHASE - SaaS ENHANCEMENTS

1. **Multi-company tenant isolation** - Fully tested and verified
2. **SSO/SAML support** - Add identity provider integration
3. **Role-based dashboards** - Different views per role
4. **Audit log API** - /api/audit-logs with authorization
5. **Session management** - Track concurrent logins
6. **IP whitelisting** - Per-company network restrictions
7. **Data export** - Compliance reporting with audit trail
8. **Backup/restore** - Per-company data backups
9. **Usage analytics** - Track API usage per company
10. **SLA monitoring** - Performance and uptime tracking

---

## 10. SUPPORT REFERENCES

- JWT Auth: utils/auth.js
- RBAC Middleware: middleware/auth.middleware.js
- Audit Logging: utils/audit.js
- Role Definitions: database/roles-permissions-seed.sql
- Migration: database/migration-001-add-tenant-isolation.sql

---

## Files Ready for Production

✓ routes/onboarding.routes.js - Delete endpoints implemented
✓ routes/notifications.routes.js - User/company scoped
✓ middleware/auth.middleware.js - Company isolation helpers
✓ utils/audit.js - Audit logging ready
✓ database/roles-permissions-seed.sql - 8 roles defined
✓ database/migration-001-add-tenant-isolation.sql - Schema ready

**Total Implementation Time: ~40% complete**
**Remaining work: Applying authorization to remaining routes (~60%)**
