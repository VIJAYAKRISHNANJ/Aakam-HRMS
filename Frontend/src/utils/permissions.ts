export function normalizePermission(permission: unknown): string {
  return String(permission ?? "")
    .trim()
    .toLowerCase();
}

export function hasPermission(
  permissions: readonly unknown[] = [],
  permission: string,
): boolean {
  const normalized = normalizePermission(permission);

  if (!normalized) {
    return false;
  }

  return permissions.some(
    (item) => normalizePermission(item) === normalized,
  );
}

export function hasAnyPermission(
  permissions: readonly unknown[] = [],
  requiredPermissions: readonly string[] = [],
): boolean {
  if (requiredPermissions.length === 0) {
    return false;
  }

  return requiredPermissions.some((permission) =>
    hasPermission(permissions, permission),
  );
}

export function hasAllPermissions(
  permissions: readonly unknown[] = [],
  requiredPermissions: readonly string[] = [],
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every((permission) =>
    hasPermission(permissions, permission),
  );
}
