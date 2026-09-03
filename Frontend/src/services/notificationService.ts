import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const API_URL = `${API_BASE_URL}/notifications`;

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
      await axios.get<NotificationsResponse>(
        API_URL,
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
      await axios.get<UnreadCountResponse>(
        `${API_URL}/unread-count`,
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
      await axios.get<NotificationResponse>(
        `${API_URL}/${notificationId}`,
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
      await axios.post<NotificationResponse>(
        API_URL,
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
      await axios.put<NotificationResponse>(
        `${API_URL}/${notificationId}/read`,
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
      await axios.put<ReadAllResponse>(
        `${API_URL}/read-all`,
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
      await axios.delete<{
        success: boolean;
        message?: string;
      }>(
        `${API_URL}/${notificationId}`,
      );

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Unable to delete notification.",
      );
    }
  };