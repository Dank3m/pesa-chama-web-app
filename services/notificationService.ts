/**
 * Notification Service
 * Handles notification-related API calls
 */

import api from './api';

// ==================== TYPES ====================

export type NotificationType =
  | 'LOAN_APPLICATION'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'LOAN_DISBURSED'
  | 'LOAN_REPAYMENT'
  | 'LOAN_OVERDUE'
  | 'CONTRIBUTION_RECEIVED'
  | 'CONTRIBUTION_REMINDER'
  | 'CONTRIBUTION_DEFAULTED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REGISTRATION_PENDING'
  | 'TRANSACTION_RECEIVED'
  | 'DISBURSEMENT_PROCESSED'
  | 'SYSTEM_ALERT'
  | 'ANNOUNCEMENT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actorName?: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface NotificationCount {
  unreadCount: number;
}

// ==================== SERVICE ====================

class NotificationService {
  private basePath = '/notifications';

  /**
   * Get paginated notifications for current user
   */
  async getNotifications(page: number = 0, size: number = 20): Promise<NotificationPage> {
    const response = await api.get<NotificationPage>(`${this.basePath}?page=${page}&size=${size}`);
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<NotificationCount> {
    const response = await api.get<NotificationCount>(`${this.basePath}/unread-count`);
    return response.data;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`${this.basePath}/${notificationId}/read`, {});
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<{ count: number }> {
    const response = await api.post<{ count: number }>(`${this.basePath}/mark-read`, notificationIds);
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await api.post<{ count: number }>(`${this.basePath}/mark-all-read`, {});
    return response.data;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
