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

type SettingsSection =
  | "account"
  | "preferences"
  | "notifications"
  | "security";

interface NotificationPreferences {
  emailNotifications: boolean;
  hrAnnouncements: boolean;
  payrollNotifications: boolean;
  trainingNotifications: boolean;
}

interface SettingsState {
  displayName: string;
  email: string;
  role: string;
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
}

const DEFAULT_SETTINGS: SettingsState = {
  displayName: "Anita Kumar",
  email: "anita.kumar@aakamhrms.com",
  role: "HR Manager",
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

const STORAGE_KEY =
  "aakam_hrms_settings";

function Settings() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(
      "account",
    );

  const [settings, setSettings] =
    useState<SettingsState>(
      DEFAULT_SETTINGS,
    );

  const [saved, setSaved] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD SETTINGS
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
  | RESET SETTINGS
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    setSettings(
      DEFAULT_SETTINGS,
    );

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
  | SECTION CONTENT
  |--------------------------------------------------------------------------
  */

  const renderAccountSection =
    () => (
      <div className="space-y-6">

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Account
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account information.
          </p>
        </div>

        {/* Profile */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white">
              AK
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                {settings.displayName}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {settings.role}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Name */}

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
                    settings.displayName
                  }
                  onChange={(event) =>
                    updateSetting(
                      "displayName",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Email */}

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
                    settings.email
                  }
                  onChange={(event) =>
                    updateSetting(
                      "email",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Role */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Role
              </label>

              <input
                type="text"
                value={settings.role}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
              />
            </div>

            {/* Account status */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Status
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <span className="text-sm font-medium text-emerald-700">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account information */}

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
                Your account is currently active
                and has HR Manager access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );

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

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Language */}

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
                  <option>
                    English
                  </option>

                  <option>
                    Tamil
                  </option>

                  <option>
                    Hindi
                  </option>
                </select>
              </div>
            </div>

            {/* Timezone */}

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

            {/* Date format */}

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
                <option>
                  DD/MM/YYYY
                </option>

                <option>
                  MM/DD/YYYY
                </option>

                <option>
                  YYYY-MM-DD
                </option>
              </select>
            </div>
          </div>
        </div>

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

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <h3 className="font-semibold text-slate-900">
            Security Status
          </h3>

          <div className="mt-5 space-y-4">

            <SecurityRow
              title="Account Status"
              value="Active"
              positive
            />

            <SecurityRow
              title="Role"
              value={settings.role}
            />

            <SecurityRow
              title="Authentication"
              value="Application managed"
            />
          </div>
        </div>

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
                controls will become available when
                the application authentication flow is
                enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    );

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

            {activeSection ===
              "account" &&
              renderAccountSection()}

            {activeSection ===
              "preferences" &&
              renderPreferencesSection()}

            {activeSection ===
              "notifications" &&
              renderNotificationsSection()}

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
  onChange: (value: boolean) => void;
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

export default Settings;