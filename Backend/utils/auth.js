import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

const DEFAULT_JWT_EXPIRES_IN = "8h";

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;

const DEFAULT_MAX_FAILED_LOGIN_ATTEMPTS = 5;

const DEFAULT_LOCKOUT_MINUTES = 15;

const DEFAULT_PASSWORD_EXPIRY_DAYS = 90;

export const getJwtSecret = () => {
  const secret =
    process.env.JWT_SECRET;

  if (
    !secret ||
    !secret.trim()
  ) {
    throw new Error(
      "JWT_SECRET is not configured",
    );
  }

  return secret.trim();
};

export const getJwtExpiresIn = () =>
  process.env.JWT_EXPIRES_IN?.trim() ||
  DEFAULT_JWT_EXPIRES_IN;

export const getBcryptSaltRounds = () => {
  const parsed = Number(
    process.env.BCRYPT_SALT_ROUNDS,
  );

  return Number.isInteger(parsed) &&
    parsed >= 10 &&
    parsed <= 15
    ? parsed
    : DEFAULT_BCRYPT_SALT_ROUNDS;
};

export const getMaxFailedLoginAttempts =
  () => {
    const parsed = Number(
      process.env
        .AUTH_MAX_FAILED_LOGIN_ATTEMPTS,
    );

    return Number.isInteger(parsed) &&
      parsed >= 3 &&
      parsed <= 10
      ? parsed
      : DEFAULT_MAX_FAILED_LOGIN_ATTEMPTS;
  };

export const getLockoutMinutes = () => {
  const parsed = Number(
    process.env.AUTH_LOCKOUT_MINUTES,
  );

  return Number.isInteger(parsed) &&
    parsed >= 5 &&
    parsed <= 60
    ? parsed
    : DEFAULT_LOCKOUT_MINUTES;
};

export const getPasswordExpiryDays =
  () => {
    const parsed = Number(
      process.env.PASSWORD_EXPIRY_DAYS,
    );

    return Number.isInteger(parsed) &&
      parsed >= 30 &&
      parsed <= 365
      ? parsed
      : DEFAULT_PASSWORD_EXPIRY_DAYS;
  };

export const hashPassword = async (
  password,
) => {
  const normalized =
    validatePassword(password);

  return bcrypt.hash(
    normalized,
    getBcryptSaltRounds(),
  );
};

export const verifyPassword = async (
  password,
  passwordHash,
) =>
  bcrypt.compare(
    password,
    passwordHash,
  );

export const signAuthToken = (
  payload,
) =>
  jwt.sign(
    payload,
    getJwtSecret(),
    {
      expiresIn:
        getJwtExpiresIn(),
    },
  );

export const verifyAuthToken = (
  token,
) =>
  jwt.verify(
    token,
    getJwtSecret(),
  );

export const extractBearerToken = (
  authorizationHeader,
) => {
  if (
    !authorizationHeader ||
    typeof authorizationHeader !==
      "string"
  ) {
    return null;
  }

  const [
    scheme,
    token,
  ] =
    authorizationHeader.split(
      " ",
    );

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    return null;
  }

  return token.trim();
};

export const validatePassword = (
  password,
) => {
  if (
    typeof password !==
    "string"
  ) {
    throw new Error(
      "Password is required",
    );
  }

  const normalized =
    password.trim();

  if (
    normalized.length < 8
  ) {
    throw new Error(
      "Password must be at least 8 characters long",
    );
  }

  if (
    !/[A-Z]/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Password must contain at least one uppercase letter",
    );
  }

  if (
    !/[a-z]/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Password must contain at least one lowercase letter",
    );
  }

  if (
    !/\d/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Password must contain at least one number",
    );
  }

  return normalized;
};

export const isAccountLocked = (
  lockedUntil,
) => {
  if (!lockedUntil) {
    return false;
  }

  return (
    new Date(
      lockedUntil,
    ).getTime() >
    Date.now()
  );
};

export const getPasswordExpiryDate =
  () => {
    const expiresAt =
      new Date();

    expiresAt.setDate(
      expiresAt.getDate() +
        getPasswordExpiryDays(),
    );

    return expiresAt;
  };

export const mapUserProfile = (
  user,
) => ({
  id: Number(user.id),

  username:
    user.username,

  email:
    user.email,

  firstName:
    user.first_name,

  lastName:
    user.last_name,

  fullName:
    `${user.first_name} ${
      user.last_name ?? ""
    }`.trim(),

  employeeId:
    user.employee_id
      ? Number(
          user.employee_id,
        )
      : null,

  employeeCode:
    user.employee_code ??
    null,

  employeeStatus:
    user.employee_status ??
    null,

  /*
  |--------------------------------------------------------------------------
  | Employee Designation
  |--------------------------------------------------------------------------
  |
  | Designation is the employee's actual job title.
  | It is intentionally separate from the system role.
  |
  */

  designation:
    user.designation ??
    null,

  departmentId:
    user.department_id
      ? Number(
          user.department_id,
        )
      : null,

  department:
    user.department_name ??
    null,

  isActive:
    user.is_active,

  failedLoginAttempts:
    Number(
      user.failed_login_attempts ??
        0,
    ),

  lockedUntil:
    user.locked_until,

  lastLoginAt:
    user.last_login_at,

  passwordChangedAt:
    user.password_changed_at,

  passwordExpiresAt:
    user.password_expires_at,

  createdAt:
    user.created_at,

  updatedAt:
    user.updated_at,
});

export const parseJsonSafe = (
  value,
  fallback,
) => {
  try {
    return value
      ? JSON.parse(value)
      : fallback;
  } catch {
    return fallback;
  }
};