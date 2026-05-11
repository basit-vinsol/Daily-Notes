import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle, FileText, Clock, Trash2, Filter, CheckCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.tsx';
import API from '../api/axios.ts';

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  todo_id?: number;
  note_id?: number;
  task_title?: string;
}

const NotificationPopup: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Socket connection for real-time
  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:3000');
    socketRef.current = socket;
    socket.emit('join', user.id);

    socket.on('new_notification', (notification: Notification) => {
      console.log('📬 New notification:', notification);
      
      // Add to list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      setToast(notification);
      setTimeout(() => setToast(null), 5000);
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('DailyFlow', {
          body: notification.message,
          icon: '/vite.svg'
        });
      }
    });

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Click outside to close dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.close();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const fetchNotifications = async (type = 'all') => {
    try {
      const { data } = await API.get(`/auth/notifications/filtered?type=${type}&limit=50`);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await API.get('/auth/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await API.put(`/auth/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/auth/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await API.delete(`/auth/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await API.delete('/auth/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    fetchNotifications(newFilter);
  };

  const getIcon = (type: string) => {
    if (type.includes('task') || type.includes('todo')) return <CheckCircle size={16} className="text-blue-500" />;
    if (type.includes('note')) return <FileText size={16} className="text-purple-500" />;
    if (type.includes('assigned')) return <Bell size={16} className="text-green-500" />;
    return <Bell size={16} className="text-gray-500" />;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Toast Popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 min-w-[350px]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getIcon(toast.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">New Notification</p>
                <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                <p className="text-xs text-gray-400 mt-2">{getTimeAgo(toast.created_at)}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Bell */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Clear all
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filter tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {['all', 'task_assigned', 'todo_created', 'todo_status_changed', 'note_created'].map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFilterChange(f)}
                      className={`flex-1 text-xs px-2 py-1.5 rounded-md transition-all ${
                        filter === f
                          ? 'bg-white text-gray-900 shadow-sm font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          {notification.task_title && (
                            <p className="text-xs text-blue-600 mt-1">Task: {notification.task_title}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-start gap-1">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                          )}
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No notifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationPopup;