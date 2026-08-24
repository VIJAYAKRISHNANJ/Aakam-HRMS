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
('2026-08-01', 'PROCESSING', 3);