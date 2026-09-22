-- AAKAM HRMS: RBAC data scopes (safe to run more than once)
-- Keep historical migrations immutable; this migration completes the ownership model.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS reporting_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_reporting_manager_id
  ON employees(reporting_manager_id);

-- Departments and clients are company-owned resources too.
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);

-- The server derives client scope from this relationship, never from a request body.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- Client-owned requirements and submitted candidates.  These are additive so the
-- existing recruitment API continues to work while client isolation is enabled.
ALTER TABLE job_positions
  ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_job_positions_client_id ON job_positions(client_id);

-- Backfill company ownership from the strongest existing parent links where possible.
UPDATE employees e SET company_id = d.company_id
FROM departments d
WHERE e.company_id IS NULL AND e.department_id = d.id AND d.company_id IS NOT NULL;

UPDATE job_positions jp SET company_id = d.company_id
FROM departments d
WHERE jp.company_id IS NULL AND jp.department_id = d.id AND d.company_id IS NOT NULL;

UPDATE candidates c SET company_id = jp.company_id
FROM job_positions jp
WHERE c.company_id IS NULL AND c.job_position_id = jp.id AND jp.company_id IS NOT NULL;

UPDATE onboardings o SET company_id = c.company_id
FROM candidates c
WHERE o.company_id IS NULL AND o.candidate_id = c.id AND c.company_id IS NOT NULL;

-- Permissions missing from the original seed.
INSERT INTO permissions (name, description) VALUES
  ('candidates.create', 'Create candidates'),
  ('candidates.update', 'Update candidates'),
  ('candidates.delete', 'Delete candidates'),
  ('interviews.view', 'View interviews'),
  ('interviews.create', 'Schedule interviews'),
  ('interviews.update', 'Update interviews'),
  ('interviews.delete', 'Delete interviews'),
  ('interviews.evaluate', 'Evaluate interviews'),
  ('offers.view', 'View offers'),
  ('offers.create', 'Create offers'),
  ('offers.update', 'Update offers'),
  ('offers.release', 'Release offers'),
  ('attendance.regularize', 'Request attendance regularization'),
  ('payroll.view.own', 'View own payslips'),
  ('exit.view.own', 'View own exit information'),
  ('deployment.view', 'View deployments'),
  ('deployment.create', 'Create deployments'),
  ('deployment.update', 'Update deployments'),
  ('deployment.delete', 'Delete deployments'),
  ('deployment.manage', 'Manage deployments'),
  ('deployment.view.own', 'View client deployments')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Reconcile the eight business roles.  This deliberately removes stale grants;
-- permissions are security policy, not additive sample data.
DELETE FROM role_permissions rp
USING roles r
WHERE rp.role_id = r.id
  AND r.name IN ('SUPER_ADMINISTRATOR','COMPANY_ADMINISTRATOR','HR_ADMINISTRATOR','RECRUITER','PAYROLL_ADMINISTRATOR','MANAGER','EMPLOYEE','CLIENT_USER');

WITH matrix(role_name, permission_name) AS (
  SELECT 'SUPER_ADMINISTRATOR', p.name FROM permissions p
  UNION ALL SELECT 'COMPANY_ADMINISTRATOR', unnest(ARRAY['users.view','users.create','users.update','users.role','employees.view','employees.create','employees.update','company.view','company.update','branches.view','branches.create','branches.update','branches.delete','departments.view','departments.create','departments.update','departments.delete','attendance.view','leave.view','leave.approve','onboarding.view','onboarding.create','onboarding.update','reports.view','reports.create','notifications.view','notifications.create'])
  UNION ALL SELECT 'HR_ADMINISTRATOR', unnest(ARRAY['employees.view','employees.create','employees.update','employees.delete','recruitment.view','recruitment.create','recruitment.update','recruitment.delete','recruitment.manage','candidates.view','candidates.create','candidates.update','candidates.delete','candidates.manage','onboarding.view','onboarding.create','onboarding.update','onboarding.delete','onboarding.manage','attendance.view','attendance.create','attendance.update','attendance.manage','leave.view','leave.create','leave.update','leave.approve','leave.manage','performance.view','performance.create','performance.update','performance.manage','training.view','training.create','training.update','training.manage','exit.view','exit.create','exit.update','exit.approve','exit.manage','reports.view','reports.create','notifications.view'])
  UNION ALL SELECT 'RECRUITER', unnest(ARRAY['clients.view','clients.create','clients.update','clients.delete','recruitment.view','recruitment.create','recruitment.update','recruitment.delete','recruitment.manage','candidates.view','candidates.create','candidates.update','candidates.delete','candidates.manage','interviews.view','interviews.create','interviews.update','interviews.delete','interviews.evaluate','offers.view','offers.create','offers.update','offers.release','reports.view'])
  UNION ALL SELECT 'PAYROLL_ADMINISTRATOR', unnest(ARRAY['employees.view','attendance.view','leave.view','payroll.view','payroll.create','payroll.update','payroll.delete','payroll.approve','payroll.manage','reports.view','reports.create'])
  UNION ALL SELECT 'MANAGER', unnest(ARRAY['employees.view','attendance.view','leave.view','leave.approve','performance.view','performance.create','performance.update','training.view','training.view.own','reports.view'])
  UNION ALL SELECT 'EMPLOYEE', unnest(ARRAY['employees.view.own','attendance.view.own','attendance.regularize','leave.view.own','leave.create','performance.view.own','training.view.own','payroll.view.own','exit.view.own','notifications.view'])
  UNION ALL SELECT 'CLIENT_USER', unnest(ARRAY['clients.view','recruitment.view','candidates.view','interviews.view','deployment.view.own','reports.view'])
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM matrix m
JOIN roles r ON r.name = m.role_name
JOIN permissions p ON p.name = m.permission_name
ON CONFLICT (role_id, permission_id) DO NOTHING;
