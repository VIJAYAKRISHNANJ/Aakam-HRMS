import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { FormEvent } from "react";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  createNotification,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

import type {
  Notification,
} from "../services/notificationService";

function Notifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showCompose, setShowCompose] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [senderName, setSenderName] =
    useState("Anita Kumar");

  const [notificationMessage, setNotificationMessage] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<number | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const loadNotifications = useCallback(
    async (
      showRefreshLoader = false,
    ) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data =
          await getNotifications();

        setNotifications(data);
      } catch (err) {
        console.error(
          "Failed to load notifications:",
          err,
        );

        setError(
          "Unable to load notifications. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  /*
  |--------------------------------------------------------------------------
  | SEND NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const handleSendNotification = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedSender =
      senderName.trim();

    const trimmedMessage =
      notificationMessage.trim();

    if (!trimmedSender) {
      setError(
        "Please enter the sender name.",
      );
      return;
    }

    if (!trimmedMessage) {
      setError(
        "Please enter a notification message.",
      );
      return;
    }

    try {
      setSending(true);
      setError("");
      setMessage("");

      await createNotification({
        senderName: trimmedSender,
        recipientType: "ALL",
        message: trimmedMessage,
      });

      setNotificationMessage("");
      setShowCompose(false);

      setMessage(
        "Notification sent successfully.",
      );

      await loadNotifications();
    } catch (err) {
      console.error(
        "Failed to send notification:",
        err,
      );

      setError(
        "Failed to send notification. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | MARK ONE AS READ
  |--------------------------------------------------------------------------
  */

  const handleMarkAsRead = async (
    notificationId: number,
  ) => {
    try {
      setError("");

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
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err,
      );

      setError(
        "Failed to mark notification as read.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | MARK ALL AS READ
  |--------------------------------------------------------------------------
  */

  const handleMarkAllAsRead = async () => {
    const unreadExists =
      notifications.some(
        (notification) =>
          !notification.isRead,
      );

    if (!unreadExists) {
      return;
    }

    try {
      setError("");
      setMessage("");

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

      setMessage(
        "All notifications marked as read.",
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err,
      );

      setError(
        "Failed to mark all notifications as read.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    if (deleteTarget === null) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      await deleteNotification(
        deleteTarget,
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.filter(
            (notification) =>
              notification.id !==
              deleteTarget,
          ),
      );

      setDeleteTarget(null);

      setMessage(
        "Notification deleted successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to delete notification:",
        err,
      );

      setError(
        "Failed to delete notification. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead,
    ).length;

  const readCount =
    notifications.filter(
      (notification) =>
        notification.isRead,
    ).length;

  const selectedNotification =
    notifications.find(
      (notification) =>
        notification.id ===
        deleteTarget,
    );

  const formatDate = (
    dateString: string,
  ) => {
    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "Unknown date";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ================================================================
            PAGE HEADER
        ================================================================ */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md">
                <Bell size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Stay updated with important
                  organization announcements.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadNotifications(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setShowCompose(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-violet-700"
            >
              <Send size={16} />

              Send Notification
            </button>
          </div>
        </div>

        {/* ================================================================
            SUCCESS
        ================================================================ */}

        {message && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <Check size={17} />

              {message}
            </div>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              className="rounded p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================================================================
            ERROR
        ================================================================ */}

        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================================================================
            SUMMARY
        ================================================================ */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {notifications.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Bell size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Unread
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {unreadCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <MessageSquare size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Read
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {readCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            NOTIFICATION LIST
        ================================================================ */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                All Notifications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Organization-wide announcements
                and messages.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleMarkAllAsRead()
              }
              disabled={
                unreadCount === 0
              }
              className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <CheckCheck size={16} />

              Mark all as read
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Loading notifications...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Bell size={26} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No notifications yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                When announcements are sent,
                they will appear here.
              </p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setShowCompose(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Send size={16} />

                Send the first notification
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={`group p-5 transition ${
                      notification.isRead
                        ? "bg-white"
                        : "bg-blue-50/40"
                    }`}
                  >
                    <div className="flex gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                        <User size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">
                                {
                                  notification.senderName
                                }
                              </h3>

                              {!notification.isRead && (
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                  New
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>
                                {notification.recipientType ===
                                "ALL"
                                  ? "Everyone"
                                  : notification.recipientType}
                              </span>

                              <span>•</span>

                              <span>
                                {formatDate(
                                  notification.createdAt,
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">

                            {!notification.isRead && (
                              <button
                                type="button"
                                title="Mark as read"
                                onClick={() =>
                                  void handleMarkAsRead(
                                    notification.id,
                                  )
                                }
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                              >
                                <Check size={17} />
                              </button>
                            )}

                            <button
                              type="button"
                              title="Delete notification"
                              onClick={() =>
                                setDeleteTarget(
                                  notification.id,
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {notification.message}
                        </p>

                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleMarkAsRead(
                                notification.id,
                              )
                            }
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                          >
                            <Check size={14} />

                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          SEND MODAL
      ================================================================ */}

      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !sending
            ) {
              setShowCompose(false);
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Send Notification
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Send an announcement to everyone.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCompose(false)
                }
                disabled={sending}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                handleSendNotification
              }
            >
              <div className="space-y-5 px-6 py-6">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sender
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={senderName}
                      onChange={(event) =>
                        setSenderName(
                          event.target.value,
                        )
                      }
                      disabled={sending}
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter sender name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Send To
                  </label>

                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <Users
                      size={18}
                      className="text-blue-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Everyone
                      </p>

                      <p className="text-xs text-slate-500">
                        All employees and
                        organization users
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Message
                    </label>

                    <span className="text-xs text-slate-400">
                      {
                        notificationMessage.length
                      }{" "}
                      / 1000
                    </span>
                  </div>

                  <textarea
                    value={
                      notificationMessage
                    }
                    onChange={(event) =>
                      setNotificationMessage(
                        event.target.value,
                      )
                    }
                    disabled={sending}
                    maxLength={1000}
                    rows={5}
                    placeholder="Type your notification message..."
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowCompose(false)
                  }
                  disabled={sending}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !notificationMessage.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />

                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          DELETE CONFIRMATION
      ================================================================ */}

      {deleteTarget !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (!deleting) {
                setDeleteTarget(null);
              }
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2.5 text-red-600">
                  <Trash2 size={20} />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  Delete notification?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete
                  this notification? This action
                  cannot be undone.
                </p>

                {selectedNotification && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notification
                    </p>

                    <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-700">
                      {
                        selectedNotification.message
                      }
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />

                    Delete Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Notifications;