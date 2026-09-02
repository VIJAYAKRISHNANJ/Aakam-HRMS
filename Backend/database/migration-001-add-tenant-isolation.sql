-- ============================================
-- MIGRATION: Add Company/Tenant Isolation
-- ============================================

-- Add company_id to users table (for tenant/company scope)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Add company_id to employees table (for tenant/company scope)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);

-- Create user_companies junction table for multi-company support
CREATE TABLE IF NOT EXISTS user_companies (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);

-- Add company_id to onboardings table (for tenant/company scope)
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_onboardings_company_id ON onboardings(company_id);

-- Add company_id to candidates table (for tenant/company scope)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_candidates_company_id ON candidates(company_id);

-- Add company_id to payroll_runs table (for tenant/company scope)
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_payroll_runs_company_id ON payroll_runs(company_id);

-- Add company_id to notifications table (for tenant/company scope)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Add company_id to exit_records table (for tenant/company scope)
ALTER TABLE exit_records ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_exit_records_company_id ON exit_records(company_id);

-- Add company_id to leave_requests table (for tenant/company scope)
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_leave_requests_company_id ON leave_requests(company_id);

-- Add company_id to attendance_records table (for tenant/company scope)
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_attendance_records_company_id ON attendance_records(company_id);

-- Add company_id to performance_reviews table (for tenant/company scope)
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_performance_reviews_company_id ON performance_reviews(company_id);

-- Add company_id to training_programs table (for tenant/company scope)
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_training_programs_company_id ON training_programs(company_id);

-- Add company_id to training_enrollments table (for tenant/company scope)
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_training_enrollments_company_id ON training_enrollments(company_id);

-- Add company_id to job_positions table (for tenant/company scope)
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_job_positions_company_id ON job_positions(company_id);

-- Create a view to get user's accessible companies
CREATE OR REPLACE VIEW user_accessible_companies AS
SELECT DISTINCT
    u.id as user_id,
    c.id as company_id,
    c.company_code,
    c.legal_name,
    c.display_name
FROM users u
LEFT JOIN user_companies uc ON u.id = uc.user_id
LEFT JOIN companies c ON uc.company_id = c.id OR u.company_id = c.id
WHERE c.id IS NOT NULL;
