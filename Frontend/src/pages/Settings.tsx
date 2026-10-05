import {
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Globe,
  LockKeyhole,
  Mail,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import DashboardLayout from "../components/layout/DashboardLayout";

import { useAuth } from "../context/AuthContext";

import {
  getEmployeeById,
  type Employee,
} from "../services/workforceService";

/*
|--------------------------------------------------------------------------
| Settings Section
|--------------------------------------------------------------------------
*/

type SettingsSection =
  | "account"
  | "preferences"
  | "notifications"
  | "security";

/*
|--------------------------------------------------------------------------
| Notification Preferences
|--------------------------------------------------------------------------
*/

interface NotificationPreferences {
  emailNotifications: boolean;
  hrAnnouncements: boolean;
  payrollNotifications: boolean;
  trainingNotifications: boolean;
}

/*
|--------------------------------------------------------------------------
| Application Settings
|--------------------------------------------------------------------------
*/

interface SettingsState {
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
}

/*
|--------------------------------------------------------------------------
| Auth User Types
|--------------------------------------------------------------------------
*/

interface AuthEmployee {
  id?: number | string;
  firstName?: string;
  lastName?: string | null;
  fullName?: string;
  email?: string;
  designation?: string;
  status?: string;
  employmentStatus?: string;
}

interface AuthRole {
  name?: string;
}

interface AuthUserShape {
  id?: number | string;
  username?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string | null;
  email?: string;
  designation?: string;
  role?: string;
  roles?: AuthRole[];
  employee?: AuthEmployee | null;
  employeeId?: number | string | null;
  employee_id?: number | string | null;
  isActive?: boolean;
}

/*
|--------------------------------------------------------------------------
| Account Profile
|--------------------------------------------------------------------------
*/

interface AccountProfile {
  displayName: string;
  email: string;
  username: string;
  designation: string;
  role: string;
  status: string;
}

/*
|--------------------------------------------------------------------------
| Default Application Settings
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Account name, email and designation are NOT stored here.
| They are loaded from the authenticated employee record.
|
|--------------------------------------------------------------------------
*/

const DEFAULT_SETTINGS: SettingsState = {
  language: "English",

  timezone: "Asia/Kolkata",

  dateFormat: "DD/MM/YYYY",

  notifications: {
    emailNotifications: true,

    hrAnnouncements: true,

    payrollNotifications: true,

    trainingNotifications: true,
  },
};

/*
|--------------------------------------------------------------------------
| Local Storage
|--------------------------------------------------------------------------
*/

const STORAGE_KEY =
  "aakam_hrms_settings";

/*
|--------------------------------------------------------------------------
| Format Status
|--------------------------------------------------------------------------
*/

const formatStatus = (
  value: string,
): string => {
  if (!value) {
    return "Active";
  }

  const normalized =
    value.toUpperCase();

  if (normalized === "ACTIVE") {
    return "Active";
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
};

/*
|--------------------------------------------------------------------------
| Get Display Name
|--------------------------------------------------------------------------
|
| Always prefer:
|
| First Name + " " + Last Name
|
| Example:
|
| Vijay
| Krishnan
|
| becomes:
|
| Vijay Krishnan
|
|--------------------------------------------------------------------------
*/

const buildDisplayName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null,
): string => {
  const first =
    firstName?.trim() ?? "";

  const last =
    lastName?.trim() ?? "";

  const combined =
    `${first} ${last}`.trim();

  if (combined) {
    return combined;
  }

  return (
    fallback?.trim() ||
    "User"
  );
};

/*
|--------------------------------------------------------------------------
| Get Initials
|--------------------------------------------------------------------------
*/

const getInitials = (
  displayName: string,
): string => {
  const parts =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return "US";
};

/*
|--------------------------------------------------------------------------
| Settings Component
|--------------------------------------------------------------------------
*/

function Settings() {
  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  const { user } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | Active Settings Section
  |--------------------------------------------------------------------------
  */

  const [
    activeSection,
    setActiveSection,
  ] = useState<SettingsSection>(
    "account",
  );

  /*
  |--------------------------------------------------------------------------
  | Application Settings
  |--------------------------------------------------------------------------
  */

  const [
    settings,
    setSettings,
  ] = useState<SettingsState>(
    DEFAULT_SETTINGS,
  );

  /*
  |--------------------------------------------------------------------------
  | Logged-in Account Profile
  |--------------------------------------------------------------------------
  */

  const [
    accountProfile,
    setAccountProfile,
  ] = useState<AccountProfile>({
    displayName: "",
    email: "",
    username: "",
    designation: "",
    role: "",
    status: "",
  });

  /*
  |--------------------------------------------------------------------------
  | Account Loading
  |--------------------------------------------------------------------------
  */

  const [
    accountLoading,
    setAccountLoading,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Saved Message
  |--------------------------------------------------------------------------
  */

  const [
    saved,
    setSaved,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD ACCOUNT PROFILE
  |--------------------------------------------------------------------------
  |
  | The account information comes from:
  |
  | AuthContext
  |       ↓
  | employeeId
  |       ↓
  | getEmployeeById()
  |       ↓
  | employees table
  |
  | This ensures Settings always reflects the actual
  | employee record.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const loadAccountProfile =
      async () => {
        try {
          setAccountLoading(true);

          const authUser =
            (user ?? null) as
              | AuthUserShape
              | null;

          /*
          |--------------------------------------------------------------------------
          | Employee embedded in auth user
          |--------------------------------------------------------------------------
          */

          const authEmployee =
            authUser?.employee ??
            null;

          /*
          |--------------------------------------------------------------------------
          | First Name
          |--------------------------------------------------------------------------
          */

          const firstName =
            authEmployee?.firstName ??
            authUser?.firstName ??
            "";

          /*
          |--------------------------------------------------------------------------
          | Last Name
          |--------------------------------------------------------------------------
          */

          const lastName =
            authEmployee?.lastName ??
            authUser?.lastName ??
            "";

          /*
          |--------------------------------------------------------------------------
          | Employee ID
          |--------------------------------------------------------------------------
          */

          const employeeId =
            authEmployee?.id ??
            authUser?.employeeId ??
            authUser?.employee_id ??
            null;

          /*
          |--------------------------------------------------------------------------
          | Start with authenticated user data
          |--------------------------------------------------------------------------
          */

          let employeeRecord:
            | Employee
            | null = null;

          /*
          |--------------------------------------------------------------------------
          | Load actual employee record
          |--------------------------------------------------------------------------
          |
          | This is important because the employee table contains:
          |
          | - firstName
          | - lastName
          | - email / work email
          | - designation
          | - status
          | - department
          |
          |--------------------------------------------------------------------------
          */

          if (employeeId) {
            try {
              employeeRecord =
                await getEmployeeById(
                  employeeId,
                );
            } catch (error) {
              console.error(
                "Failed to load employee account record:",
                error,
              );
            }
          }

          /*
          |--------------------------------------------------------------------------
          | FIRST NAME + LAST NAME
          |--------------------------------------------------------------------------
          |
          | Always build the display name from the employee
          | firstName and lastName.
          |
          |--------------------------------------------------------------------------
          */

          const displayName =
            buildDisplayName(
              employeeRecord?.firstName ??
                firstName,

              employeeRecord?.lastName ??
                lastName,

              authUser?.fullName ??
                authUser?.name ??
                authUser?.username,
            );

          /*
          |--------------------------------------------------------------------------
          | WORK EMAIL
          |--------------------------------------------------------------------------
          |
          | Employee record is the primary source.
          |
          |--------------------------------------------------------------------------
          */

          const workEmail =
            employeeRecord?.email ??
            authEmployee?.email ??
            authUser?.email ??
            "";

          /*
          |--------------------------------------------------------------------------
          | USERNAME
          |--------------------------------------------------------------------------
          */

          const username =
            authUser?.username ??
            "";

          /*
          |--------------------------------------------------------------------------
          | DESIGNATION
          |--------------------------------------------------------------------------
          |
          | Designation is the employee's actual job title.
          |
          | Example:
          |
          | System Administrator
          |
          | This is different from:
          |
          | SUPER_ADMINISTRATOR
          |
          |--------------------------------------------------------------------------
          */

          const designation =
            employeeRecord?.designation ??
            authEmployee?.designation ??
            authUser?.designation ??
            "";

          /*
          |--------------------------------------------------------------------------
          | SYSTEM ROLE
          |--------------------------------------------------------------------------
          */

        const authenticatedRole =
  authUser?.roles?.[0]?.name ??
  authUser?.role ??
  "";

const systemRole =
  authenticatedRole ||
  employeeRecord?.systemRole ||
  "";
          /*
          |--------------------------------------------------------------------------
          | ACCOUNT STATUS
          |--------------------------------------------------------------------------
          */

          const rawStatus =
            employeeRecord?.status ??
            authEmployee?.status ??
            authEmployee?.employmentStatus ??
            (authUser?.isActive === false
              ? "INACTIVE"
              : "ACTIVE");

          const status =
            formatStatus(
              rawStatus,
            );

          /*
          |--------------------------------------------------------------------------
          | Update state
          |--------------------------------------------------------------------------
          */

          if (!cancelled) {
            setAccountProfile({
              displayName,

              email: workEmail,

              username,

              designation:
                designation ||
                "Employee",

              role:
                systemRole ||
                "Employee",

              status,
            });
          }
        } catch (error) {
          console.error(
            "Failed to load account profile:",
            error,
          );
        } finally {
          if (!cancelled) {
            setAccountLoading(false);
          }
        }
      };

    loadAccountProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /*
  |--------------------------------------------------------------------------
  | LOAD SAVED APPLICATION SETTINGS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const storedSettings =
        localStorage.getItem(
          STORAGE_KEY,
        );

      if (!storedSettings) {
        return;
      }

      const parsedSettings =
        JSON.parse(
          storedSettings,
        ) as Partial<SettingsState>;

      setSettings({
        ...DEFAULT_SETTINGS,

        ...parsedSettings,

        notifications: {
          ...DEFAULT_SETTINGS.notifications,

          ...(parsedSettings.notifications ??
            {}),
        },
      });
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error,
      );
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SAVE SETTINGS
  |--------------------------------------------------------------------------
  */

  const handleSave = () => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Only application preferences are stored.
      |
      | Employee name/email/designation are intentionally NOT stored here.
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Failed to save settings:",
        error,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE SETTING
  |--------------------------------------------------------------------------
  */

  const updateSetting = <
    K extends keyof SettingsState,
  >(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings(
      (currentSettings) => ({
        ...currentSettings,

        [key]: value,
      }),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE NOTIFICATION SETTING
  |--------------------------------------------------------------------------
  */

  const updateNotificationSetting = (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    setSettings(
      (currentSettings) => ({
        ...currentSettings,

        notifications: {
          ...currentSettings.notifications,

          [key]: value,
        },
      }),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RESET PREFERENCES
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    setSettings({
      ...DEFAULT_SETTINGS,

      notifications: {
        ...DEFAULT_SETTINGS.notifications,
      },
    });

    localStorage.removeItem(
      STORAGE_KEY,
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT SECTION
  |--------------------------------------------------------------------------
  */

  const renderAccountSection =
    () => (
      <div className="space-y-6">

        {/* ================================================================
            ACCOUNT HEADER
        ================================================================ */}

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Account
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account information.
          </p>
        </div>

        {/* ================================================================
            PROFILE
        ================================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">

            {/* Avatar */}

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white">
              {accountLoading
                ? "..."
                : getInitials(
                    accountProfile.displayName,
                  )}
            </div>

            {/* Name + Designation */}

            <div>
              <h3 className="font-semibold text-slate-900">
                {accountLoading
                  ? "Loading..."
                  : accountProfile.displayName}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {accountLoading
                  ? "Loading account..."
                  : accountProfile.designation}
              </p>
            </div>
          </div>

          {/* ============================================================
              ACCOUNT FIELDS
          ============================================================ */}

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* ==========================================================
                DISPLAY NAME
            ========================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Display Name
              </label>

              <div className="relative">

                <User
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={
                    accountLoading
                      ? "Loading..."
                      : accountProfile.displayName
                  }
                  readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none"
                />

              </div>
            </div>

            {/* ==========================================================
                WORK EMAIL
            ========================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={
                    accountLoading
                      ? "Loading..."
                      : accountProfile.email
                  }
                  readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none"
                />

              </div>
            </div>

            {/* ==========================================================
                DESIGNATION
            ========================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Designation
              </label>

              <input
                type="text"
                value={
                  accountLoading
                    ? "Loading..."
                    : accountProfile.designation
                }
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
              />
            </div>

            {/* ==========================================================
                SYSTEM ROLE
            ========================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                System Role
              </label>

              <input
                type="text"
                value={
                  accountLoading
                    ? "Loading..."
                    : accountProfile.role
                }
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500 outline-none"
              />
            </div>

            {/* ==========================================================
                USERNAME
            ========================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <input
                type="text"
                value={
                  accountLoading
                    ? "Loading..."
                    : accountProfile.username
                }
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
              />
            </div>

            {/* ==========================================================
                ACCOUNT STATUS
            ========================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Status
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <span className="text-sm font-medium text-emerald-700">
                  {accountLoading
                    ? "Loading..."
                    : accountProfile.status}
                </span>

              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            ACCOUNT INFORMATION
        ================================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck size={20} />
            </div>

            <div>

              <h3 className="font-semibold text-slate-900">
                Account Information
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {accountLoading
                  ? "Loading your account information..."
                  : `Your account is currently ${accountProfile.status.toLowerCase()} and your designation is ${accountProfile.designation}.`}
              </p>

            </div>

          </div>

        </div>

      </div>
    );

  /*
  |--------------------------------------------------------------------------
  | PREFERENCES SECTION
  |--------------------------------------------------------------------------
  */

  const renderPreferencesSection =
    () => (
      <div className="space-y-6">

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Preferences
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Customize your Aakam HRMS experience.
          </p>
        </div>

        {/* ================================================================
            PREFERENCE FORM
        ================================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* ==========================================================
                LANGUAGE
            ========================================================== */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Language
              </label>

              <div className="relative">

                <Globe
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={
                    settings.language
                  }
                  onChange={(event) =>
                    updateSetting(
                      "language",
                      event.target.value,
                    )
                  }
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="English">
                    English
                  </option>

                  <option value="Tamil">
                    Tamil
                  </option>

                  <option value="Hindi">
                    Hindi
                  </option>
                </select>

              </div>

            </div>

            {/* ==========================================================
                TIMEZONE
            ========================================================== */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Time Zone
              </label>

              <div className="relative">

                <Clock3
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={
                    settings.timezone
                  }
                  onChange={(event) =>
                    updateSetting(
                      "timezone",
                      event.target.value,
                    )
                  }
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Asia/Kolkata">
                    India Standard Time
                  </option>

                  <option value="UTC">
                    UTC
                  </option>

                  <option value="Europe/London">
                    London
                  </option>

                  <option value="America/New_York">
                    Eastern Time
                  </option>

                  <option value="America/Los_Angeles">
                    Pacific Time
                  </option>
                </select>

              </div>

            </div>

            {/* ==========================================================
                DATE FORMAT
            ========================================================== */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Date Format
              </label>

              <select
                value={
                  settings.dateFormat
                }
                onChange={(event) =>
                  updateSetting(
                    "dateFormat",
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="DD/MM/YYYY">
                  DD/MM/YYYY
                </option>

                <option value="MM/DD/YYYY">
                  MM/DD/YYYY
                </option>

                <option value="YYYY-MM-DD">
                  YYYY-MM-DD
                </option>
              </select>

            </div>

          </div>

        </div>

        {/* ================================================================
            INFORMATION
        ================================================================ */}

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">

          <div className="flex gap-3">

            <SettingsIcon
              size={19}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <div>

              <p className="text-sm font-semibold text-blue-900">
                Preference settings
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                These preferences are saved locally
                in this browser and will remain after
                refreshing the application.
              </p>

            </div>

          </div>

        </div>

      </div>
    );

  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS SECTION
  |--------------------------------------------------------------------------
  */

  const renderNotificationsSection =
    () => (
      <div className="space-y-6">

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Notification Preferences
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose which types of notifications you
            want to receive.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

          {/* Email Notifications */}

          <NotificationSetting
            icon={Bell}
            title="Email Notifications"
            description="Receive important HR notifications by email."
            enabled={
              settings.notifications
                .emailNotifications
            }
            onChange={(value) =>
              updateNotificationSetting(
                "emailNotifications",
                value,
              )
            }
          />

          {/* HR Announcements */}

          <NotificationSetting
            icon={Bell}
            title="HR Announcements"
            description="Receive organization-wide HR announcements."
            enabled={
              settings.notifications
                .hrAnnouncements
            }
            onChange={(value) =>
              updateNotificationSetting(
                "hrAnnouncements",
                value,
              )
            }
          />

          {/* Payroll Notifications */}

          <NotificationSetting
            icon={Bell}
            title="Payroll Notifications"
            description="Receive notifications related to payroll processing."
            enabled={
              settings.notifications
                .payrollNotifications
            }
            onChange={(value) =>
              updateNotificationSetting(
                "payrollNotifications",
                value,
              )
            }
          />

          {/* Training Notifications */}

          <NotificationSetting
            icon={Bell}
            title="Training Notifications"
            description="Receive updates about training programs and skills."
            enabled={
              settings.notifications
                .trainingNotifications
            }
            onChange={(value) =>
              updateNotificationSetting(
                "trainingNotifications",
                value,
              )
            }
            last
          />

        </div>

      </div>
    );

  /*
  |--------------------------------------------------------------------------
  | SECURITY SECTION
  |--------------------------------------------------------------------------
  */

  const renderSecuritySection =
    () => (
      <div className="space-y-6">

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Security
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review your account security information.
          </p>
        </div>

        {/* ================================================================
            PASSWORD
        ================================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <LockKeyhole size={20} />
            </div>

            <div className="flex-1">

              <h3 className="font-semibold text-slate-900">
                Password
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Password management is handled by the
                Aakam HRMS authentication system.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400"
              >
                Change Password
              </button>

            </div>

          </div>

        </div>

        {/* ================================================================
            SECURITY STATUS
        ================================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <h3 className="font-semibold text-slate-900">
            Security Status
          </h3>

          <div className="mt-5 space-y-4">

            <SecurityRow
              title="Account Status"
              value={
                accountLoading
                  ? "Loading..."
                  : accountProfile.status
              }
              positive={
                accountProfile.status ===
                "Active"
              }
            />

            <SecurityRow
              title="Role"
              value={
                accountLoading
                  ? "Loading..."
                  : accountProfile.role
              }
            />

            <SecurityRow
              title="Authentication"
              value="Application managed"
            />

          </div>

        </div>

        {/* ================================================================
            SECURITY INFORMATION
        ================================================================ */}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

          <div className="flex gap-3">

            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>

              <p className="text-sm font-semibold text-amber-900">
                Security controls
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Advanced password and authentication
                controls are managed by the Aakam HRMS
                authentication system.
              </p>

            </div>

          </div>

        </div>

      </div>
    );

  /*
  |--------------------------------------------------------------------------
  | MAIN RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div className="space-y-6">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md">
              <SettingsIcon size={22} />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your account and application preferences.
              </p>

            </div>

          </div>

        </div>

        {/* ================================================================
            SUCCESS MESSAGE
        ================================================================ */}

        {saved && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <div className="flex items-center gap-2">

              <Check size={17} />

              Settings saved successfully.

            </div>

            <button
              type="button"
              onClick={() =>
                setSaved(false)
              }
              className="rounded p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {/* ================================================================
            SETTINGS LAYOUT
        ================================================================ */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">

          {/* ============================================================
              SIDEBAR
          ============================================================ */}

          <div className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-5 py-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Settings
              </p>

            </div>

            <div className="p-2">

              {/* Account */}

              <SettingsNavItem
                icon={User}
                label="Account"
                active={
                  activeSection ===
                  "account"
                }
                onClick={() =>
                  setActiveSection(
                    "account",
                  )
                }
              />

              {/* Preferences */}

              <SettingsNavItem
                icon={Globe}
                label="Preferences"
                active={
                  activeSection ===
                  "preferences"
                }
                onClick={() =>
                  setActiveSection(
                    "preferences",
                  )
                }
              />

              {/* Notifications */}

              <SettingsNavItem
                icon={Bell}
                label="Notifications"
                active={
                  activeSection ===
                  "notifications"
                }
                onClick={() =>
                  setActiveSection(
                    "notifications",
                  )
                }
              />

              {/* Security */}

              <SettingsNavItem
                icon={LockKeyhole}
                label="Security"
                active={
                  activeSection ===
                  "security"
                }
                onClick={() =>
                  setActiveSection(
                    "security",
                  )
                }
              />

            </div>

          </div>

          {/* ============================================================
              CONTENT
          ============================================================ */}

          <div className="min-w-0">

            {/* Account */}

            {activeSection ===
              "account" &&
              renderAccountSection()}

            {/* Preferences */}

            {activeSection ===
              "preferences" &&
              renderPreferencesSection()}

            {/* Notifications */}

            {activeSection ===
              "notifications" &&
              renderNotificationsSection()}

            {/* Security */}

            {activeSection ===
              "security" &&
              renderSecuritySection()}

            {/* ========================================================
                ACTIONS
            ======================================================== */}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

              <button
                type="button"
                onClick={
                  handleReset
                }
                className="text-sm font-medium text-slate-500 transition hover:text-red-600"
              >
                Reset preferences
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-violet-700"
              >
                <Save size={16} />

                Save Changes
              </button>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| Settings Navigation Item
|--------------------------------------------------------------------------
*/

interface SettingsNavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SettingsNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: SettingsNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >

      <Icon
        size={18}
        className={
          active
            ? "text-blue-600"
            : "text-slate-400"
        }
      />

      <span className="flex-1">
        {label}
      </span>

      {active && (
        <ChevronRight
          size={16}
          className="text-blue-500"
        />
      )}

    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Notification Setting
|--------------------------------------------------------------------------
*/

interface NotificationSettingProps {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (
    value: boolean,
  ) => void;
  last?: boolean;
}

function NotificationSetting({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
  last = false,
}: NotificationSettingProps) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-5 ${
        last
          ? ""
          : "border-b border-slate-100"
      }`}
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() =>
          onChange(!enabled)
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >

        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Security Row
|--------------------------------------------------------------------------
*/

interface SecurityRowProps {
  title: string;
  value: string;
  positive?: boolean;
}

function SecurityRow({
  title,
  value,
  positive = false,
}: SecurityRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">

      <span className="text-sm text-slate-500">
        {title}
      </span>

      <span
        className={`text-sm font-semibold ${
          positive
            ? "text-emerald-600"
            : "text-slate-800"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default Settings;