-- ============================================
-- AAKAM HRMS - MODULE 1 DEVELOPMENT DATA
-- ============================================

-- Departments
INSERT INTO departments (name, code) VALUES
('Engineering', 'ENG'),
('Operations', 'OPS'),
('Sales', 'SAL'),
('Human Resources', 'HR')
ON CONFLICT DO NOTHING;


-- Employees
INSERT INTO employees
(employee_code, first_name, last_name, email, department_id, joining_date, employment_status, employment_type)
VALUES
('AAK001', 'Arun', 'Kumar', 'arun.kumar@aakam.com', 1, '2024-01-15', 'ACTIVE', 'FULL_TIME'),
('AAK002', 'Priya', 'Sharma', 'priya.sharma@aakam.com', 1, '2024-03-10', 'ACTIVE', 'FULL_TIME'),
('AAK003', 'Rahul', 'Menon', 'rahul.menon@aakam.com', 2, '2024-05-20', 'ACTIVE', 'FULL_TIME'),
('AAK004', 'Sneha', 'Rao', 'sneha.rao@aakam.com', 2, '2024-07-01', 'ACTIVE', 'FULL_TIME'),
('AAK005', 'Karthik', 'Raj', 'karthik.raj@aakam.com', 3, '2025-01-10', 'ACTIVE', 'FULL_TIME'),
('AAK006', 'Divya', 'Krishnan', 'divya.krishnan@aakam.com', 4, '2025-02-15', 'ACTIVE', 'FULL_TIME'),
('AAK007', 'Vishal', 'Patel', 'vishal.patel@aakam.com', 1, '2025-04-05', 'ACTIVE', 'FULL_TIME'),
('AAK008', 'Meena', 'Iyer', 'meena.iyer@aakam.com', 4, '2025-06-12', 'ACTIVE', 'FULL_TIME'),
('AAK009', 'Naveen', 'Kumar', 'naveen.kumar@aakam.com', 1, '2025-08-20', 'ACTIVE', 'FULL_TIME'),
('AAK010', 'Anjali', 'Nair', 'anjali.nair@aakam.com', 3, '2025-09-01', 'ACTIVE', 'FULL_TIME');


-- Performance reviews
INSERT INTO performance_reviews
(employee_id, reviewer_id, review_period_start, review_period_end, rating, status)
SELECT employee.id, reviewer.id, seed.review_period_start, seed.review_period_end, seed.rating, seed.status
FROM (VALUES
	('AAK001', 'AAK006', DATE '2026-01-01', DATE '2026-06-30', 4, 'IN_REVIEW'),
	('AAK002', 'AAK006', DATE '2025-07-01', DATE '2025-12-31', 5, 'COMPLETED'),
	('AAK003', 'AAK001', DATE '2026-01-01', DATE '2026-06-30', 3, 'DRAFT')
) AS seed(employee_code, reviewer_code, review_period_start, review_period_end, rating, status)
INNER JOIN employees employee ON employee.employee_code = seed.employee_code
INNER JOIN employees reviewer ON reviewer.employee_code = seed.reviewer_code
ON CONFLICT (employee_id, review_period_start, review_period_end) DO NOTHING;

INSERT INTO performance_goals
(performance_review_id, title, description, target, status)
SELECT review.id, seed.title, seed.description, seed.target, seed.status
FROM (VALUES
	('AAK001', DATE '2026-01-01', DATE '2026-06-30', 'Improve release reliability', 'Reduce production rollback incidents.', 'Less than 2 rollback incidents per quarter.', 'IN_PROGRESS'),
	('AAK002', DATE '2025-07-01', DATE '2025-12-31', 'Mentor engineering peers', 'Support junior team members through regular coaching.', 'Complete 6 mentoring sessions.', 'COMPLETED'),
	('AAK003', DATE '2026-01-01', DATE '2026-06-30', 'Improve operational response time', 'Document and streamline incident response.', 'Publish an updated response playbook.', 'NOT_STARTED')
) AS seed(employee_code, review_period_start, review_period_end, title, description, target, status)
INNER JOIN employees employee ON employee.employee_code = seed.employee_code
INNER JOIN performance_reviews review
	ON review.employee_id = employee.id
	AND review.review_period_start = seed.review_period_start
	AND review.review_period_end = seed.review_period_end
ON CONFLICT (performance_review_id, title) DO NOTHING;


-- Open Job Positions
INSERT INTO job_positions (title, department_id, openings, status) VALUES
('Senior Software Engineer', 1, 3, 'OPEN'),
('Frontend Developer', 1, 2, 'OPEN'),
('HR Executive', 4, 1, 'OPEN'),
('Sales Manager', 3, 2, 'OPEN');


-- Leave Requests
INSERT INTO leave_requests
(employee_id, leave_type, start_date, end_date, status)
VALUES
(1, 'CASUAL', '2026-08-20', '2026-08-21', 'PENDING'),
(2, 'SICK', '2026-08-21', '2026-08-21', 'PENDING'),
(3, 'ANNUAL', '2026-08-25', '2026-08-26', 'APPROVED'),
(4, 'CASUAL', '2026-08-22', '2026-08-22', 'PENDING');


-- Today's Attendance
INSERT INTO attendance_records
(employee_id, attendance_date, status, check_in, check_out)
VALUES
(1, CURRENT_DATE, 'PRESENT', '09:05', '18:10'),
(2, CURRENT_DATE, 'PRESENT', '09:15', '18:00'),
(3, CURRENT_DATE, 'PRESENT', '08:55', '17:45'),
(4, CURRENT_DATE, 'PRESENT', '09:20', '18:15'),
(5, CURRENT_DATE, 'PRESENT', '09:00', '18:05'),
(6, CURRENT_DATE, 'PRESENT', '09:10', '18:00'),
(7, CURRENT_DATE, 'ABSENT', NULL, NULL),
(8, CURRENT_DATE, 'PRESENT', '09:25', '18:20'),
(9, CURRENT_DATE, 'PRESENT', '08:50', '17:50'),
(10, CURRENT_DATE, 'PRESENT', '09:05', '18:00');


-- Recruitment Candidates
INSERT INTO candidates
(name, email, job_position_id, stage)
VALUES
('Ravi Kumar', 'ravi@example.com', 1, 'INTERVIEW'),
('Pooja Singh', 'pooja@example.com', 2, 'SCREENING'),
('Sanjay Rao', 'sanjay@example.com', 1, 'OFFER'),
('Lakshmi Nair', 'lakshmi@example.com', 3, 'APPLIED');


-- Payroll
INSERT INTO payroll_runs
(payroll_month, status, pending_approvals)
VALUES
('2026-08-01', 'PROCESSING', 3),
('2026-09-01', 'PENDING', 0)
ON CONFLICT (payroll_month) DO NOTHING;


-- Clients
INSERT INTO clients
(client_code, client_name, contact_person, email, phone, address, city, state, country, status)
VALUES
('AAKCL001', 'TechNova Solutions', 'Ananya Mehta', 'ananya.mehta@technova.example', '+91 98765 43210', '12 Residency Road', 'Bengaluru', 'Karnataka', 'India', 'ACTIVE'),
('AAKCL002', 'GreenField Enterprises', 'Rohan Kapoor', 'rohan.kapoor@greenfield.example', '+91 98123 45678', '45 Park Street', 'Kolkata', 'West Bengal', 'India', 'ACTIVE'),
('AAKCL003', 'BluePeak Technologies', 'Nisha Menon', 'nisha.menon@bluepeak.example', '+91 97654 32109', '8 Anna Salai', 'Chennai', 'Tamil Nadu', 'India', 'INACTIVE')
ON CONFLICT (client_code) DO NOTHING;


-- Onboarding
INSERT INTO onboardings
(onboarding_code, candidate_id, expected_joining_date, department_id, status)
SELECT
	'ONB001',
	c.id,
	'2026-09-15',
	1,
	'DOCUMENTS_PENDING'
FROM candidates c
WHERE c.email = 'lakshmi@example.com'
	AND EXISTS (SELECT 1 FROM departments WHERE id = 1)
	AND NOT EXISTS (
		SELECT 1 FROM onboardings WHERE onboarding_code = 'ONB001'
	);

INSERT INTO onboarding_tasks
(onboarding_id, task_name, description, owner, status, due_date)
SELECT
	o.id,
	'Collect identity proof',
	'Collect and review the candidate identity document.',
	'HR Operations',
	'PENDING',
	'2026-09-10'
FROM onboardings o
WHERE o.onboarding_code = 'ONB001'
	AND NOT EXISTS (
		SELECT 1
		FROM onboarding_tasks t
		WHERE t.onboarding_id = o.id
			AND t.task_name = 'Collect identity proof'
	);

INSERT INTO onboarding_documents
(onboarding_id, document_name, document_type, status)
SELECT
	o.id,
	'Identity Proof',
	'IDENTITY_PROOF',
	'PENDING'
FROM onboardings o
WHERE o.onboarding_code = 'ONB001'
	AND NOT EXISTS (
		SELECT 1
		FROM onboarding_documents d
		WHERE d.onboarding_id = o.id
			AND d.document_type = 'IDENTITY_PROOF'
	);


-- ============================================
-- EXIT MANAGEMENT DEVELOPMENT DATA
-- ============================================

INSERT INTO exit_records
(employee_id, resignation_date, exit_reason, notice_period, last_working_date, approval_status, exit_status, remarks)
SELECT
	employee.id,
	seed.resignation_date,
	seed.exit_reason,
	seed.notice_period,
	seed.last_working_date,
	seed.approval_status,
	seed.exit_status,
	seed.remarks
FROM (VALUES
	('AAK009', DATE '2026-08-10', 'Career transition', 30, DATE '2026-09-09', 'APPROVED', 'NOTICE_PERIOD', 'Knowledge transfer is in progress.'),
	('AAK010', DATE '2026-02-05', 'Relocation', 30, DATE '2026-03-07', 'APPROVED', 'COMPLETED', 'Exit completed and documents issued.')
) AS seed(employee_code, resignation_date, exit_reason, notice_period, last_working_date, approval_status, exit_status, remarks)
INNER JOIN employees employee
	ON employee.employee_code = seed.employee_code
ON CONFLICT DO NOTHING;

INSERT INTO exit_checklist_items (exit_id, item_type, status, owner, completed_date, remarks)
SELECT
	exit_record.id,
	checklist.item_type,
	CASE
		WHEN exit_record.exit_status = 'COMPLETED' THEN 'COMPLETED'
		WHEN checklist.item_type = 'KNOWLEDGE_TRANSFER' THEN 'IN_PROGRESS'
		ELSE 'PENDING'
	END,
	'HR Operations',
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN exit_record.last_working_date ELSE NULL END,
	NULL
FROM exit_records exit_record
INNER JOIN employees employee ON employee.id = exit_record.employee_id
CROSS JOIN (VALUES
	('KNOWLEDGE_TRANSFER'),
	('ASSET_CLEARANCE'),
	('ATTENDANCE_CLEARANCE'),
	('LEAVE_CLEARANCE'),
	('PAYROLL_CLEARANCE'),
	('FULL_AND_FINAL_SETTLEMENT'),
	('EXPERIENCE_LETTER'),
	('RELIEVING_LETTER')
) AS checklist(item_type)
WHERE employee.employee_code IN ('AAK009', 'AAK010')
ON CONFLICT (exit_id, item_type) DO NOTHING;

INSERT INTO exit_settlements (exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks)
SELECT
	exit_record.id,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN 'COMPLETED' ELSE 'PENDING' END,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN exit_record.last_working_date ELSE NULL END,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN 85000 ELSE 0 END,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN 5000 ELSE 0 END,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN 80000 ELSE 0 END,
	NULL
FROM exit_records exit_record
INNER JOIN employees employee ON employee.id = exit_record.employee_id
WHERE employee.employee_code IN ('AAK009', 'AAK010')
ON CONFLICT (exit_id) DO NOTHING;

INSERT INTO exit_documents (exit_id, document_type, status, document_date, reference, remarks)
SELECT
	exit_record.id,
	document.document_type,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN 'ISSUED' ELSE 'PENDING' END,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN exit_record.last_working_date ELSE NULL END,
	CASE WHEN exit_record.exit_status = 'COMPLETED' THEN 'DOC-' || exit_record.id || '-' || document.document_type ELSE NULL END,
	NULL
FROM exit_records exit_record
INNER JOIN employees employee ON employee.id = exit_record.employee_id
CROSS JOIN (VALUES ('EXPERIENCE_LETTER'), ('RELIEVING_LETTER')) AS document(document_type)
WHERE employee.employee_code IN ('AAK009', 'AAK010')
ON CONFLICT (exit_id, document_type) DO NOTHING;


-- ============================================
-- AUTHENTICATION & SECURITY SEED DATA
-- ============================================

INSERT INTO roles (name, description)
VALUES
	('Super Administrator', 'Full system access across all Aakam HRMS modules.'),
	('Company Administrator', 'Manages company-level configuration and operations.'),
	('HR Administrator', 'Manages employees, HR operations, onboarding, offboarding and reporting.'),
	('Recruiter', 'Manages job positions, candidates and recruitment workflows.'),
	('Payroll Administrator', 'Manages payroll runs, approvals and payroll reporting.'),
	('Manager', 'Oversees team performance, approvals and operational dashboards.'),
	('Employee', 'Standard employee self-service access.'),
	('Client User', 'Limited client-facing access.' )
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description)
VALUES
	('dashboard.view', 'View dashboard data and widgets.'),
	('dashboard.manage', 'Manage dashboard configuration and admin widgets.'),
	('workforce.view', 'View workforce and employee records.'),
	('workforce.create', 'Create employee and workforce records.'),
	('workforce.update', 'Update employee and workforce records.'),
	('workforce.delete', 'Delete employee and workforce records where permitted.'),
	('workforce.manage', 'Full workforce management access.'),
	('companies.view', 'View company records.'),
	('companies.create', 'Create company records.'),
	('companies.update', 'Update company records.'),
	('companies.delete', 'Delete company records where permitted.'),
	('companies.manage', 'Full company management access.'),
	('branches.view', 'View branch records.'),
	('branches.create', 'Create branch records.'),
	('branches.update', 'Update branch records.'),
	('branches.delete', 'Delete branch records where permitted.'),
	('branches.manage', 'Full branch management access.'),
	('departments.view', 'View department records.'),
	('departments.create', 'Create department records.'),
	('departments.update', 'Update department records.'),
	('departments.delete', 'Delete department records where permitted.'),
	('departments.manage', 'Full department management access.'),
	('recruitment.view', 'View recruitment jobs and candidates.'),
	('recruitment.create', 'Create recruitment jobs and candidate records.'),
	('recruitment.update', 'Update recruitment jobs and candidate records.'),
	('recruitment.delete', 'Delete recruitment jobs and candidate records where permitted.'),
	('recruitment.approve', 'Approve recruitment workflow decisions.'),
	('recruitment.manage', 'Full recruitment management access.'),
	('clients.view', 'View client records.'),
	('clients.create', 'Create client records.'),
	('clients.update', 'Update client records.'),
	('clients.delete', 'Delete client records where permitted.'),
	('clients.manage', 'Full client management access.'),
	('onboarding.view', 'View onboarding records and tasks.'),
	('onboarding.create', 'Create onboarding workflows.'),
	('onboarding.update', 'Update onboarding workflows.'),
	('onboarding.delete', 'Delete onboarding records where permitted.'),
	('onboarding.approve', 'Approve onboarding workflow steps.'),
	('onboarding.manage', 'Full onboarding management access.'),
	('payroll.view', 'View payroll runs and payroll data.'),
	('payroll.create', 'Create payroll runs.'),
	('payroll.update', 'Update payroll runs.'),
	('payroll.delete', 'Delete payroll runs where permitted.'),
	('payroll.approve', 'Approve payroll operations.'),
	('payroll.manage', 'Full payroll management access.'),
	('performance.view', 'View performance reviews and goals.'),
	('performance.create', 'Create performance reviews and goals.'),
	('performance.update', 'Update performance reviews and goals.'),
	('performance.delete', 'Delete performance records where permitted.'),
	('performance.approve', 'Approve performance workflow decisions.'),
	('performance.manage', 'Full performance management access.'),
	('training.view', 'View training programs and enrollments.'),
	('training.create', 'Create training programs and enrollments.'),
	('training.update', 'Update training programs and enrollments.'),
	('training.delete', 'Delete training programs and enrollments where permitted.'),
	('training.approve', 'Approve training workflow actions.'),
	('training.manage', 'Full training management access.'),
	('reports.view', 'View analytical and operational reports.'),
	('reports.manage', 'Manage report configuration and exports.'),
	('notifications.view', 'View notifications.'),
	('notifications.create', 'Create notifications.'),
	('notifications.update', 'Update notifications.'),
	('notifications.delete', 'Delete notifications where permitted.'),
	('notifications.manage', 'Full notification management access.'),
	('offboarding.view', 'View exit and offboarding records.'),
	('offboarding.create', 'Create offboarding records.'),
	('offboarding.update', 'Update offboarding records.'),
	('offboarding.delete', 'Delete offboarding records where permitted.'),
	('offboarding.approve', 'Approve offboarding workflow actions.'),
	('offboarding.manage', 'Full offboarding management access.'),
	('settings.view', 'View settings and account administration.'),
	('settings.create', 'Create settings-related records.'),
	('settings.update', 'Update settings-related records.'),
	('settings.delete', 'Delete settings-related records where permitted.'),
	('settings.manage', 'Manage settings, roles and security configuration.'),
	('profile.view', 'View own profile details.'),
	('profile.update', 'Update own profile details.'),
	('profile.manage', 'Update own profile and password.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
	ON (
		(r.name = 'Super Administrator')
		OR (r.name = 'Company Administrator' AND p.name IN (
			'dashboard.view', 'dashboard.manage',
			'workforce.view', 'workforce.create', 'workforce.update', 'workforce.manage',
			'companies.view', 'companies.create', 'companies.update', 'companies.manage',
			'branches.view', 'branches.create', 'branches.update', 'branches.manage',
			'departments.view', 'departments.create', 'departments.update', 'departments.manage',
			'recruitment.view', 'recruitment.create', 'recruitment.update', 'recruitment.approve', 'recruitment.manage',
			'clients.view', 'clients.create', 'clients.update', 'clients.manage',
			'onboarding.view', 'onboarding.create', 'onboarding.update', 'onboarding.approve', 'onboarding.manage',
			'payroll.view', 'payroll.create', 'payroll.update', 'payroll.approve', 'payroll.manage',
			'performance.view', 'performance.create', 'performance.update', 'performance.approve', 'performance.manage',
			'training.view', 'training.create', 'training.update', 'training.approve', 'training.manage',
			'reports.view', 'reports.manage',
			'notifications.view', 'notifications.create', 'notifications.update', 'notifications.manage',
			'offboarding.view', 'offboarding.create', 'offboarding.update', 'offboarding.approve', 'offboarding.manage',
			'settings.view', 'settings.update', 'settings.manage',
			'profile.view', 'profile.update', 'profile.manage'
		))
		OR (r.name = 'HR Administrator' AND p.name IN (
			'dashboard.view',
			'workforce.view', 'workforce.create', 'workforce.update', 'workforce.manage',
			'departments.view', 'departments.create', 'departments.update', 'departments.manage',
			'recruitment.view', 'recruitment.create', 'recruitment.update', 'recruitment.approve', 'recruitment.manage',
			'onboarding.view', 'onboarding.create', 'onboarding.update', 'onboarding.approve', 'onboarding.manage',
			'performance.view', 'performance.create', 'performance.update', 'performance.approve', 'performance.manage',
			'training.view', 'training.create', 'training.update', 'training.approve', 'training.manage',
			'reports.view',
			'notifications.view', 'notifications.create', 'notifications.update', 'notifications.manage',
			'offboarding.view', 'offboarding.create', 'offboarding.update', 'offboarding.approve', 'offboarding.manage',
			'profile.view', 'profile.update', 'profile.manage'
		))
		OR (r.name = 'Recruiter' AND p.name IN (
			'dashboard.view',
			'recruitment.view', 'recruitment.create', 'recruitment.update', 'recruitment.manage',
			'onboarding.view', 'onboarding.create', 'onboarding.update',
			'notifications.view',
			'profile.view', 'profile.update', 'profile.manage'
		))
		OR (r.name = 'Payroll Administrator' AND p.name IN (
			'dashboard.view',
			'payroll.view', 'payroll.create', 'payroll.update', 'payroll.approve', 'payroll.manage',
			'reports.view',
			'notifications.view',
			'offboarding.view',
			'profile.view', 'profile.update', 'profile.manage'
		))
		OR (r.name = 'Manager' AND p.name IN (
			'dashboard.view',
			'workforce.view',
			'performance.view', 'performance.update', 'performance.approve',
			'training.view',
			'reports.view',
			'notifications.view',
			'profile.view', 'profile.update', 'profile.manage'
		))
		OR (r.name = 'Employee' AND p.name IN (
			'dashboard.view',
			'performance.view',
			'training.view',
			'notifications.view',
			'profile.view', 'profile.update', 'profile.manage'
		))
		OR (r.name = 'Client User' AND p.name IN (
			'clients.view',
			'profile.view', 'profile.update', 'profile.manage'
		))
	)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Development user setup is intentionally manual.
-- Roles and permissions are seeded automatically, but no administrator or employee
-- account is auto-created or auto-assigned by application startup.
