-- AAKAM HRMS: canonical login roles and compatible permission grants.
-- This migration preserves existing role IDs and assignments. It deliberately
-- fails instead of merging/deleting records when a conflicting duplicate role
-- already exists, so production data is never silently discarded.

DO $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM roles legacy
  JOIN roles canonical
    ON canonical.name = UPPER(REPLACE(legacy.name, ' ', '_'))
  WHERE legacy.name IN (
    'Super Administrator', 'Company Administrator', 'HR Administrator',
    'Recruiter', 'Payroll Administrator', 'Manager', 'Employee', 'Client User'
  );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Canonical role migration stopped: duplicate canonical role records require manual reconciliation';
  END IF;
END $$;

UPDATE roles
SET name = UPPER(REPLACE(name, ' ', '_'))
WHERE name IN (
  'Super Administrator', 'Company Administrator', 'HR Administrator',
  'Recruiter', 'Payroll Administrator', 'Manager', 'Employee', 'Client User'
);

INSERT INTO permissions (name, description) VALUES
  ('users.view', 'View user accounts'), ('users.create', 'Create user accounts'),
  ('users.update', 'Update user accounts'), ('users.role', 'Change user roles'),
  ('employees.view', 'View employees'), ('employees.create', 'Create employees'),
  ('employees.update', 'Update employees'), ('employees.delete', 'Delete employees'),
  ('employees.view.own', 'View own employee profile'),
  ('company.view', 'View companies'), ('company.create', 'Create companies'),
  ('company.update', 'Update companies'), ('company.delete', 'Delete companies'),
  ('branches.view', 'View branches'), ('branches.create', 'Create branches'),
  ('branches.update', 'Update branches'), ('branches.delete', 'Delete branches'),
  ('departments.view', 'View departments'), ('departments.create', 'Create departments'),
  ('departments.update', 'Update departments'), ('departments.delete', 'Delete departments'),
  ('candidates.view', 'View candidates'), ('candidates.create', 'Create candidates'),
  ('candidates.update', 'Update candidates'), ('candidates.delete', 'Delete candidates'),
  ('payroll.view.own', 'View own permitted payroll information'),
  ('exit.view.own', 'View own exit information')
ON CONFLICT (name) DO NOTHING;

-- Additive grants preserve any pre-existing legitimate custom grants.
WITH grants(role_name, permission_name) AS (
  VALUES
    ('SUPER_ADMINISTRATOR', 'users.view'), ('SUPER_ADMINISTRATOR', 'users.create'),
    ('SUPER_ADMINISTRATOR', 'users.update'), ('SUPER_ADMINISTRATOR', 'users.role'),
    ('COMPANY_ADMINISTRATOR', 'users.view'), ('COMPANY_ADMINISTRATOR', 'users.create'),
    ('COMPANY_ADMINISTRATOR', 'users.update'), ('COMPANY_ADMINISTRATOR', 'users.role'),
    ('COMPANY_ADMINISTRATOR', 'employees.view'), ('COMPANY_ADMINISTRATOR', 'employees.create'),
    ('COMPANY_ADMINISTRATOR', 'employees.update'), ('COMPANY_ADMINISTRATOR', 'company.view'),
    ('COMPANY_ADMINISTRATOR', 'company.update'), ('HR_ADMINISTRATOR', 'employees.view'),
    ('HR_ADMINISTRATOR', 'employees.create'), ('HR_ADMINISTRATOR', 'employees.update'),
    ('HR_ADMINISTRATOR', 'employees.delete'), ('RECRUITER', 'candidates.view'),
    ('RECRUITER', 'candidates.create'), ('RECRUITER', 'candidates.update'),
    ('RECRUITER', 'candidates.delete'), ('EMPLOYEE', 'employees.view.own'),
    ('EMPLOYEE', 'payroll.view.own'), ('EMPLOYEE', 'exit.view.own')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM grants g
JOIN roles r ON r.name = g.role_name
JOIN permissions p ON p.name = g.permission_name
ON CONFLICT (role_id, permission_id) DO NOTHING;
