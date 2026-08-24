-- ============================================
-- AAKAM HRMS - MODULE 1 DATABASE SCHEMA
-- ============================================

-- Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(150) NOT NULL UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    joining_date DATE NOT NULL,
    employment_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    employment_type VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Open job positions
CREATE TABLE job_positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    openings INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily attendance
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    check_in TIME,
    check_out TIME,
    UNIQUE(employee_id, attendance_date)
);

-- Recruitment candidates
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    job_position_id INTEGER REFERENCES job_positions(id),
    stage VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll runs
CREATE TABLE payroll_runs (
    id SERIAL PRIMARY KEY,
    payroll_month DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    pending_approvals INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);