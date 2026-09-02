-- ============================================
-- AAKAM HRMS - ROLES & PERMISSIONS
-- ============================================

-- ============================================
-- INSERT PERMISSIONS
-- ============================================

-- Users Management
INSERT INTO permissions (name, description) VALUES
  ('users.view', 'View user list and details'),
  ('users.create', 'Create new users'),
  ('users.update', 'Update user information'),
  ('users.delete', 'Delete users'),
  ('users.role', 'Manage user roles');

-- Employees Management
INSERT INTO permissions (name, description) VALUES
  ('employees.view', 'View employee list and details'),
  ('employees.create', 'Create new employees'),
  ('employees.update', 'Update employee information'),
  ('employees.delete', 'Delete employees'),
  ('employees.view.own', 'View own employee profile');

-- Roles & Permissions Management
INSERT INTO permissions (name, description) VALUES
  ('roles.view', 'View roles'),
  ('roles.create', 'Create roles'),
  ('roles.update', 'Update roles'),
  ('roles.delete', 'Delete roles'),
  ('permissions.view', 'View permissions');

-- Company Management
INSERT INTO permissions (name, description) VALUES
  ('company.view', 'View company information'),
  ('company.create', 'Create companies'),
  ('company.update', 'Update company information'),
  ('company.delete', 'Delete companies');

-- Branches Management
INSERT INTO permissions (name, description) VALUES
  ('branches.view', 'View branches'),
  ('branches.create', 'Create branches'),
  ('branches.update', 'Update branches'),
  ('branches.delete', 'Delete branches');

-- Departments Management
INSERT INTO permissions (name, description) VALUES
  ('departments.view', 'View departments'),
  ('departments.create', 'Create departments'),
  ('departments.update', 'Update departments'),
  ('departments.delete', 'Delete departments');

-- Recruitment
INSERT INTO permissions (name, description) VALUES
  ('recruitment.view', 'View recruitment data'),
  ('recruitment.create', 'Create job positions and candidates'),
  ('recruitment.update', 'Update recruitment data'),
  ('recruitment.delete', 'Delete recruitment data'),
  ('recruitment.manage', 'Full recruitment management'),
  ('candidates.view', 'View candidates'),
  ('candidates.manage', 'Manage candidates');

-- Onboarding
INSERT INTO permissions (name, description) VALUES
  ('onboarding.view', 'View onboarding records'),
  ('onboarding.create', 'Create onboarding records'),
  ('onboarding.update', 'Update onboarding records'),
  ('onboarding.delete', 'Delete onboarding records'),
  ('onboarding.manage', 'Full onboarding management');

-- Payroll
INSERT INTO permissions (name, description) VALUES
  ('payroll.view', 'View payroll data'),
  ('payroll.create', 'Create payroll runs'),
  ('payroll.update', 'Update payroll data'),
  ('payroll.delete', 'Delete payroll data'),
  ('payroll.approve', 'Approve payroll runs'),
  ('payroll.manage', 'Full payroll management');

-- Attendance
INSERT INTO permissions (name, description) VALUES
  ('attendance.view', 'View attendance records'),
  ('attendance.create', 'Create attendance records'),
  ('attendance.update', 'Update attendance records'),
  ('attendance.delete', 'Delete attendance records'),
  ('attendance.manage', 'Full attendance management'),
  ('attendance.view.own', 'View own attendance');

-- Leave Management
INSERT INTO permissions (name, description) VALUES
  ('leave.view', 'View leave requests'),
  ('leave.create', 'Request leaves'),
  ('leave.update', 'Update leave records'),
  ('leave.delete', 'Delete leave records'),
  ('leave.approve', 'Approve leave requests'),
  ('leave.manage', 'Full leave management'),
  ('leave.view.own', 'View own leave');

-- Performance Management
INSERT INTO permissions (name, description) VALUES
  ('performance.view', 'View performance reviews'),
  ('performance.create', 'Create performance reviews'),
  ('performance.update', 'Update performance reviews'),
  ('performance.delete', 'Delete performance reviews'),
  ('performance.manage', 'Full performance management'),
  ('performance.view.own', 'View own performance');

-- Training
INSERT INTO permissions (name, description) VALUES
  ('training.view', 'View training programs'),
  ('training.create', 'Create training programs'),
  ('training.update', 'Update training programs'),
  ('training.delete', 'Delete training programs'),
  ('training.manage', 'Full training management'),
  ('training.view.own', 'View own training');

-- Exit Management
INSERT INTO permissions (name, description) VALUES
  ('exit.view', 'View exit records'),
  ('exit.create', 'Create exit records'),
  ('exit.update', 'Update exit records'),
  ('exit.delete', 'Delete exit records'),
  ('exit.approve', 'Approve exit requests'),
  ('exit.manage', 'Full exit management');

-- Reports
INSERT INTO permissions (name, description) VALUES
  ('reports.view', 'View reports'),
  ('reports.create', 'Generate reports');

-- Audit & Notifications
INSERT INTO permissions (name, description) VALUES
  ('audit_logs.view', 'View audit logs'),
  ('notifications.view', 'View notifications'),
  ('notifications.create', 'Create notifications'),
  ('notifications.delete', 'Delete notifications');

-- ============================================
-- INSERT ROLES
-- ============================================

-- 1. SUPER_ADMINISTRATOR - Full platform access
INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMINISTRATOR', 'Full platform access - can manage all entities across all companies');

-- 2. COMPANY_ADMINISTRATOR - Can manage company-wide resources
INSERT INTO roles (name, description) VALUES
  ('COMPANY_ADMINISTRATOR', 'Company-wide administrator - can manage company resources and users');

-- 3. HR_ADMINISTRATOR - HR management
INSERT INTO roles (name, description) VALUES
  ('HR_ADMINISTRATOR', 'HR functions - manages employees, recruitment, onboarding, attendance, leave, performance, training, exit');

-- 4. RECRUITER - Recruitment management
INSERT INTO roles (name, description) VALUES
  ('RECRUITER', 'Recruitment specialist - manages job positions, candidates, and interviews');

-- 5. PAYROLL_ADMINISTRATOR - Payroll management
INSERT INTO roles (name, description) VALUES
  ('PAYROLL_ADMINISTRATOR', 'Payroll management - manages salary, payroll runs, and statutory calculations');

-- 6. MANAGER - Team management
INSERT INTO roles (name, description) VALUES
  ('MANAGER', 'Manager - can access own/team information, approve leave and attendance');

-- 7. EMPLOYEE - Self-service employee
INSERT INTO roles (name, description) VALUES
  ('EMPLOYEE', 'Employee - self-service access to own profile, attendance, leave, payslips, performance');

-- 8. CLIENT_USER - Client-restricted access
INSERT INTO roles (name, description) VALUES
  ('CLIENT_USER', 'Client user - restricted access to recruitment and deployment information');

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- SUPER_ADMINISTRATOR: ALL PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMINISTRATOR'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- COMPANY_ADMINISTRATOR: Company-wide management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'COMPANY_ADMINISTRATOR'
  AND p.name IN (
    'users.view', 'users.create', 'users.update', 'users.role',
    'employees.view', 'employees.create', 'employees.update',
    'branches.view', 'branches.create', 'branches.update',
    'departments.view', 'departments.create', 'departments.update',
    'company.view', 'company.update',
    'reports.view', 'audit_logs.view',
    'attendance.view', 'leave.view',
    'onboarding.view', 'onboarding.create', 'onboarding.update',
    'recruitment.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR_ADMINISTRATOR: HR management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR_ADMINISTRATOR'
  AND p.name IN (
    'employees.view', 'employees.create', 'employees.update', 'employees.delete',
    'recruitment.view', 'recruitment.create', 'recruitment.update', 'recruitment.manage', 'candidates.view', 'candidates.manage',
    'onboarding.view', 'onboarding.create', 'onboarding.update', 'onboarding.delete', 'onboarding.manage',
    'attendance.view', 'attendance.create', 'attendance.update', 'attendance.manage',
    'leave.view', 'leave.create', 'leave.update', 'leave.approve', 'leave.manage',
    'performance.view', 'performance.create', 'performance.update', 'performance.manage',
    'training.view', 'training.create', 'training.update', 'training.manage',
    'exit.view', 'exit.create', 'exit.update', 'exit.manage',
    'departments.view', 'branches.view',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- RECRUITER: Recruitment management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'RECRUITER'
  AND p.name IN (
    'recruitment.view', 'recruitment.create', 'recruitment.update', 'recruitment.manage',
    'candidates.view', 'candidates.manage',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PAYROLL_ADMINISTRATOR: Payroll management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PAYROLL_ADMINISTRATOR'
  AND p.name IN (
    'payroll.view', 'payroll.create', 'payroll.update', 'payroll.approve', 'payroll.manage',
    'employees.view',
    'attendance.view',
    'leave.view',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MANAGER: Team management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER'
  AND p.name IN (
    'employees.view',
    'attendance.view',
    'leave.view', 'leave.approve',
    'performance.view', 'performance.create', 'performance.update',
    'training.view', 'training.view.own',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- EMPLOYEE: Self-service employee access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE'
  AND p.name IN (
    'employees.view.own',
    'attendance.view.own',
    'leave.view.own', 'leave.create',
    'performance.view.own',
    'training.view.own',
    'notifications.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CLIENT_USER: Restricted client access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT_USER'
  AND p.name IN (
    'recruitment.view',
    'candidates.view',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
