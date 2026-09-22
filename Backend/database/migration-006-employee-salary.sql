-- ============================================
-- AAKAM HRMS
-- MIGRATION 006 - EMPLOYEE SALARY MANAGEMENT
-- ============================================
--
-- Adds employee compensation/salary history.
--
-- Salary is intentionally kept separate from:
--   1. employees      -> employee master data
--   2. payroll_runs   -> monthly payroll workflow
--
-- This allows salary revisions to be retained as
-- historical records instead of overwriting salary data.
-- ============================================


BEGIN;


-- ============================================
-- EMPLOYEE SALARIES
-- ============================================

CREATE TABLE IF NOT EXISTS employee_salaries (
    id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL
        REFERENCES employees(id)
        ON DELETE CASCADE,

    -- Tenant ownership.
    -- This is deliberately stored on the salary record so
    -- salary queries can be tenant-scoped directly.
    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    -- Compensation figures.
    annual_ctc NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (annual_ctc >= 0),

    monthly_gross NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (monthly_gross >= 0),

    basic_salary NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (basic_salary >= 0),

    hra NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (hra >= 0),

    other_allowances NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (other_allowances >= 0),

    total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (total_deductions >= 0),

    net_salary NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (net_salary >= 0),

    -- Salary revision effective date.
    effective_from DATE NOT NULL,

    -- NULL means this is the current/latest salary record.
    effective_to DATE,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    -- Optional reason/reference for salary revisions.
    revision_reason VARCHAR(255),

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A salary period cannot end before it starts.
    CHECK (
        effective_to IS NULL
        OR effective_to >= effective_from
    ),

    -- Net salary cannot exceed monthly gross.
    CHECK (
        net_salary <= monthly_gross
    )
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee_id
    ON employee_salaries(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_company_id
    ON employee_salaries(company_id);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_effective_from
    ON employee_salaries(effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_status
    ON employee_salaries(status);


-- ============================================
-- ONE ACTIVE SALARY PER EMPLOYEE
-- ============================================
--
-- An employee can have many historical salary
-- records, but only one ACTIVE/current record.
--

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_salaries_one_active
    ON employee_salaries(employee_id)
    WHERE status = 'ACTIVE';


-- ============================================
-- PREVENT DUPLICATE SALARY PERIOD STARTS
-- ============================================
--
-- Two revisions for the same employee should not
-- have the exact same effective date.
--

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_salaries_employee_effective_date
    ON employee_salaries(employee_id, effective_from);


-- ============================================
-- TENANT INTEGRITY
-- ============================================
--
-- The employee referenced by employee_id must belong
-- to the same company as the salary record.
--
-- PostgreSQL cannot enforce this relationship with
-- the existing employees schema because employees
-- currently does not contain company_id.
--
-- Therefore company_id is application/SQL-scope
-- controlled for now.
--
-- This is intentionally documented here rather than
-- introducing an unsafe trigger or changing the
-- existing employees table in this migration.
-- ============================================


-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_employee_salaries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_employee_salaries_updated_at
    ON employee_salaries;


CREATE TRIGGER trg_employee_salaries_updated_at
BEFORE UPDATE ON employee_salaries
FOR EACH ROW
EXECUTE FUNCTION update_employee_salaries_updated_at();


COMMIT;


-- ============================================
-- MIGRATION 006 COMPLETE
-- ============================================