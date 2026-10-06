import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getEmployeeById,
} from "../../services/workforceService";

import type {
  Employee,
} from "../../services/workforceService";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

import type {
  Notification,
} from "../../services/notificationService";

interface HeaderProps {
  onOpenSidebar: () => void;
}

/* ==========================================================================
   AUTH USER SHAPE

   Authentication/account information comes from AuthContext.

   Workforce employee information is loaded using employeeId whenever the
   authenticated role has access to the employee endpoint.

   If the endpoint is restricted for an employee self-service account,
   the authenticated user's employee information is used as a safe fallback.
========================================================================== */

interface HeaderUserShape {
  employeeId?: number | string | null;

  employee_id?: number | string | null;

  username?: string | null;

  firstName?: string | null;

  lastName?: string | null;

  fullName?: string | null;

  email?: string | null;

  designation?: string | null;

  employee?: {
    id?: number | string | null;

    firstName?: string | null;

    lastName?: string | null;

    fullName?: string | null;

    email?: string | null;

    designation?: string | null;

    status?: string | null;

    employmentStatus?: string | null;
  } | null;
}

/* ==========================================================================
   HEADER
========================================================================== */

function Header({
  onOpenSidebar,
}: HeaderProps) {
  const location = useLocation();

  const navigate = useNavigate();

  const {
    user,
    roles,
    logout,
  } = useAuth();

  /* ==========================================================================
     AUTH USER
  ========================================================================== */

  const authUser =
    user as unknown as HeaderUserShape | null;

  /* ==========================================================================
     REFS
  ========================================================================== */

  const notificationRef =
    useRef<HTMLDivElement | null>(null);

  const profileRef =
    useRef<HTMLDivElement | null>(null);

  /* ==========================================================================
     PAGE
  ========================================================================== */

  const isWorkforce =
    location.pathname.startsWith(
      "/workforce",
    );

  /* ==========================================================================
     PROFILE STATE
  ========================================================================== */

  const [
    profileOpen,
    setProfileOpen,
  ] = useState<boolean>(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState<boolean>(false);

  /* ==========================================================================
     WORKFORCE EMPLOYEE PROFILE

     Source of truth:

     AuthContext
          ↓
     employeeId
          ↓
     getEmployeeById()
          ↓
     Employee table

     For self-service users who do not have workforce.view permission,
     the login/current-user employee information is used as fallback.
  ========================================================================== */

  const [
    employeeProfile,
    setEmployeeProfile,
  ] = useState<Employee | null>(null);

  const [
    employeeLoading,
    setEmployeeLoading,
  ] = useState<boolean>(true);

  /* ==========================================================================
     NOTIFICATION STATE
  ========================================================================== */

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState<number>(0);

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState<boolean>(false);

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState<boolean>(false);

  const [
    notificationError,
    setNotificationError,
  ] = useState<string>("");

  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState<boolean>(false);

  /* ==========================================================================
     LOAD EMPLOYEE PROFILE

     IMPORTANT:

     We do NOT hardcode:
     - Virat
     - Saranya
     - Naveen
     - employee IDs
     - designations

     Everything comes from the authenticated account.
  ========================================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadEmployeeProfile =
      async () => {
        const employeeId =
          authUser?.employeeId ??
          authUser?.employee_id ??
          authUser?.employee?.id ??
          null;

        /* ---------------------------------------------------------------
           No employee ID
        ---------------------------------------------------------------- */

        if (!employeeId) {
          if (!cancelled) {
            setEmployeeProfile(null);

            setEmployeeLoading(false);
          }

          return;
        }

        /* ---------------------------------------------------------------
           First try the actual Workforce employee record.
        ---------------------------------------------------------------- */

        try {
          setEmployeeLoading(true);

          const employee =
            await getEmployeeById(
              employeeId,
            );

          if (!cancelled) {
            setEmployeeProfile(
              employee,
            );
          }

          return;
        } catch (error) {
          /*
           * Employee self-service users may not have workforce.view.
           *
           * In that situation getEmployeeById() can return 403.
           *
           * The authenticated user response already contains the
           * employee-linked information, so use that as fallback.
           */

          console.warn(
            "Unable to load Workforce employee profile directly. Using authenticated employee data.",
            error,
          );
        } finally {
          if (!cancelled) {
            setEmployeeLoading(false);
          }
        }

        /* ---------------------------------------------------------------
           FALLBACK TO AUTHENTICATED EMPLOYEE DATA
        ---------------------------------------------------------------- */

        if (cancelled) {
          return;
        }

        const authenticatedEmployee =
          authUser?.employee;

        const fallbackFirstName =
          authenticatedEmployee?.firstName ??
          authUser?.firstName ??
          "";

        const fallbackLastName =
          authenticatedEmployee?.lastName ??
          authUser?.lastName ??
          null;

        const fallbackFullName =
          authenticatedEmployee?.fullName ??
          authUser?.fullName ??
          `${fallbackFirstName} ${
            fallbackLastName ?? ""
          }`.trim();

        const fallbackEmail =
          authenticatedEmployee?.email ??
          authUser?.email ??
          "";

        const fallbackDesignation =
          authenticatedEmployee?.designation ??
          authUser?.designation ??
          "";

        const fallbackStatus =
          authenticatedEmployee?.status ??
          authenticatedEmployee?.employmentStatus ??
          "ACTIVE";

        /*
         * Create a Workforce-shaped object so the rest of the Header
         * continues using one single data source.
         */

        const fallbackEmployee =
          {
            id: Number(employeeId),

            username:
              authUser?.username ??
              "",

            employeeCode:
              "",

            firstName:
              fallbackFirstName,

            lastName:
              fallbackLastName,

            fullName:
              fallbackFullName,

            email:
              fallbackEmail,

            designation:
              fallbackDesignation,

            departmentId:
              null,

            department:
              "",

            /*
             * System role is populated separately from AuthContext.
             */

            systemRole:
              "",

            joiningDate:
              "",

            status:
              fallbackStatus,

            employmentType:
              "",

            createdAt:
              "",
          } satisfies Employee;

        setEmployeeProfile(
          fallbackEmployee,
        );
      };

    void loadEmployeeProfile();

    return () => {
      cancelled = true;
    };
  }, [
    authUser?.employeeId,
    authUser?.employee_id,
    authUser?.employee?.id,
  ]);

  /* ==========================================================================
     LOAD UNREAD COUNT
  ========================================================================== */

  const loadUnreadCount =
    useCallback(
      async () => {
        try {
          const count =
            await getUnreadNotificationCount();

          setUnreadCount(count);
        } catch (error) {
          console.error(
            "Failed to load notification count:",
            error,
          );
        }
      },
      [],
    );

  /* ==========================================================================
     LOAD NOTIFICATIONS
  ========================================================================== */

  const loadNotifications =
    useCallback(
      async () => {
        try {
          setNotificationLoading(
            true,
          );

          setNotificationError("");

          const data =
            await getNotifications();

          setNotifications(data);

          const unread =
            data.filter(
              (
                notification,
              ) =>
                !notification.isRead,
            ).length;

          setUnreadCount(
            unread,
          );
        } catch (error) {
          console.error(
            "Failed to load notifications:",
            error,
          );

          setNotificationError(
            "Unable to load notifications.",
          );
        } finally {
          setNotificationLoading(
            false,
          );
        }
      },
      [],
    );

  /* ==========================================================================
     INITIAL UNREAD COUNT
  ========================================================================== */

  useEffect(() => {
    void loadUnreadCount();
  }, [
    loadUnreadCount,
  ]);

  /* ==========================================================================
     REFRESH UNREAD COUNT
  ========================================================================== */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          void loadUnreadCount();
        },
        15000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    loadUnreadCount,
  ]);

  /* ==========================================================================
     LOAD NOTIFICATIONS WHEN OPEN
  ========================================================================== */

  useEffect(() => {
    if (notificationOpen) {
      void loadNotifications();
    }
  }, [
    notificationOpen,
    loadNotifications,
  ]);

  /* ==========================================================================
     CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  ========================================================================== */

  useEffect(() => {
    const handleClickOutside =
      (event: MouseEvent) => {
        const target =
          event.target as Node;

        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            target,
          )
        ) {
          setNotificationOpen(
            false,
          );
        }

        if (
          profileRef.current &&
          !profileRef.current.contains(
            target,
          )
        ) {
          setProfileOpen(
            false,
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /* ==========================================================================
     PROFILE DISPLAY DATA

     Employee table is preferred.

     Authenticated employee data is the fallback.
  ========================================================================== */

  const employeeFirstName =
    employeeProfile?.firstName?.trim() ||
    authUser?.employee?.firstName?.trim() ||
    authUser?.firstName?.trim() ||
    "";

  const employeeLastName =
    employeeProfile?.lastName?.trim() ||
    authUser?.employee?.lastName?.trim() ||
    authUser?.lastName?.trim() ||
    "";

  const employeeFullName =
    employeeProfile?.fullName?.trim() ||
    authUser?.employee?.fullName?.trim() ||
    authUser?.fullName?.trim() ||
    `${employeeFirstName} ${employeeLastName}`
      .trim() ||
    "User";

  /* ==========================================================================
     SYSTEM ROLE

     The RBAC role belongs to AuthContext.

     Example:

     EMPLOYEE
     MANAGER
     RECRUITER
     HR_ADMINISTRATOR
     COMPANY_ADMINISTRATOR
     PAYROLL_ADMINISTRATOR
     SUPER_ADMINISTRATOR
  ========================================================================== */

  const systemRole =
    roles?.[0]?.trim() ||
    employeeProfile?.systemRole?.trim() ||
    "-";

  /* ==========================================================================
     DESIGNATION

     Comes from employee record.

     Example:

     Software developer
     Manager
     HR Administrator
     Recruiter
     Payroll Administrator
  ========================================================================== */

  const designation =
    employeeProfile?.designation?.trim() ||
    authUser?.employee?.designation?.trim() ||
    authUser?.designation?.trim() ||
    "-";

  /* ==========================================================================
     USERNAME

     Username belongs to the authentication account.
  ========================================================================== */

  const username =
    authUser?.username?.trim() ||
    "-";

  /* ==========================================================================
     INITIALS
  ========================================================================== */

  const getInitials = (
    firstName?: string | null,
    lastName?: string | null,
    fullName?: string | null,
  ) => {
    const first =
      firstName?.trim() || "";

    const last =
      lastName?.trim() || "";

    if (
      first &&
      last
    ) {
      return `${first[0]}${last[0]}`
        .toUpperCase();
    }

    if (first) {
      return first
        .slice(0, 2)
        .toUpperCase();
    }

    if (fullName) {
      const parts =
        fullName
          .trim()
          .split(/\s+/);

      if (
        parts.length >= 2
      ) {
        return `${parts[0][0]}${parts[1][0]}`
          .toUpperCase();
      }

      return fullName
        .slice(0, 2)
        .toUpperCase();
    }

    return "U";
  };

  const userInitials =
    getInitials(
      employeeFirstName,
      employeeLastName,
      employeeFullName,
    );

  /* ==========================================================================
     TOGGLE NOTIFICATIONS
  ========================================================================== */

  const handleNotificationToggle =
    () => {
      setNotificationOpen(
        (current) => !current,
      );

      setProfileOpen(false);
    };

  /* ==========================================================================
     TOGGLE PROFILE
  ========================================================================== */

  const handleProfileToggle =
    () => {
      setProfileOpen(
        (current) => !current,
      );

      setNotificationOpen(
        false,
      );
    };

  /* ==========================================================================
     LOGOUT
  ========================================================================== */

  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      try {
        setLoggingOut(true);

        await logout();

        navigate(
          "/login",
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "Logout failed:",
          error,
        );

        navigate(
          "/login",
          {
            replace: true,
          },
        );
      } finally {
        setLoggingOut(false);
      }
    };

  /* ==========================================================================
     MARK NOTIFICATION AS READ
  ========================================================================== */

  const handleMarkAsRead =
    async (
      notificationId: number,
    ) => {
      try {
        const updated =
          await markNotificationAsRead(
            notificationId,
          );

        setNotifications(
          (
            currentNotifications,
          ) =>
            currentNotifications.map(
              (
                notification,
              ) =>
                notification.id ===
                updated.id
                  ? updated
                  : notification,
            ),
        );

        setUnreadCount(
          (currentCount) =>
            Math.max(
              0,
              currentCount - 1,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to mark notification as read:",
          error,
        );
      }
    };

  /* ==========================================================================
     MARK ALL AS READ
  ========================================================================== */

  const handleMarkAllAsRead =
    async () => {
      if (
        unreadCount === 0 ||
        markingAllRead
      ) {
        return;
      }

      try {
        setMarkingAllRead(
          true,
        );

        await markAllNotificationsAsRead();

        setNotifications(
          (
            currentNotifications,
          ) =>
            currentNotifications.map(
              (
                notification,
              ) => ({
                ...notification,
                isRead: true,
              }),
            ),
        );

        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Failed to mark all notifications as read:",
          error,
        );
      } finally {
        setMarkingAllRead(
          false,
        );
      }
    };

  /* ==========================================================================
     VIEW ALL NOTIFICATIONS
  ========================================================================== */

  const handleViewAll =
    () => {
      setNotificationOpen(
        false,
      );

      navigate(
        "/notifications",
      );
    };

  /* ==========================================================================
     FORMAT NOTIFICATION DATE
  ========================================================================== */

  const formatNotificationDate =
    (
      dateString: string,
    ) => {
      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return "";
      }

      return date.toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    };

  /* ==========================================================================
     LATEST NOTIFICATIONS
  ========================================================================== */

  const latestNotifications =
    notifications.slice(
      0,
      5,
    );

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <header
      className="
        dashboard-card
        flex
        flex-col
        gap-5
        px-5
        py-5
        sm:px-7
        sm:py-6
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >
      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={
            onOpenSidebar
          }
          className="
            inline-flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            text-slate-700
            transition
            hover:border-slate-300
            hover:bg-slate-50
            lg:hidden
          "
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          {isWorkforce ? (
            <h1
              className="
                m-0
                text-2xl
                font-semibold
                tracking-tight
                text-slate-900
                sm:text-[28px]
              "
            >
              Employees
            </h1>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-500">
                Welcome back
              </p>

              <h1
                className="
                  m-0
                  text-2xl
                  font-semibold
                  tracking-tight
                  text-slate-900
                  sm:text-[30px]
                "
              >
                HR Dashboard
              </h1>

              <p className="m-0 mt-1 text-sm text-slate-500">
                Here's what's happening with
                your organization.
              </p>
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div
        className="
          flex
          min-w-0
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
        "
      >
        <label
          className="
            flex
            min-w-0
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
            sm:min-w-[280px]
          "
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />

          <input
            type="search"
            placeholder="Search employees, reports, alerts..."
            className="
              w-full
              border-0
              bg-transparent
              text-sm
              text-slate-700
              outline-none
              placeholder:text-slate-400
            "
          />
        </label>

        <div className="flex items-center gap-2 sm:gap-3">

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              onClick={
                handleNotificationToggle
              }
              className="
                relative
                inline-flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-slate-200
                bg-white
                text-slate-600
                transition
                hover:border-slate-300
                hover:bg-slate-50
              "
              aria-label="Notifications"
              aria-expanded={
                notificationOpen
              }
            >
              <Bell className="h-5 w-5" />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    min-h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-rose-500
                    px-1
                    text-[10px]
                    font-bold
                    leading-none
                    text-white
                    ring-2
                    ring-white
                  "
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                className="
                  absolute
                  right-0
                  z-50
                  mt-3
                  w-[360px]
                  max-w-[calc(100vw-2rem)]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-xl
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-slate-200
                    px-4
                    py-4
                  "
                >
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Notifications
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : "You're all caught up"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationOpen(
                        false,
                      )
                    }
                    className="
                      rounded-lg
                      p-1.5
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                    "
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                {unreadCount > 0 && (
                  <div className="border-b border-slate-100 px-4 py-2">
                    <button
                      type="button"
                      onClick={
                        handleMarkAllAsRead
                      }
                      disabled={
                        markingAllRead
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        text-xs
                        font-semibold
                        text-blue-600
                        transition
                        hover:text-blue-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {markingAllRead ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCheck
                          size={14}
                        />
                      )}

                      Mark all as read
                    </button>
                  </div>
                )}

                {notificationLoading ? (
                  <div
                    className="
                      flex
                      min-h-[180px]
                      items-center
                      justify-center
                    "
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Loading...
                    </div>
                  </div>
                ) : notificationError ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-red-600">
                      {
                        notificationError
                      }
                    </p>

                    <button
                      type="button"
                      onClick={
                        loadNotifications
                      }
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Try again
                    </button>
                  </div>
                ) : latestNotifications.length ===
                  0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Bell size={20} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      No notifications
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      New announcements will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    {latestNotifications.map(
                      (
                        notification,
                      ) => (
                        <div
                          key={
                            notification.id
                          }
                          className={`
                            border-b
                            border-slate-100
                            px-4
                            py-3.5
                            transition
                            last:border-b-0
                            hover:bg-slate-50
                            ${
                              notification.isRead
                                ? "bg-white"
                                : "bg-blue-50/40"
                            }
                          `}
                        >
                          <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                              <Bell
                                size={15}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-xs font-bold text-slate-900">
                                      {
                                        notification.senderName
                                      }
                                    </p>

                                    {!notification.isRead && (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                  </div>

                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {
                                      notification.recipientType ===
                                      "ALL"
                                        ? "Everyone"
                                        : notification.recipientType
                                    }

                                    {" • "}

                                    {
                                      formatNotificationDate(
                                        notification.createdAt,
                                      )
                                    }
                                  </p>
                                </div>

                                {!notification.isRead && (
                                  <button
                                    type="button"
                                    title="Mark as read"
                                    onClick={() =>
                                      void handleMarkAsRead(
                                        notification.id,
                                      )
                                    }
                                    className="
                                      shrink-0
                                      rounded-md
                                      p-1
                                      text-slate-400
                                      transition
                                      hover:bg-emerald-50
                                      hover:text-emerald-600
                                    "
                                  >
                                    <Check
                                      size={15}
                                    />
                                  </button>
                                )}
                              </div>

                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                                {
                                  notification.message
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="border-t border-slate-200 bg-slate-50 p-3">
                  <button
                    type="button"
                    onClick={
                      handleViewAll
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      rounded-lg
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-blue-600
                      transition
                      hover:bg-blue-50
                    "
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              USER PROFILE
          ================================================= */}

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={
                handleProfileToggle
              }
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-left
                transition
                hover:border-slate-300
                hover:bg-slate-50
              "
              aria-label="Open user menu"
              aria-expanded={
                profileOpen
              }
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-blue-600
                  to-cyan-400
                  text-sm
                  font-semibold
                  text-white
                "
              >
                {userInitials}
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                  {employeeLoading
                    ? "Loading..."
                    : employeeFullName}
                </p>

                <p className="max-w-[180px] truncate text-xs text-slate-500">
                  {employeeLoading
                    ? ""
                    : systemRole}
                </p>
              </div>

              <ChevronDown
                className={`
                  hidden
                  h-4
                  w-4
                  shrink-0
                  text-slate-400
                  transition
                  sm:block
                  ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {/* =================================================
                PROFILE DROPDOWN
            ================================================= */}

            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  z-50
                  mt-3
                  w-[300px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-xl
                "
              >
                {/* USER INFORMATION */}

                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-gradient-to-br
                        from-blue-600
                        to-violet-600
                        text-sm
                        font-bold
                        text-white
                      "
                    >
                      {userInitials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {employeeLoading
                          ? "Loading..."
                          : employeeFullName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACCOUNT DETAILS */}

                <div className="border-b border-slate-100 px-4 py-3">

                  {/* Designation */}

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Designation
                    </span>

                    <span className="max-w-[190px] truncate text-xs font-medium text-slate-700">
                      {employeeLoading
                        ? "-"
                        : designation}
                    </span>
                  </div>

                  {/* System Role */}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      System Role
                    </span>

                    <span className="max-w-[190px] truncate text-xs font-medium text-slate-700">
                      {employeeLoading
                        ? "-"
                        : systemRole}
                    </span>
                  </div>

                  {/* Username */}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Username
                    </span>

                    <span className="max-w-[190px] truncate text-xs font-medium text-slate-700">
                      {username}
                    </span>
                  </div>
                </div>

                {/* ACCOUNT SETTINGS / SIGN OUT */}

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(
                        false,
                      );

                      navigate(
                        "/settings",
                      );
                    }}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      font-medium
                      text-slate-700
                      transition
                      hover:bg-slate-50
                    "
                  >
                    <UserRound className="h-4 w-4 text-slate-400" />

                    Account Settings
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    disabled={
                      loggingOut
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      font-semibold
                      text-red-600
                      transition
                      hover:bg-red-50
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loggingOut ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                      />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}

                    {loggingOut
                      ? "Signing out..."
                      : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;