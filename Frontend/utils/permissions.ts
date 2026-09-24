/**
 * Aakam HRMS
 * Frontend permission definitions and authorization helpers.
 *
 * Frontend permissions control UI visibility only.
 * Backend authorization remains the security boundary.
 */

export const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_ROLE: "users.role",

  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_CREATE: "employees.create",
  EMPLOYEES_UPDATE: "employees.update",
  EMPLOYEES_DELETE: "employees.delete",
  EMPLOYEES_VIEW_OWN: "employees.view.own",

  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  PERMISSIONS_VIEW: "permissions.view",

  COMPANY_VIEW: "company.view",
  COMPANY_CREATE: "company.create",
  COMPANY_UPDATE: "company.update",
  COMPANY_DELETE: "company.delete",

  BRANCHES_VIEW: "branches.view",
  BRANCHES_CREATE: "branches.create",
  BRANCHES_UPDATE: "branches.update",
  BRANCHES_DELETE: "branches.delete",

  DEPARTMENTS_VIEW: "departments.view",
  DEPARTMENTS_CREATE: "departments.create",
  DEPARTMENTS_UPDATE: "departments.update",
  DEPARTMENTS_DELETE: "departments.delete",

  RECRUITMENT_VIEW: "recruitment.view",
  RECRUITMENT_CREATE: "recruitment.create",
  RECRUITMENT_UPDATE: "recruitment.update",
  RECRUITMENT_DELETE: "recruitment.delete",
  RECRUITMENT_MANAGE: "recruitment.manage",

  CANDIDATES_VIEW: "candidates.view",
  CANDIDATES_CREATE: "candidates.create",
  CANDIDATES_UPDATE: "candidates.update",
  CANDIDATES_DELETE: "candidates.delete",
  CANDIDATES_MANAGE: "candidates.manage",

  INTERVIEWS_VIEW: "interviews.view",
  INTERVIEWS_CREATE: "interviews.create",
  INTERVIEWS_UPDATE: "interviews.update",
  INTERVIEWS_DELETE: "interviews.delete",
  INTERVIEWS_EVALUATE: "interviews.evaluate",

  OFFERS_VIEW: "offers.view",
  OFFERS_CREATE: "offers.create",
  OFFERS_UPDATE: "offers.update",
  OFFERS_RELEASE: "offers.release",

  ONBOARDING_VIEW: "onboarding.view",
  ONBOARDING_CREATE: "onboarding.create",
  ONBOARDING_UPDATE: "onboarding.update",
  ONBOARDING_DELETE: "onboarding.delete",
  ONBOARDING_MANAGE: "onboarding.manage",

  PAYROLL_VIEW: "payroll.view",
  PAYROLL_CREATE: "payroll.create",
  PAYROLL_UPDATE: "payroll.update",
  PAYROLL_DELETE: "payroll.delete",
  PAYROLL_APPROVE: "payroll.approve",
  PAYROLL_MANAGE: "payroll.manage",
  PAYROLL_VIEW_OWN: "payroll.view.own",

  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_CREATE: "attendance.create",
  ATTENDANCE_UPDATE: "attendance.update",
  ATTENDANCE_DELETE: "attendance.delete",
  ATTENDANCE_MANAGE: "attendance.manage",
  ATTENDANCE_VIEW_OWN: "attendance.view.own",
  ATTENDANCE_REGULARIZE: "attendance.regularize",

  LEAVE_VIEW: "leave.view",
  LEAVE_CREATE: "leave.create",
  LEAVE_UPDATE: "leave.update",
  LEAVE_DELETE: "leave.delete",
  LEAVE_APPROVE: "leave.approve",
  LEAVE_MANAGE: "leave.manage",
  LEAVE_VIEW_OWN: "leave.view.own",

  PERFORMANCE_VIEW: "performance.view",
  PERFORMANCE_CREATE: "performance.create",
  PERFORMANCE_UPDATE: "performance.update",
  PERFORMANCE_DELETE: "performance.delete",
  PERFORMANCE_MANAGE: "performance.manage",
  PERFORMANCE_VIEW_OWN: "performance.view.own",

  TRAINING_VIEW: "training.view",
  TRAINING_CREATE: "training.create",
  TRAINING_UPDATE: "training.update",
  TRAINING_DELETE: "training.delete",
  TRAINING_MANAGE: "training.manage",
  TRAINING_VIEW_OWN: "training.view.own",

  EXIT_VIEW: "exit.view",
  EXIT_CREATE: "exit.create",
  EXIT_UPDATE: "exit.update",
  EXIT_DELETE: "exit.delete",
  EXIT_APPROVE: "exit.approve",
  EXIT_MANAGE: "exit.manage",
  EXIT_VIEW_OWN: "exit.view.own",

  REPORTS_VIEW: "reports.view",
  REPORTS_CREATE: "reports.create",

  AUDIT_LOGS_VIEW: "audit_logs.view",

  NOTIFICATIONS_VIEW: "notifications.view",
  NOTIFICATIONS_CREATE: "notifications.create",
  NOTIFICATIONS_DELETE: "notifications.delete",

  CLIENTS_VIEW: "clients.view",
  CLIENTS_CREATE: "clients.create",
  CLIENTS_UPDATE: "clients.update",
  CLIENTS_DELETE: "clients.delete",

  DEPLOYMENT_VIEW: "deployment.view",
  DEPLOYMENT_CREATE: "deployment.create",
  DEPLOYMENT_UPDATE: "deployment.update",
  DEPLOYMENT_DELETE: "deployment.delete",
  DEPLOYMENT_MANAGE: "deployment.manage",
  DEPLOYMENT_VIEW_OWN: "deployment.view.own",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function normalizePermission(
  permission: unknown,
): string {
  return String(permission ?? "")
    .trim()
    .toLowerCase();
}

export function createPermissionSet(
  permissions: readonly unknown[] = [],
): Set<string> {
  return new Set(
    permissions
      .map(normalizePermission)
      .filter(Boolean),
  );
}

export function hasPermission(
  permissions: readonly unknown[] = [],
  permission: string,
): boolean {
  const normalizedPermission =
    normalizePermission(permission);

  if (!normalizedPermission) {
    return false;
  }

  return createPermissionSet(
    permissions,
  ).has(normalizedPermission);
}

export function hasAnyPermission(
  permissions: readonly unknown[] = [],
  requiredPermissions: readonly string[] = [],
): boolean {
  if (requiredPermissions.length === 0) {
    return false;
  }

  const permissionSet =
    createPermissionSet(permissions);

  return requiredPermissions.some(
    (permission) =>
      permissionSet.has(
        normalizePermission(permission),
      ),
  );
}

export function hasAllPermissions(
  permissions: readonly unknown[] = [],
  requiredPermissions: readonly string[] = [],
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  const permissionSet =
    createPermissionSet(permissions);

  return requiredPermissions.every(
    (permission) =>
      permissionSet.has(
        normalizePermission(permission),
      ),
  );
}