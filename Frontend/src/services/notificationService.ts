import axios from "axios";

const API_URL = "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Notification
|--------------------------------------------------------------------------
*/

export interface Notification {
  id: number;
  senderName: string;
  recipientType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/*
|--------------------------------------------------------------------------
| Create Notification Payload
|--------------------------------------------------------------------------
*/

export interface NotificationPayload {
  senderName: string;
  recipientType?: string;
  message: string;
}

/*
|--------------------------------------------------------------------------
| API Responses
|--------------------------------------------------------------------------
*/

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  total: number;
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

/*
|--------------------------------------------------------------------------
| Get Notifications
|--------------------------------------------------------------------------
*/

export const getNotifications =
  async (): Promise<Notification[]> => {
    const response =
      await axios.get<NotificationsResponse>(
        `${API_URL}/notifications`,
      );

    return response.data.data;
  };

/*
|--------------------------------------------------------------------------
| Get Unread Notification Count
|--------------------------------------------------------------------------
*/

export const getUnreadNotificationCount =
  async (): Promise<number> => {
    const response =
      await axios.get<UnreadCountResponse>(
        `${API_URL}/notifications/unread-count`,
      );

    return response.data.data.count;
  };

/*
|--------------------------------------------------------------------------
| Get Notification By ID
|--------------------------------------------------------------------------
*/

export const getNotificationById =
  async (
    notificationId: number | string,
  ): Promise<Notification> => {
    const response =
      await axios.get<NotificationResponse>(
        `${API_URL}/notifications/${notificationId}`,
      );

    return response.data.data;
  };

/*
|--------------------------------------------------------------------------
| Create / Send Notification
|--------------------------------------------------------------------------
*/

export const createNotification =
  async (
    payload: NotificationPayload,
  ): Promise<Notification> => {
    const response =
      await axios.post<NotificationResponse>(
        `${API_URL}/notifications`,
        payload,
      );

    return response.data.data;
  };

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export const markNotificationAsRead =
  async (
    notificationId: number | string,
  ): Promise<Notification> => {
    const response =
      await axios.put<NotificationResponse>(
        `${API_URL}/notifications/${notificationId}/read`,
      );

    return response.data.data;
  };

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

export const markAllNotificationsAsRead =
  async (): Promise<number> => {
    const response =
      await axios.put<ReadAllResponse>(
        `${API_URL}/notifications/read-all`,
      );

    return response.data.data.updatedCount;
  };

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

export const deleteNotification =
  async (
    notificationId: number | string,
  ): Promise<void> => {
    await axios.delete(
      `${API_URL}/notifications/${notificationId}`,
    );
  };