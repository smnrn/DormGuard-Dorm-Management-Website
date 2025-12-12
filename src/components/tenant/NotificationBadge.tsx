import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Notification {
  id: number;
  type: 'approval' | 'denial';
  visitorName: string;
  date: string;
  timestamp: string;
}

interface NotificationBadgeProps {
  tenantId: number;
}

export function NotificationBadge({ tenantId }: NotificationBadgeProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/visitors/tenant/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Get visitors from last 24 hours that were approved/denied
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentNotifications = data.data
          .filter((visitor: any) => {
            if (!visitor.approval_date) return false;
            const approvalDate = new Date(visitor.approval_date);
            return approvalDate >= oneDayAgo && 
                   (visitor.approval_status === 'Approved' || visitor.approval_status === 'Denied');
          })
          .map((visitor: any) => ({
            id: visitor.visitor_id,
            type: visitor.approval_status === 'Approved' ? 'approval' : 'denial',
            visitorName: visitor.full_name,
            date: visitor.expected_date,
            timestamp: visitor.approval_date
          }))
          .sort((a: Notification, b: Notification) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        setNotifications(recentNotifications);
        
        // Get unread count from localStorage
        const readNotifications = JSON.parse(localStorage.getItem(`read_notifications_${tenantId}`) || '[]');
        const unread = recentNotifications.filter(
          (n: Notification) => !readNotifications.includes(n.id)
        );
        setUnreadCount(unread.length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllAsRead = () => {
    const notificationIds = notifications.map(n => n.id);
    localStorage.setItem(`read_notifications_${tenantId}`, JSON.stringify(notificationIds));
    setUnreadCount(0);
  };

  const toggleDropdown = () => {
    if (!showDropdown && unreadCount > 0) {
      markAllAsRead();
    }
    setShowDropdown(!showDropdown);
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No recent notifications</p>
                    <p className="text-slate-400 text-xs mt-1">
                      You'll be notified when visitors are approved or denied
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === 'approval'
                                ? 'bg-green-100'
                                : 'bg-red-100'
                            }`}
                          >
                            {notification.type === 'approval' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900">
                              Visitor {notification.type === 'approval' ? 'Approved' : 'Denied'}
                            </p>
                            <p className="text-sm text-slate-600 truncate">
                              {notification.visitorName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <p className="text-xs text-slate-400">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500 text-center">
                    Email notifications sent to your registered email
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
