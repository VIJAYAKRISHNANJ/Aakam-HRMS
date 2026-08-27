import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Menu,
  Search,
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

function Header({
  onOpenSidebar,
}: HeaderProps) {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const notificationRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const isWorkforce =
    location.pathname.startsWith(
      "/workforce",
    );

  /*
  |--------------------------------------------------------------------------
  | Notification State
  |--------------------------------------------------------------------------
  */

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState<number>(0);

  const [notificationOpen, setNotificationOpen] =
    useState<boolean>(false);

  const [notificationLoading, setNotificationLoading] =
    useState<boolean>(false);

  const [notificationError, setNotificationError] =
    useState<string>("");

  const [markingAllRead, setMarkingAllRead] =
    useState<boolean>(false);

  /*
  |--------------------------------------------------------------------------
  | Load Unread Count
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Load Notifications
  |--------------------------------------------------------------------------
  */

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
              (notification) =>
                !notification.isRead,
            ).length;

          setUnreadCount(unread);
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

  /*
  |--------------------------------------------------------------------------
  | Initial Unread Count
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  /*
  |--------------------------------------------------------------------------
  | Refresh Unread Count
  |
  | Checks periodically so a newly-created notification
  | can appear in the header without refreshing the page.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          loadUnreadCount();
        },
        15000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadUnreadCount]);

  /*
  |--------------------------------------------------------------------------
  | Load Notifications When Dropdown Opens
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (notificationOpen) {
      loadNotifications();
    }
  }, [
    notificationOpen,
    loadNotifications,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Close Dropdown When Clicking Outside
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClickOutside =
      (event: MouseEvent) => {
        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            event.target as Node,
          )
        ) {
          setNotificationOpen(
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

  /*
  |--------------------------------------------------------------------------
  | Toggle Notification Dropdown
  |--------------------------------------------------------------------------
  */

  const handleNotificationToggle =
    () => {
      setNotificationOpen(
        (current) => !current,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Mark Notification As Read
  |--------------------------------------------------------------------------
  */

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
          (currentNotifications) =>
            currentNotifications.map(
              (notification) =>
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

  /*
  |--------------------------------------------------------------------------
  | Mark All Notifications As Read
  |--------------------------------------------------------------------------
  */

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
          (currentNotifications) =>
            currentNotifications.map(
              (notification) => ({
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

  /*
  |--------------------------------------------------------------------------
  | View All Notifications
  |--------------------------------------------------------------------------
  */

  const handleViewAll =
    () => {
      setNotificationOpen(
        false,
      );

      navigate(
        "/notifications",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Format Date
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Latest Notifications
  |
  | Header only displays a small number.
  |--------------------------------------------------------------------------
  */

  const latestNotifications =
    notifications.slice(
      0,
      5,
    );

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
          onClick={onOpenSidebar}
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
              NOTIFICATION BUTTON + DROPDOWN
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

              {/* Unread Badge */}

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

            {/* =================================================
                DROPDOWN
            ================================================= */}

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
                {/* Dropdown Header */}

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
                    <X
                      size={16}
                    />
                  </button>
                </div>

                {/* Mark All */}

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

                {/* Loading */}

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
                            {/* Avatar */}

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                              <Bell
                                size={15}
                              />
                            </div>

                            {/* Content */}

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
                                      handleMarkAsRead(
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

                {/* Footer */}

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

          <button
            type="button"
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
              AK
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                Anita Kumar
              </p>

              <p className="text-xs text-slate-500">
                HR Manager
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;