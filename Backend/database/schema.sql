-- ============================================
-- AAKAM HRMS - DATABASE SCHEMA
-- MODULE 1 + MODULE 2 + MODULE 3
-- ============================================

-- ============================================
-- DEPARTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    code VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- EMPLOYEES
-- ============================================

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,

    employee_code VARCHAR(30) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(150) NOT NULL UNIQUE,

    department_id INTEGER
        REFERENCES departments(id),

    joining_date DATE NOT NULL,

    employment_status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE',

    employment_type VARCHAR(30)
        NOT NULL DEFAULT 'FULL_TIME',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- OPEN JOB POSITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS job_positions (
    id SERIAL PRIMARY KEY,

    title VARCHAR(150) NOT NULL,

    department_id INTEGER
        REFERENCES departments(id),

    openings INTEGER
        NOT NULL DEFAULT 1,

    status VARCHAR(30)
        NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- LEAVE REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES employees(id),

    leave_type VARCHAR(50) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- DAILY ATTENDANCE
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES employees(id),

    attendance_date DATE NOT NULL,

    status VARCHAR(30) NOT NULL,

    check_in TIME,

    check_out TIME,

    UNIQUE(employee_id, attendance_date)
);


-- ============================================
-- RECRUITMENT CANDIDATES
-- ============================================

CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(150),

    job_position_id INTEGER
        REFERENCES job_positions(id),

    stage VARCHAR(50)
        NOT NULL DEFAULT 'APPLIED',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- PAYROLL RUNS
-- ============================================

CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,

    payroll_month DATE NOT NULL,

    status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    pending_approvals INTEGER
        NOT NULL DEFAULT 0,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- MODULE 3 - COMPANIES
-- ============================================

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,

    company_code VARCHAR(30) NOT NULL UNIQUE,

    legal_name VARCHAR(150) NOT NULL,

    display_name VARCHAR(150),

    registration_number VARCHAR(100),

    pan VARCHAR(20),

    tan VARCHAR(20),

    gstin VARCHAR(30),

    email VARCHAR(150),

    phone VARCHAR(30),

    address TEXT,

    logo_url TEXT,

    financial_year_start DATE,

    payroll_frequency VARCHAR(30)
        NOT NULL DEFAULT 'MONTHLY',

    status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);