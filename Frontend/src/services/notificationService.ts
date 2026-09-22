import api from "./api";

/**
 * |--------------------------------------------------------------------------
 * | Notification
 * |--------------------------------------------------------------------------
 */

export interface Notification {
  id: number;
  senderName: string;
  recipientType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * |--------------------------------------------------------------------------
 * | Notification Payload
 * |--------------------------------------------------------------------------
 */

export interface NotificationPayload {
  senderName: string;
  recipientType?: string;
  message: string;
}

/**
 * |--------------------------------------------------------------------------
 * | API Responses
 * |--------------------------------------------------------------------------
 */

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  total?: number;
  message?: string;
}

interface NotificationResponse {
  success: boolean;
  data: Notification;
  message?: string;
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
  message?: string;
}

interface ReadAllResponse {
  success: boolean;
  message: string;
  data: {
    updatedCount: number;
  };
}

/**
 * |--------------------------------------------------------------------------
 * | GET NOTIFICATIONS
 * |--------------------------------------------------------------------------
 */

export const getNotifications =
  async (): Promise<Notification[]> => {
    const response =
      await api.get<NotificationsResponse>(
        "/notifications",
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to load notifications.",
      );
    }

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | GET UNREAD COUNT
 * |--------------------------------------------------------------------------
 */

export const getUnreadNotificationCount =
  async (): Promise<number> => {
    const response =
      await api.get<UnreadCountResponse>(
        "/notifications/unread-count",
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to load unread notification count.",
      );
    }

    return response.data.data.count;
  };

/**
 * |--------------------------------------------------------------------------
 * | GET NOTIFICATION BY ID
 * |--------------------------------------------------------------------------
 */

export const getNotificationById =
  async (
    notificationId: number | string,
  ): Promise<Notification> => {
    const response =
      await api.get<NotificationResponse>(
        `/notifications/${notificationId}`,
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to load notification.",
      );
    }

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | CREATE NOTIFICATION
 * |--------------------------------------------------------------------------
 */

export const createNotification =
  async (
    payload: NotificationPayload,
  ): Promise<Notification> => {
    const response =
      await api.post<NotificationResponse>(
        "/notifications",
        payload,
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to send notification.",
      );
    }

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | MARK AS READ
 * |--------------------------------------------------------------------------
 */

export const markNotificationAsRead =
  async (
    notificationId: number | string,
  ): Promise<Notification> => {
    const response =
      await api.put<NotificationResponse>(
        `/notifications/${notificationId}/read`,
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to mark notification as read.",
      );
    }

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | MARK ALL AS READ
 * |--------------------------------------------------------------------------
 */

export const markAllNotificationsAsRead =
  async (): Promise<number> => {
    const response =
      await api.put<ReadAllResponse>(
        "/notifications/read-all",
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to mark notifications as read.",
      );
    }

    return response.data.data.updatedCount;
  };

/**
 * |--------------------------------------------------------------------------
 * | DELETE NOTIFICATION
 * |--------------------------------------------------------------------------
 */

export const deleteNotification =
  async (
    notificationId: number | string,
  ): Promise<void> => {
    const response =
      await api.delete<{
        success: boolean;
        message?: string;
      }>(
        `/notifications/${notificationId}`,
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to delete notification.",
      );
    }
  };