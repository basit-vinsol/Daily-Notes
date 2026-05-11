import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Bell, Search, X, CheckCircle, AlertCircle, Info, Trash2, Filter, CheckCheck, Zap, FileText, Clock, Menu } from 'lucide-react';
import API from '../api/axios.ts';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [toasts, setToasts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      
      const socket = io('http://localhost:3000');
      socketRef.current = socket;
      socket.emit('join', user.id);
      
      socket.on('new_notification', (data: any) => {
        const newToast = { ...data, id: Date.now() };
        setToasts(prev => [newToast, ...prev]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 6000);
        
        fetchNotifications();
        fetchUnreadCount();
        
        if (Notification.permission === 'granted') {
          new Notification('DailyFlow', {
            body: data.message,
            icon: '/vite.svg'
          });
        }
      });

      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Close search on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_notification');
        socketRef.current.close();
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  // Quick Search Function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Search across multiple endpoints
      const [todosRes, notesRes] = await Promise.all([
        API.get('/todos'),
        API.get('/notes')
      ]);

      const todos = todosRes.data || [];
      const notes = notesRes.data || [];

      // Filter results
      const filteredTodos = todos.filter((t: any) => 
        t.title?.toLowerCase().includes(query.toLowerCase()) ||
        t.description?.toLowerCase().includes(query.toLowerCase())
      ).map((t: any) => ({ ...t, searchType: 'task' }));

      const filteredNotes = notes.filter((n: any) => 
        n.title?.toLowerCase().includes(query.toLowerCase()) ||
        n.content?.toLowerCase().includes(query.toLowerCase())
      ).map((n: any) => ({ ...n, searchType: 'note' }));

      setSearchResults([...filteredTodos.slice(0, 3), ...filteredNotes.slice(0, 3)]);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchResultClick = (result: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    if (result.searchType === 'task') {
      navigate('/todos');
    } else if (result.searchType === 'note') {
      navigate('/notes');
    }
  };

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
      setNotifications(prev => prev.map((n: any) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/auth/notifications/read-all');
      setNotifications(prev => prev.map((n: any) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await API.delete(`/auth/notifications/${id}`);
      setNotifications(prev => prev.filter((n: any) => n.id !== id));
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

  const getNotificationIcon = (type: string) => {
    if (type.includes('task') || type.includes('todo')) return <CheckCircle size={18} className="text-blue-500" />;
    if (type.includes('note')) return <FileText size={18} className="text-purple-500" />;
    if (type.includes('assigned')) return <Zap size={18} className="text-amber-500" />;
    return <Bell size={18} className="text-gray-500" />;
  };

  const getToastColor = (type: string) => {
    if (type.includes('task') || type.includes('todo')) return 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white';
    if (type.includes('note')) return 'border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white';
    if (type.includes('assigned')) return 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white';
    return 'border-l-4 border-l-gray-500 bg-gradient-to-r from-gray-50 to-white';
  };

  const getToastTitle = (type: string) => {
    if (type.includes('task') || type.includes('todo')) return 'Task Update';
    if (type.includes('note')) return 'New Note';
    if (type.includes('assigned')) return 'New Assignment';
    return 'Notification';
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[200] space-y-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {toasts.map((toast, index) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`relative overflow-hidden rounded-2xl shadow-2xl p-4 ${getToastColor(toast.type)}`}
            >
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
              />
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
                  {getNotificationIcon(toast.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {getToastTitle(toast.type)}
                    </p>
                    <button
                      onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-snug">{toast.message}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock size={12} className="text-gray-400" />
                    <p className="text-xs text-gray-400">{getTimeAgo(toast.created_at)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 md:px-8 sticky top-0 z-40">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
        >
          <Menu size={20} />
        </button>

        {/* Search Bar with Results */}
        <div className="flex-1 max-w-md lg:max-w-lg" ref={searchRef}>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks & notes..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                >
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.searchType}-${result.id}`}
                      onClick={() => handleSearchResultClick(result)}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        result.searchType === 'task' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {result.searchType === 'task' ? (
                          <CheckCircle size={16} className="text-blue-600" />
                        ) : (
                          <FileText size={16} className="text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.searchType === 'task' ? result.description : result.content}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        result.searchType === 'task' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {result.searchType}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 sm:gap-4 ml-3 sm:ml-4">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-white text-[10px] sm:text-xs flex items-center justify-center font-bold shadow-lg"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>
          </div>
          
          {/* User Info - Desktop */}
          <div className="hidden sm:flex items-center gap-3 pl-4 sm:pl-6 border-l border-gray-200">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
              {user?.name?.charAt(0)}
            </div>
          </div>
          
          {/* User Avatar - Mobile */}
          <div className="sm:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setShowNotifications(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-16 right-2 sm:top-20 sm:right-4 md:right-8 w-[calc(100vw-1rem)] sm:w-96 max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[80vh] sm:max-h-[600px] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                    <Bell size={18} />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="p-1.5 hover:bg-white/20 rounded-lg transition-all" title="Mark all read">
                        <CheckCheck size={16} />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="p-1.5 hover:bg-white/20 rounded-lg transition-all" title="Clear all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex gap-1 bg-white/20 rounded-lg p-1 overflow-x-auto scrollbar-hide">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'task_assigned', label: 'Assigned' },
                    { key: 'todo_created', label: 'Tasks' },
                    { key: 'todo_status_changed', label: 'Status' },
                    { key: 'note_created', label: 'Notes' }
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange(f.key);
                      }}
                      className={`flex-shrink-0 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
                        filter === f.key
                          ? 'bg-white text-gray-900 font-semibold shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif: any, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-all group relative flex items-start gap-2 sm:gap-3 ${
                        !notif.is_read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs sm:text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {notif.message}
                          </p>
                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {notif.task_title && (
                          <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5">📋 {notif.task_title}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={10} className="text-gray-400" />
                          <p className="text-[10px] sm:text-xs text-gray-400">{getTimeAgo(notif.created_at)}</p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 sm:p-12 text-center">
                    <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">No notifications yet</p>
                    <p className="text-gray-400 text-xs mt-1">We'll keep you updated</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;