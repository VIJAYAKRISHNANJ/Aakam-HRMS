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