-- ============================================
-- AAKAM HRMS - DATABASE SCHEMA
-- MODULE 1 + MODULE 2 + MODULE 3 + MODULE 4
-- MODULE 5 - TRAINING
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
-- PERFORMANCE REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS performance_reviews (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES employees(id),

    reviewer_id INTEGER
        REFERENCES employees(id),

    review_period_start DATE NOT NULL,

    review_period_end DATE NOT NULL,

    rating INTEGER
        CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),

    status VARCHAR(30)
        NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'IN_REVIEW', 'COMPLETED')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        employee_id,
        review_period_start,
        review_period_end
    ),

    CHECK (
        review_period_start <= review_period_end
    )
);


CREATE TABLE IF NOT EXISTS performance_goals (
    id SERIAL PRIMARY KEY,

    performance_review_id INTEGER NOT NULL
        REFERENCES performance_reviews(id)
        ON DELETE CASCADE,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    target TEXT,

    status VARCHAR(30)
        NOT NULL DEFAULT 'NOT_STARTED'
        CHECK (
            status IN (
                'NOT_STARTED',
                'IN_PROGRESS',
                'COMPLETED'
            )
        ),

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        performance_review_id,
        title
    )
);


CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id
    ON performance_reviews(employee_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer_id
    ON performance_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_status
    ON performance_reviews(status);

CREATE INDEX IF NOT EXISTS idx_performance_goals_review_id
    ON performance_goals(performance_review_id);


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

    UNIQUE(
        employee_id,
        attendance_date
    )
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


CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_runs_payroll_month
    ON payroll_runs(payroll_month);


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


-- ============================================
-- MODULE 3 - BRANCHES
-- ============================================

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    branch_name VARCHAR(150) NOT NULL,

    branch_code VARCHAR(30) NOT NULL,

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100)
        DEFAULT 'India',

    email VARCHAR(150),

    phone VARCHAR(30),

    status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        company_id,
        branch_code
    )
);


-- ============================================
-- MODULE 4 - NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,

    sender_name VARCHAR(150) NOT NULL,

    recipient_type VARCHAR(30)
        NOT NULL DEFAULT 'ALL',

    message TEXT NOT NULL,

    is_read BOOLEAN
        NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,

    client_code VARCHAR(30) NOT NULL UNIQUE,

    client_name VARCHAR(150) NOT NULL,

    contact_person VARCHAR(150),

    email VARCHAR(150),

    phone VARCHAR(30),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100)
        DEFAULT 'India',

    status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_department_id
    ON employees(department_id);

CREATE INDEX IF NOT EXISTS idx_job_positions_department_id
    ON job_positions(department_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id
    ON leave_requests(employee_id);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id
    ON attendance_records(employee_id);

CREATE INDEX IF NOT EXISTS idx_candidates_job_position_id
    ON candidates(job_position_id);

CREATE INDEX IF NOT EXISTS idx_branches_company_id
    ON branches(company_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
    ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_clients_status
    ON clients(status);


-- ============================================
-- ONBOARDING
-- ============================================

CREATE TABLE IF NOT EXISTS onboardings (
    id SERIAL PRIMARY KEY,

    onboarding_code VARCHAR(40) NOT NULL UNIQUE,

    candidate_id INTEGER NOT NULL
        REFERENCES candidates(id),

    employee_id INTEGER
        REFERENCES employees(id),

    expected_joining_date DATE NOT NULL,

    actual_joining_date DATE,

    department_id INTEGER NOT NULL
        REFERENCES departments(id),

    status VARCHAR(30)
        NOT NULL DEFAULT 'INITIATED',

    document_verification_status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    asset_allocation_status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    system_access_status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    completion_date TIMESTAMP,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id SERIAL PRIMARY KEY,

    onboarding_id INTEGER NOT NULL
        REFERENCES onboardings(id)
        ON DELETE CASCADE,

    task_name VARCHAR(150) NOT NULL,

    description TEXT,

    owner VARCHAR(150),

    status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    due_date DATE,

    completed_at TIMESTAMP,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS onboarding_documents (
    id SERIAL PRIMARY KEY,

    onboarding_id INTEGER NOT NULL
        REFERENCES onboardings(id)
        ON DELETE CASCADE,

    document_name VARCHAR(150) NOT NULL,

    document_type VARCHAR(50)
        NOT NULL DEFAULT 'OTHER',

    status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING',

    verified_by VARCHAR(150),

    verified_at TIMESTAMP,

    remarks TEXT,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_onboardings_candidate_id
    ON onboardings(candidate_id);

CREATE INDEX IF NOT EXISTS idx_onboardings_employee_id
    ON onboardings(employee_id);

CREATE INDEX IF NOT EXISTS idx_onboardings_department_id
    ON onboardings(department_id);

CREATE INDEX IF NOT EXISTS idx_onboardings_status
    ON onboardings(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_onboarding_id
    ON onboarding_tasks(onboarding_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_documents_onboarding_id
    ON onboarding_documents(onboarding_id);


-- ============================================
-- MODULE 5 - TRAINING MANAGEMENT
-- ============================================


-- ============================================
-- TRAINING PROGRAMS
-- ============================================

CREATE TABLE IF NOT EXISTS training_programs (
    id SERIAL PRIMARY KEY,

    course_name VARCHAR(150) NOT NULL,

    category VARCHAR(100) NOT NULL,

    trainer VARCHAR(150) NOT NULL,

    duration VARCHAR(100) NOT NULL,

    cost NUMERIC(12,2)
        NOT NULL DEFAULT 0
        CHECK (cost >= 0),

    mode VARCHAR(30)
        NOT NULL
        CHECK (
            mode IN (
                'ONLINE',
                'OFFLINE',
                'HYBRID'
            )
        ),

    assessment TEXT,

    description TEXT,

    status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- EMPLOYEE TRAINING ENROLLMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS training_enrollments (
    id SERIAL PRIMARY KEY,

    training_program_id INTEGER NOT NULL
        REFERENCES training_programs(id)
        ON DELETE CASCADE,

    employee_id INTEGER NOT NULL
        REFERENCES employees(id)
        ON DELETE CASCADE,

    status VARCHAR(30)
        NOT NULL DEFAULT 'ASSIGNED'
        CHECK (
            status IN (
                'ASSIGNED',
                'REGISTERED',
                'ATTENDED',
                'COMPLETED',
                'ASSESSMENT',
                'CERTIFICATE'
            )
        ),

    assigned_date DATE
        NOT NULL DEFAULT CURRENT_DATE,

    registered_date DATE,

    attended_date DATE,

    completed_date DATE,

    assessment_score NUMERIC(5,2)
        CHECK (
            assessment_score IS NULL
            OR (
                assessment_score >= 0
                AND assessment_score <= 100
            )
        ),

    assessment_result VARCHAR(30)
        CHECK (
            assessment_result IS NULL
            OR assessment_result IN (
                'PASS',
                'FAIL'
            )
        ),

    certificate_name VARCHAR(150),

    certificate_url TEXT,

    certificate_date DATE,

    remarks TEXT,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        training_program_id,
        employee_id
    )
);


-- ============================================
-- EMPLOYEE SKILL DEVELOPMENT
-- ============================================

CREATE TABLE IF NOT EXISTS employee_skills (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES employees(id)
        ON DELETE CASCADE,

    training_enrollment_id INTEGER
        REFERENCES training_enrollments(id)
        ON DELETE SET NULL,

    skill_name VARCHAR(150) NOT NULL,

    skill_level VARCHAR(30)
        NOT NULL DEFAULT 'BEGINNER'
        CHECK (
            skill_level IN (
                'BEGINNER',
                'INTERMEDIATE',
                'ADVANCED',
                'EXPERT'
            )
        ),

    acquired_date DATE,

    remarks TEXT,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        employee_id,
        skill_name
    )
);


-- ============================================
-- TRAINING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_training_programs_category
    ON training_programs(category);

CREATE INDEX IF NOT EXISTS idx_training_programs_status
    ON training_programs(status);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_program_id
    ON training_enrollments(training_program_id);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_employee_id
    ON training_enrollments(employee_id);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_status
    ON training_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id
    ON employee_skills(employee_id);