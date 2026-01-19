import React, { useEffect, useCallback } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../services/notificationService';

// Helper function to get notification icon and colors based on type
const getNotificationStyle = (type: string) => {
  if (type.includes('APPROVED') || type.includes('RECEIVED') || type === 'LOAN_DISBURSED' || type === 'MEMBER_JOINED') {
    return {
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      icon: <CheckCircle size={20} />
    };
  }
  if (type.includes('REJECTED') || type.includes('OVERDUE') || type.includes('DEFAULTED') || type === 'SYSTEM_ALERT') {
    return {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
      icon: <AlertCircle size={20} />
    };
  }
  return {
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-primary dark:text-blue-400',
    icon: <Info size={20} />
  };
};

// Format relative time
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
}> = ({ notification, onMarkRead }) => {
  const style = getNotificationStyle(notification.type);

  return (
    <div
      className={`p-4 rounded-xl border flex gap-4 transition-colors cursor-pointer hover:shadow-sm ${
        notification.isRead
          ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
          : 'bg-blue-50 dark:bg-gray-700 border-blue-100 dark:border-gray-600'
      }`}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bgColor} ${style.textColor}`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className={`font-semibold ${notification.isRead ? 'text-dark dark:text-gray-200' : 'text-primary'}`}>
            {notification.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-subtext dark:text-gray-400">
              {formatRelativeTime(notification.createdAt)}
            </span>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            )}
          </div>
        </div>
        <p className="text-subtext dark:text-gray-300 text-sm mt-1">{notification.message}</p>
        {notification.actorName && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">By {notification.actorName}</p>
        )}
      </div>
    </div>
  );
};

const Notifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount
  } = useNotifications();

  // Refresh on mount
  useEffect(() => {
    fetchNotifications(0);
    refreshUnreadCount();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchNotifications(0);
    refreshUnreadCount();
  }, [fetchNotifications, refreshUnreadCount]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-3xl shadow-sm min-h-[600px] transition-colors">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-dark dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-subtext hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary font-medium hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary mb-4" />
          <p className="text-subtext dark:text-gray-400">Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Bell size={32} />
          </div>
          <p className="text-subtext dark:text-gray-400 mb-2">No notifications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You'll see notifications here when there's activity on your account
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
