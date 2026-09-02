import pool from "../db.js";

/**
 * Log an audit event for critical actions
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action being performed (e.g., 'LOGIN', 'CREATE_USER', 'DELETE_EMPLOYEE')
 * @param {string} entityType - Type of entity being acted upon (e.g., 'USER', 'EMPLOYEE', 'PAYROLL')
 * @param {number} entityId - ID of the entity
 * @param {object} details - Additional details (old value, new value, changes, etc.)
 * @returns {Promise<boolean>} - True if audit log was created successfully
 */
export const logAuditEvent = async (
  userId,
  action,
  entityType,
  entityId,
  details = {},
) => {
  try {
    await pool.query(
      `
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, $3, $4, $5);
      `,
      [userId, action, entityType, entityId, JSON.stringify(details)],
    );
    return true;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return false;
  }
};

/**
 * Get audit logs for an entity
 * @param {string} entityType - Type of entity (e.g., 'USER', 'EMPLOYEE')
 * @param {number} entityId - ID of the entity
 * @param {number} limit - Maximum number of results (default 50)
 * @returns {Promise<Array>} - Array of audit log records
 */
export const getAuditLogsForEntity = async (
  entityType,
  entityId,
  limit = 50,
) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          created_at
        FROM audit_logs
        WHERE entity_type = $1 AND entity_id = $2
        ORDER BY created_at DESC
        LIMIT $3;
      `,
      [entityType, entityId, limit],
    );
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
};

/**
 * Get audit logs for a user
 * @param {number} userId - ID of the user
 * @param {number} limit - Maximum number of results (default 50)
 * @returns {Promise<Array>} - Array of audit log records
 */
export const getAuditLogsForUser = async (userId, limit = 50) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          created_at
        FROM audit_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2;
      `,
      [userId, limit],
    );
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
};

/**
 * Get all audit logs (admin only)
 * @param {number} limit - Maximum number of results (default 100)
 * @param {number} offset - Offset for pagination (default 0)
 * @returns {Promise<Array>} - Array of audit log records
 */
export const getAllAuditLogs = async (limit = 100, offset = 0) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `,
      [limit, offset],
    );
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
};

/**
 * Critical actions to audit
 */
export const AUDIT_ACTIONS = {
  // User Management
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_ROLE_ASSIGNED: "USER_ROLE_ASSIGNED",
  USER_ROLE_REMOVED: "USER_ROLE_REMOVED",
  USER_PASSWORD_CHANGED: "USER_PASSWORD_CHANGED",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",

  // Employee Management
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  EMPLOYEE_DELETED: "EMPLOYEE_DELETED",

  // Payroll
  PAYROLL_RUN_CREATED: "PAYROLL_RUN_CREATED",
  PAYROLL_RUN_PROCESSING: "PAYROLL_RUN_PROCESSING",
  PAYROLL_APPROVED: "PAYROLL_APPROVED",
  PAYROLL_COMPLETED: "PAYROLL_COMPLETED",

  // Leave
  LEAVE_REQUESTED: "LEAVE_REQUESTED",
  LEAVE_APPROVED: "LEAVE_APPROVED",
  LEAVE_REJECTED: "LEAVE_REJECTED",

  // Onboarding
  ONBOARDING_CREATED: "ONBOARDING_CREATED",
  ONBOARDING_UPDATED: "ONBOARDING_UPDATED",
  ONBOARDING_COMPLETED: "ONBOARDING_COMPLETED",

  // Exit
  EXIT_CREATED: "EXIT_CREATED",
  EXIT_APPROVED: "EXIT_APPROVED",
  EXIT_COMPLETED: "EXIT_COMPLETED",

  // Permissions
  PERMISSION_GRANTED: "PERMISSION_GRANTED",
  PERMISSION_REVOKED: "PERMISSION_REVOKED",

  // General
  RECORD_DELETED: "RECORD_DELETED",
  CONFIGURATION_CHANGED: "CONFIGURATION_CHANGED",
};
