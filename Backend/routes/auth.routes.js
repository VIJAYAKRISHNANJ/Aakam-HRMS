import express from "express";

import pool from "../db.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  getLockoutMinutes,
  getMaxFailedLoginAttempts,
  getPasswordExpiryDate,
  hashPassword,
  isAccountLocked,
  mapUserProfile,
  signAuthToken,
  validatePassword,
  verifyPassword,
} from "../utils/auth.js";

const router = express.Router();

const findUserByIdentifier = async (
  identifier,
) => {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.username,
        u.email,
        u.password_hash,
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
        e.designation,
        e.employment_status AS employee_status,
        e.department_id,

        d.name AS department_name,

        COALESCE(
          JSON_AGG(DISTINCT r.name)
          FILTER (
            WHERE r.id IS NOT NULL
          ),
          '[]'::json
        ) AS roles,

        COALESCE(
          JSON_AGG(DISTINCT p.name)
          FILTER (
            WHERE p.id IS NOT NULL
          ),
          '[]'::json
        ) AS permissions

      FROM users u

      LEFT JOIN employees e
        ON e.id = u.employee_id

      LEFT JOIN departments d
        ON d.id = e.department_id

      LEFT JOIN user_roles ur
        ON ur.user_id = u.id

      LEFT JOIN roles r
        ON r.id = ur.role_id

      LEFT JOIN role_permissions rp
        ON rp.role_id = r.id

      LEFT JOIN permissions p
        ON p.id = rp.permission_id

      WHERE LOWER(u.username) = LOWER($1)
         OR LOWER(u.email) = LOWER($1)

      GROUP BY
        u.id,
        e.employee_code,
        e.designation,
        e.employment_status,
        e.department_id,
        d.name

      LIMIT 1;
    `,
    [identifier],
  );

  return result.rows[0] ?? null;
};

const insertLoginHistory = async ({
  userId = null,
  loginStatus,
  ipAddress = null,
  userAgent = null,
  attemptedIdentifier = null,
  failureReason = null,
}) => {
  await pool.query(
    `
      INSERT INTO login_history (
        user_id,
        login_status,
        ip_address,
        user_agent,
        attempted_identifier,
        failure_reason
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      );
    `,
    [
      userId,
      loginStatus,
      ipAddress,
      userAgent,
      attemptedIdentifier,
      failureReason,
    ],
  );
};

const insertAuditLog = async ({
  userId = null,
  action,
  entityType,
  entityId = null,
  details = {},
}) => {
  await pool.query(
    `
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb
      );
    `,
    [
      userId,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
    ],
  );
};

const getRequestIp = (req) => {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (
    typeof forwarded === "string" &&
    forwarded.trim()
  ) {
    return forwarded
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
};

const buildAuthResponse = (user) => {
  const sanitizedUser =
    mapUserProfile(user);

  const roles = user.roles ?? [];

  const permissions =
    user.permissions ?? [];

  const token = signAuthToken({
    sub: Number(user.id),
    username: user.username,
    roles,
  });

  return {
    token,

    tokenType: "Bearer",

    expiresIn:
      process.env.JWT_EXPIRES_IN?.trim() ||
      "8h",

    user: sanitizedUser,

    roles,

    permissions,
  };
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        identifier,
        username,
        email,
        password,
      } = req.body;

      const loginIdentifier =
        typeof identifier === "string" &&
        identifier.trim()
          ? identifier.trim()
          : typeof username === "string" &&
            username.trim()
          ? username.trim()
          : typeof email === "string" &&
            email.trim()
          ? email.trim()
          : "";

      if (
        !loginIdentifier ||
        typeof password !== "string" ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username/email and password are required",
        });
      }

      const user =
        await findUserByIdentifier(
          loginIdentifier,
        );

      const ipAddress =
        getRequestIp(req);

      const userAgent =
        req.headers["user-agent"] ||
        null;

      /*
      |--------------------------------------------------------------------------
      | User Not Found
      |--------------------------------------------------------------------------
      */

      if (!user) {
        await insertLoginHistory({
          loginStatus: "FAILED",
          ipAddress,
          userAgent,
          attemptedIdentifier:
            loginIdentifier,
          failureReason:
            "USER_NOT_FOUND",
        });

        return res.status(401).json({
          success: false,
          message:
            "Invalid credentials",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Inactive Account
      |--------------------------------------------------------------------------
      */

      if (!user.is_active) {
        await insertLoginHistory({
          userId: user.id,
          loginStatus: "FAILED",
          ipAddress,
          userAgent,
          attemptedIdentifier:
            loginIdentifier,
          failureReason:
            "INACTIVE_ACCOUNT",
        });

        return res.status(403).json({
          success: false,
          message:
            "User account is inactive",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Account Locked
      |--------------------------------------------------------------------------
      */

      if (
        isAccountLocked(
          user.locked_until,
        )
      ) {
        await insertLoginHistory({
          userId: user.id,
          loginStatus:
            "LOCKED_OUT",
          ipAddress,
          userAgent,
          attemptedIdentifier:
            loginIdentifier,
          failureReason:
            "ACCOUNT_LOCKED",
        });

        return res.status(423).json({
          success: false,
          message:
            "Account is temporarily locked. Please try again later.",
          lockedUntil:
            user.locked_until,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Password Verification
      |--------------------------------------------------------------------------
      */

      const passwordMatches =
        await verifyPassword(
          password,
          user.password_hash,
        );

      if (!passwordMatches) {
        const nextFailedAttempts =
          Number(
            user.failed_login_attempts,
          ) + 1;

        const shouldLock =
          nextFailedAttempts >=
          getMaxFailedLoginAttempts();

        const lockedUntil =
          shouldLock
            ? new Date(
                Date.now() +
                  getLockoutMinutes() *
                    60 *
                    1000,
              )
            : null;

        await pool.query(
          `
            UPDATE users
            SET
              failed_login_attempts = $2,
              locked_until = $3,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE id = $1;
          `,
          [
            user.id,
            nextFailedAttempts,
            lockedUntil,
          ],
        );

        await insertLoginHistory({
          userId: user.id,
          loginStatus:
            shouldLock
              ? "LOCKED_OUT"
              : "FAILED",
          ipAddress,
          userAgent,
          attemptedIdentifier:
            loginIdentifier,
          failureReason:
            shouldLock
              ? "MAX_ATTEMPTS_REACHED"
              : "INVALID_PASSWORD",
        });

        return res.status(401).json({
          success: false,
          message:
            shouldLock
              ? "Account locked due to repeated failed login attempts"
              : "Invalid credentials",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Successful Login
      |--------------------------------------------------------------------------
      */

      await pool.query(
        `
          UPDATE users
          SET
            failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $1;
        `,
        [user.id],
      );

      await insertLoginHistory({
        userId: user.id,
        loginStatus: "SUCCESS",
        ipAddress,
        userAgent,
        attemptedIdentifier:
          loginIdentifier,
      });

      await insertAuditLog({
        userId: user.id,
        action: "LOGIN_SUCCESS",
        entityType: "users",
        entityId: Number(user.id),
        details: {
          ipAddress,
          userAgent,
        },
      });

      /*
      |--------------------------------------------------------------------------
      | Refresh User
      |--------------------------------------------------------------------------
      |
      | This ensures the response contains
      | the latest designation, roles and
      | permissions.
      |
      */

      const refreshedUser =
        await findUserByIdentifier(
          loginIdentifier,
        );

      if (!refreshedUser) {
        return res.status(500).json({
          success: false,
          message:
            "Unable to load authenticated user",
        });
      }

      return res.json({
        success: true,
        message:
          "Login successful",
        data:
          buildAuthResponse(
            refreshedUser,
          ),
      });
    } catch (error) {
      console.error(
        "Authentication login error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to login",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  authenticate,
  async (req, res) => {
    try {
      return res.json({
        success: true,

        data: {
          user: req.user,

          roles:
            req.user.roles,

          permissions:
            req.user.permissions,
        },
      });
    } catch (error) {
      console.error(
        "Authentication profile error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load user profile",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
  "/logout",
  authenticate,
  async (req, res) => {
    try {
      const ipAddress =
        getRequestIp(req);

      const userAgent =
        req.headers["user-agent"] ||
        null;

      await insertLoginHistory({
        userId: req.user.id,
        loginStatus: "LOGOUT",
        ipAddress,
        userAgent,
        attemptedIdentifier:
          req.user.username,
      });

      await insertAuditLog({
        userId: req.user.id,
        action: "LOGOUT",
        entityType: "users",
        entityId: req.user.id,
        details: {
          ipAddress,
          userAgent,
        },
      });

      return res.json({
        success: true,
        message:
          "Logout successful. Discard the token on the client.",
      });
    } catch (error) {
      console.error(
        "Authentication logout error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to logout",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

router.post(
  "/change-password",
  authenticate,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        typeof currentPassword !==
          "string" ||
        typeof newPassword !==
          "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current password and new password are required",
        });
      }

      validatePassword(
        newPassword,
      );

      const result =
        await pool.query(
          `
            SELECT
              id,
              password_hash
            FROM users
            WHERE id = $1
            LIMIT 1;
          `,
          [req.user.id],
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const existingUser =
        result.rows[0];

      const passwordMatches =
        await verifyPassword(
          currentPassword,
          existingUser.password_hash,
        );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }

      const passwordHash =
        await hashPassword(
          newPassword,
        );

      const passwordExpiresAt =
        getPasswordExpiryDate();

      await pool.query(
        `
          UPDATE users
          SET
            password_hash = $2,
            password_changed_at =
              CURRENT_TIMESTAMP,
            password_expires_at = $3,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $1;
        `,
        [
          req.user.id,
          passwordHash,
          passwordExpiresAt,
        ],
      );

      await insertAuditLog({
        userId: req.user.id,
        action:
          "PASSWORD_CHANGED",
        entityType: "users",
        entityId: req.user.id,
        details: {},
      });

      return res.json({
        success: true,
        message:
          "Password changed successfully",
      });
    } catch (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("password")
      ) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
        });
      }

      console.error(
        "Change password error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to change password",
      });
    }
  },
);

export default router;