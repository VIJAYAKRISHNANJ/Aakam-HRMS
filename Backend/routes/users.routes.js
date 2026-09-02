import express from "express";
import pool from "../db.js";
import {
  authenticate,
  authorizePermissions,
} from "../middleware/auth.middleware.js";
import { getPasswordExpiryDate, hashPassword } from "../utils/auth.js";

const router = express.Router();



const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidEmail = (value) =>
  typeof value === "string" && /^\S+@\S+\.\S+$/.test(value.trim());

const normalizeOptionalString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeRequiredString = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const getRoleById = async (roleId) => {
  const result = await pool.query(
    `
      SELECT id, name, description, created_at
      FROM roles
      WHERE id = $1
      LIMIT 1;
    `,
    [roleId],
  );

  return result.rows[0] ?? null;
};

const getEmployeeById = async (employeeId) => {
  const result = await pool.query(
    `
      SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name AS department_name,
        e.employment_status
      FROM employees e
      LEFT JOIN departments d
        ON d.id = e.department_id
      WHERE e.id = $1
      LIMIT 1;
    `,
    [employeeId],
  );

  return result.rows[0] ?? null;
};

const getUserById = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.employee_id,
        u.is_active,
        u.failed_login_attempts,
        u.locked_until,
        u.last_login_at,
        u.password_changed_at,
        u.password_expires_at,
        u.created_at,
        u.updated_at,
        e.employee_code,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name,
        e.employment_status AS employee_status,
        e.department_id,
        d.name AS department_name,
        COALESCE(
          JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
            'id', r.id,
            'name', r.name,
            'description', r.description
          )) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM users u
      LEFT JOIN employees e
        ON e.id = u.employee_id
      LEFT JOIN departments d
        ON d.id = e.department_id
      LEFT JOIN user_roles ur
        ON ur.user_id = u.id
      LEFT JOIN roles r
        ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY
        u.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.employment_status,
        e.department_id,
        d.name
      LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] ?? null;
};

const mapUser = (user) => ({
  id: Number(user.id),
  username: user.username,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  fullName: `${user.first_name} ${user.last_name ?? ""}`.trim(),
  employee: user.employee_id
    ? {
        id: Number(user.employee_id),
        employeeCode: user.employee_code,
        firstName: user.employee_first_name ?? user.first_name,
        lastName: user.employee_last_name ?? user.last_name,
        fullName: `${user.employee_first_name ?? user.first_name} ${user.employee_last_name ?? user.last_name ?? ""}`.trim(),
        status: user.employee_status ?? null,
        departmentId: user.department_id ? Number(user.department_id) : null,
        department: user.department_name ?? null,
      }
    : null,
  roles: (user.roles ?? []).map((role) => ({
    id: Number(role.id),
    name: role.name,
    description: role.description,
  })),
  isActive: user.is_active,
  failedLoginAttempts: Number(user.failed_login_attempts ?? 0),
  lockedUntil: user.locked_until,
  lastLoginAt: user.last_login_at,
  passwordChangedAt: user.password_changed_at,
  passwordExpiresAt: user.password_expires_at,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const writeAuditLog = async ({ userId, action, entityId, details }) => {
  await pool.query(
    `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, 'users', $3, $4::jsonb);
    `,
    [userId, action, entityId, JSON.stringify(details ?? {})],
  );
};

router.use(authenticate);

router.get("/", authorizePermissions("users.view"), async (req, res) => {
  try {

    const { search = "", role = "", active = "", employeeId = "" } = req.query;
    const values = [];
    const conditions = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(
        u.username ILIKE $${values.length}
        OR u.email ILIKE $${values.length}
        OR u.first_name ILIKE $${values.length}
        OR COALESCE(u.last_name, '') ILIKE $${values.length}
        OR COALESCE(e.employee_code, '') ILIKE $${values.length}
      )`);
    }

    if (role) {
      if (isValidId(role)) {
        values.push(Number(role));
        conditions.push(`r.id = $${values.length}`);
      } else {
        values.push(role.toString().trim());
        conditions.push(`r.name = $${values.length}`);
      }
    }

    if (active !== "") {
      if (!["true", "false"].includes(String(active).toLowerCase())) {
        return res.status(400).json({ success: false, message: "active must be true or false" });
      }
      values.push(String(active).toLowerCase() === "true");
      conditions.push(`u.is_active = $${values.length}`);
    }

    if (employeeId !== "") {
      if (!isValidId(employeeId)) {
        return res.status(400).json({ success: false, message: "Invalid employee ID" });
      }
      values.push(Number(employeeId));
      conditions.push(`u.employee_id = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT
          u.id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.employee_id,
          u.is_active,
          u.failed_login_attempts,
          u.locked_until,
          u.last_login_at,
          u.password_changed_at,
          u.password_expires_at,
          u.created_at,
          u.updated_at,
          e.employee_code,
          e.first_name AS employee_first_name,
          e.last_name AS employee_last_name,
          e.employment_status AS employee_status,
          e.department_id,
          d.name AS department_name,
          COALESCE(
            JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'description', r.description
            )) FILTER (WHERE r.id IS NOT NULL),
            '[]'::json
          ) AS roles
        FROM users u
        LEFT JOIN employees e
          ON e.id = u.employee_id
        LEFT JOIN departments d
          ON d.id = e.department_id
        LEFT JOIN user_roles ur
          ON ur.user_id = u.id
        LEFT JOIN roles r
          ON r.id = ur.role_id
        ${whereClause}
        GROUP BY
          u.id,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.employment_status,
          e.department_id,
          d.name
        ORDER BY u.created_at DESC, u.id DESC;
      `,
      values,
    );

    res.json({
      success: true,
      data: result.rows.map(mapUser),
      total: result.rows.length,
      scopeLimitation: "Company and team scoping are not enforced here because the current schema does not provide a direct user-to-company, manager-to-team, or client-user-to-client access mapping.",
    });
  } catch (error) {
    console.error("User list error:", error);
    res.status(500).json({ success: false, message: "Failed to load users" });
  }
});

router.get("/:id", authorizePermissions("users.view"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: mapUser(user) });
  } catch (error) {
    console.error("User view error:", error);
    res.status(500).json({ success: false, message: "Failed to load user" });
  }
});

router.post("/", authorizePermissions("users.create"), async (req, res) => {
  try {

    const {
      employeeId,
      username,
      email,
      roleId,
      temporaryPassword,
      firstName,
      lastName,
    } = req.body;

    if (!isValidId(employeeId)) {
      return res.status(400).json({ success: false, message: "A valid employee ID is required" });
    }

    const normalizedUsername = normalizeRequiredString(username);
    if (!normalizedUsername) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const normalizedEmail = normalizeRequiredString(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }

    if (!isValidId(roleId)) {
      return res.status(400).json({ success: false, message: "A valid role ID is required" });
    }

    if (typeof temporaryPassword !== "string" || !temporaryPassword.trim()) {
      return res.status(400).json({ success: false, message: "Temporary password is required" });
    }

    const employee = await getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const role = await getRoleById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const existingEmployeeUser = await pool.query(
      `
        SELECT id
        FROM users
        WHERE employee_id = $1
        LIMIT 1;
      `,
      [employeeId],
    );

    if (existingEmployeeUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This employee is already linked to another user account",
      });
    }

    const existingIdentity = await pool.query(
      `
        SELECT id, username, email
        FROM users
        WHERE LOWER(username) = LOWER($1)
           OR LOWER(email) = LOWER($2)
        LIMIT 1;
      `,
      [normalizedUsername, normalizedEmail],
    );

    if (existingIdentity.rows.length > 0) {
      const duplicate = existingIdentity.rows[0];
      const duplicateField =
        duplicate.username.toLowerCase() === normalizedUsername.toLowerCase()
          ? "username"
          : "email";

      return res.status(409).json({
        success: false,
        message: `A user with this ${duplicateField} already exists`,
      });
    }

    const passwordHash = await hashPassword(temporaryPassword);
    const resolvedFirstName = normalizeOptionalString(firstName) ?? employee.first_name;
    const resolvedLastName = normalizeOptionalString(lastName) ?? employee.last_name ?? null;
    const passwordExpiresAt = getPasswordExpiryDate();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const createdUser = await client.query(
        `
          INSERT INTO users (
            username,
            email,
            password_hash,
            first_name,
            last_name,
            employee_id,
            is_active,
            password_changed_at,
            password_expires_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, TRUE, CURRENT_TIMESTAMP, $7, CURRENT_TIMESTAMP)
          RETURNING id;
        `,
        [
          normalizedUsername,
          normalizedEmail,
          passwordHash,
          resolvedFirstName,
          resolvedLastName,
          Number(employeeId),
          passwordExpiresAt,
        ],
      );

      const userId = createdUser.rows[0].id;

      await client.query(
        `
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `,
        [userId, Number(roleId)],
      );

      await client.query(
        `
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES ($1, 'USER_CREATED', 'users', $2, $3::jsonb);
        `,
        [
          req.user.id,
          userId,
          JSON.stringify({
            username: normalizedUsername,
            email: normalizedEmail,
            employeeId: Number(employeeId),
            roleId: Number(roleId),
            roleName: role.name,
          }),
        ],
      );

      await client.query("COMMIT");

      const user = await getUserById(userId);
      res.status(201).json({
        success: true,
        message: "User account created successfully",
        data: mapUser(user),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, message: "Failed to create user account" });
  }
});

router.put("/:id", authorizePermissions("users.update"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const forbiddenFields = [
      "passwordHash",
      "password_hash",
      "failedLoginAttempts",
      "failed_login_attempts",
      "lockedUntil",
      "locked_until",
      "lastLoginAt",
      "last_login_at",
      "passwordChangedAt",
      "password_changed_at",
      "roleId",
      "role_id",
      "roles",
      "permissions",
      "createdAt",
      "created_at",
      "updatedAt",
      "updated_at",
    ];

    for (const field of forbiddenFields) {
      if (req.body[field] !== undefined) {
        return res.status(400).json({
          success: false,
          message: `${field} cannot be updated through this endpoint`,
        });
      }
    }

    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (req.body.username !== undefined) {
      const normalizedUsername = normalizeRequiredString(req.body.username);
      if (!normalizedUsername) {
        return res.status(400).json({ success: false, message: "Username cannot be empty" });
      }
      addUpdate("username", normalizedUsername);
    }

    if (req.body.email !== undefined) {
      const normalizedEmail = normalizeRequiredString(req.body.email);
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "A valid email is required" });
      }
      addUpdate("email", normalizedEmail);
    }

    if (req.body.firstName !== undefined) {
      const normalizedFirstName = normalizeRequiredString(req.body.firstName);
      if (!normalizedFirstName) {
        return res.status(400).json({ success: false, message: "First name cannot be empty" });
      }
      addUpdate("first_name", normalizedFirstName);
    }

    if (req.body.lastName !== undefined) {
      const normalizedLastName = normalizeOptionalString(req.body.lastName);
      if (req.body.lastName !== null && normalizedLastName === undefined) {
        return res.status(400).json({ success: false, message: "Last name must be a string or null" });
      }
      addUpdate("last_name", normalizedLastName);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "At least one updatable field is required" });
    }

    const targetUsername = updates.find((entry) => entry.startsWith("username ="))
      ? values[updates.findIndex((entry) => entry.startsWith("username ="))]
      : existingUser.username;
    const targetEmail = updates.find((entry) => entry.startsWith("email ="))
      ? values[updates.findIndex((entry) => entry.startsWith("email ="))]
      : existingUser.email;

    const duplicateResult = await pool.query(
      `
        SELECT id, username, email
        FROM users
        WHERE id <> $1
          AND (
            LOWER(username) = LOWER($2)
            OR LOWER(email) = LOWER($3)
          )
        LIMIT 1;
      `,
      [req.params.id, targetUsername, targetEmail],
    );

    if (duplicateResult.rows.length > 0) {
      const duplicate = duplicateResult.rows[0];
      const duplicateField =
        duplicate.username.toLowerCase() === String(targetUsername).toLowerCase()
          ? "username"
          : "email";
      return res.status(409).json({
        success: false,
        message: `A user with this ${duplicateField} already exists`,
      });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(req.params.id);

    await pool.query(
      `
        UPDATE users
        SET ${updates.join(", ")}
        WHERE id = $${values.length};
      `,
      values,
    );

    await writeAuditLog({
      userId: req.user.id,
      action: "USER_UPDATED",
      entityId: Number(req.params.id),
      details: {
        updatedFields: Object.keys(req.body).filter(
          (field) => !forbiddenFields.includes(field),
        ),
      },
    });

    const user = await getUserById(req.params.id);
    res.json({
      success: true,
      message: "User updated successfully",
      data: mapUser(user),
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Failed to update user account" });
  }
});

router.patch("/:id/status", authorizePermissions("users.update"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }

    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await pool.query(
      `
        UPDATE users
        SET is_active = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `,
      [req.params.id, isActive],
    );

    await writeAuditLog({
      userId: req.user.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entityId: Number(req.params.id),
      details: { isActive },
    });

    const user = await getUserById(req.params.id);
    res.json({
      success: true,
      message: isActive ? "User activated successfully" : "User deactivated successfully",
      data: mapUser(user),
    });
  } catch (error) {
    console.error("User status update error:", error);
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
});

router.patch("/:id/role", authorizePermissions("users.update"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const { roleId } = req.body;
    if (!isValidId(roleId)) {
      return res.status(400).json({ success: false, message: "A valid role ID is required" });
    }

    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(403).json({ success: false, message: "Users cannot change their own role" });
    }

    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const role = await getRoleById(roleId);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM user_roles WHERE user_id = $1;", [req.params.id]);
      await client.query(
        `
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2);
        `,
        [req.params.id, Number(roleId)],
      );
      await client.query(
        `
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES ($1, 'USER_ROLE_CHANGED', 'users', $2, $3::jsonb);
        `,
        [
          req.user.id,
          Number(req.params.id),
          JSON.stringify({ roleId: Number(roleId), roleName: role.name }),
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const user = await getUserById(req.params.id);
    res.json({
      success: true,
      message: "User role updated successfully",
      data: mapUser(user),
    });
  } catch (error) {
    console.error("User role update error:", error);
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
});

router.post("/:id/reset-password", authorizePermissions("users.update"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const { temporaryPassword } = req.body;
    if (typeof temporaryPassword !== "string" || !temporaryPassword.trim()) {
      return res.status(400).json({ success: false, message: "Temporary password is required" });
    }

    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const passwordHash = await hashPassword(temporaryPassword);
    const passwordExpiresAt = getPasswordExpiryDate();

    await pool.query(
      `
        UPDATE users
        SET password_hash = $2,
            failed_login_attempts = 0,
            locked_until = NULL,
            password_changed_at = CURRENT_TIMESTAMP,
            password_expires_at = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `,
      [req.params.id, passwordHash, passwordExpiresAt],
    );

    await writeAuditLog({
      userId: req.user.id,
      action: "USER_PASSWORD_RESET",
      entityId: Number(req.params.id),
      details: {
        passwordExpiresAt,
      },
    });

    res.json({
      success: true,
      message: "User password reset successfully",
    });
  } catch (error) {
    if (error.message?.toLowerCase().includes("password")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Failed to reset user password" });
  }
});

export default router;
