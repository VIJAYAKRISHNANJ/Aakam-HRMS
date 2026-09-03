-- ============================================
-- AAKAM HRMS
-- MIGRATION 002: ADD EMPLOYEE DESIGNATION
-- ============================================

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS designation VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_employees_designation
ON employees(designation);