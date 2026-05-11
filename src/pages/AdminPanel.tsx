import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, CheckSquare, FileText, X, Trash2, Ban, CheckCircle, Calendar, Flag, Zap, Shield, Activity } from 'lucide-react';
import API from '../api/axios.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterDate, setFilterDate] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Sort users to show admins first
  const sortedUsers = [...users].sort((a: any, b: any) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return 0;
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
    
    // Real-time updates
    if (user) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);
      newSocket.emit('join', user.id);
      
      newSocket.on('user_created', () => fetchData());
      newSocket.on('user_updated', () => fetchData());
      newSocket.on('user_deleted', () => fetchData());
      newSocket.on('todo_created', () => fetchData());
      newSocket.on('todo_updated', () => fetchData());
      newSocket.on('todo_deleted', () => fetchData());
      newSocket.on('todo_assigned', () => fetchData());
      newSocket.on('note_created', () => fetchData());
      newSocket.on('note_updated', () => fetchData());
      newSocket.on('note_deleted', () => fetchData());
      
      return () => {
        newSocket.off('user_created');
        newSocket.off('user_updated');
        newSocket.off('user_deleted');
        newSocket.off('todo_created');
        newSocket.off('todo_updated');
        newSocket.off('todo_deleted');
        newSocket.off('todo_assigned');
        newSocket.off('note_created');
        newSocket.off('note_updated');
        newSocket.off('note_deleted');
        newSocket.close();
      };
    }
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [usersRes, todosRes, notesRes] = await Promise.all([
        API.get('/auth/admin/users'),
        API.get('/auth/admin/todos'),
        API.get('/auth/admin/notes')
      ]);
      setUsers(usersRes.data);
      setTodos(todosRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/auth/admin/users', newUser);
      setNewUser({ name: '', email: '', password: '' });
      setShowCreateUser(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? All their data will be removed.')) return;
    
    try {
      await API.delete(`/auth/admin/users/${userId}`);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleDeleteNote = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setDeletingId(noteId);
      console.log('Admin deleting note with id:', noteId);
      await API.delete(`/auth/admin/notes/${noteId}`);
      console.log('Note deleted successfully by admin');
      setNotes(prevNotes => prevNotes.filter((n: any) => n.id !== noteId));
      fetchData();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      if (error.response?.status === 404) {
        alert('Note not found. It may have been already deleted.');
      } else {
        alert(error.response?.data?.message || 'Error deleting note');
      }
      fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTodo = async (todoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setDeletingId(todoId);
      console.log('Admin deleting todo with id:', todoId);
      await API.delete(`/auth/admin/todos/${todoId}`);
      console.log('Todo deleted successfully by admin');
      setTodos(prevTodos => prevTodos.filter((t: any) => t.id !== todoId));
      fetchData();
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      if (error.response?.status === 404) {
        alert('Task not found. It may have been already deleted.');
      } else {
        alert(error.response?.data?.message || 'Error deleting task');
      }
      fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const action = newStatus === 'blocked' ? 'block' : 'unblock';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      await API.put(`/auth/admin/users/${userId}/status`, { status: newStatus });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating user status');
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/auth/admin/assign-task', newTask);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      setShowAssignTask(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error assigning task');
    }
  };

  // Filter functions
  const filteredTodos = todos.filter((t: any) => {
    const matchesUser = !selectedUser || t.user_id === selectedUser.id || t.assigned_to === selectedUser.id;
    
    let matchesDate = true;
    const taskDate = new Date(t.created_at);
    
    if (filterDate === 'today') {
      const today = new Date();
      matchesDate = today.toDateString() === taskDate.toDateString();
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = taskDate >= weekAgo;
    } else if (filterDate === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = taskDate >= monthAgo;
    } else if (filterDate === 'range' && dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = taskDate >= fromDate && taskDate <= toDate;
    } else if (filterDate === 'due_date' && t.due_date) {
      const dueDate = new Date(t.due_date);
      const today = new Date();
      matchesDate = dueDate <= today;
    }
    
    return matchesUser && matchesDate;
  });

  const filteredNotes = notes.filter((n: any) => {
    const matchesUser = !selectedUser || n.user_id === selectedUser.id;
    
    let matchesDate = true;
    const noteDate = new Date(n.created_at);
    
    if (filterDate === 'today') {
      const today = new Date();
      matchesDate = today.toDateString() === noteDate.toDateString();
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = noteDate >= weekAgo;
    } else if (filterDate === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = noteDate >= monthAgo;
    } else if (filterDate === 'range' && dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = noteDate >= fromDate && noteDate <= toDate;
    }
    
    return matchesUser && matchesDate;
  });

  const handleUserClick = (clickedUser: any) => {
    setSelectedUser(clickedUser);
    setActiveTab('todos');
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-white to-[#e0e7ff]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#60a5fa] to-[#2863af] rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#60a5fa] to-[#2863af] bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-gray-600 text-sm">
                  {selectedUser ? `Managing: ${selectedUser.name}` : 'System administration and user management'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {selectedUser && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setActiveTab('users');
                  }}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                >
                  ← Back to All Users
                </button>
              )}
              <button
                onClick={() => setShowAssignTask(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#2863af] text-white px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 transition-all shadow-lg"
              >
                <CheckSquare size={16} /> Assign Task
              </button>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#3b82f6] to-[#2863af] text-white px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 transition-all shadow-lg"
              >
                <Plus size={16} /> Create User
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">{users.length}</h3>
                <p className="text-xs text-green-600 mt-2">Active: {users.filter((u: any) => u.status === 'active').length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#60a5fa] to-[#2863af] rounded-xl flex items-center justify-center shadow-lg">
                <Users size={28} className="text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Total Tasks</p>
                <h3 className="text-3xl font-bold text-gray-900">{todos.length}</h3>
                <p className="text-xs text-blue-600 mt-2">Pending: {todos.filter((t: any) => t.status === 'pending').length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#10b981] to-[#2863af] rounded-xl flex items-center justify-center shadow-lg">
                <CheckSquare size={28} className="text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Total Notes</p>
                <h3 className="text-3xl font-bold text-gray-900">{notes.length}</h3>
                <p className="text-xs text-purple-600 mt-2">From all users</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#8b5cf6] to-[#2863af] rounded-xl flex items-center justify-center shadow-lg">
                <FileText size={28} className="text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('users');
              setSelectedUser(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'users' ? 'border-[#2863af] text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'todos' ? 'border-[#2863af] text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {selectedUser ? `${selectedUser.name}'s Tasks` : 'All Tasks'}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'notes' ? 'border-[#2863af] text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {selectedUser ? `${selectedUser.name}'s Notes` : 'All Notes'}
          </button>
        </div>

        {/* Filters */}
        {(activeTab === 'todos' || activeTab === 'notes') && (
          <div className="flex flex-wrap gap-4 bg-white p-4 border border-gray-200 rounded-lg items-end">
            {!selectedUser && (
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Filter by User</label>
                <select
                  onChange={(e) => {
                    const userId = parseInt(e.target.value);
                    const user = users.find((u: any) => u.id === userId);
                    setSelectedUser(user || null);
                  }}
                  value={selectedUser?.id || ''}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
                >
                  <option value="">All Users</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Filter by Date</label>
              <select
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  if (e.target.value !== 'range') {
                    setDateFrom('');
                    setDateTo('');
                  }
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="range">Date Range (From - To)</option>
                {activeTab === 'todos' && <option value="due_date">Overdue Tasks</option>}
              </select>
            </div>
            {filterDate === 'range' && (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-2">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-2">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
                  />
                </div>
              </>
            )}
            {(selectedUser || filterDate !== 'all') && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setFilterDate('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
            <div className="ml-auto text-sm text-gray-500">
              Showing {activeTab === 'todos' ? filteredTodos.length : filteredNotes.length} of {activeTab === 'todos' ? todos.length : notes.length}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white border border-[#2863af] p-4 md:p-6">
          {activeTab === 'users' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">All Users ({users.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-[#2863af]">
                      <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Name</th>
                      <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Email</th>
                      <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Role</th>
                      <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Status</th>
                      <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Joined</th>
                      <th className="text-right p-3 text-xs font-mono uppercase text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u: any) => (
                      <tr 
                        key={u.id} 
                        onClick={() => u.role !== 'admin' && handleUserClick(u)}
                        className={`border-b border-gray-100 ${u.role !== 'admin' ? 'hover:bg-blue-50 cursor-pointer' : 'bg-gray-50'} transition-colors`}
                      >
                        <td className="p-3">
                          <span className="font-semibold">{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded text-xs font-mono uppercase ${
                            u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded text-xs font-mono uppercase ${
                            u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {u.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.status)}
                                  className={`p-2 rounded-lg transition-all ${
                                    u.status === 'active' 
                                      ? 'text-gray-500 hover:text-red-500 hover:bg-red-50' 
                                      : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
                                  }`}
                                  title={u.status === 'active' ? 'Block User' : 'Unblock User'}
                                >
                                  {u.status === 'active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 italic mt-4">Click on any user to view their tasks and notes</p>
            </div>
          )}

          {activeTab === 'todos' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">
                {selectedUser ? `${selectedUser.name}'s Tasks` : 'All User Tasks'} ({filteredTodos.length})
              </h3>
              {filteredTodos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Task</th>
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Status</th>
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Priority</th>
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Created By</th>
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Assigned To</th>
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Due Date</th>
                        <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Created</th>
                        <th className="text-right p-3 text-xs font-mono uppercase text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTodos.map((t: any) => (
                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                          <td className="p-3">
                            <div>
                              <p className="font-semibold">{t.title}</p>
                              {t.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">{t.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-mono uppercase whitespace-nowrap ${
                              t.status === 'completed' ? 'bg-green-100 text-green-600' : 
                              t.status === 'in-progress' ? 'bg-yellow-100 text-yellow-600' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {t.status === 'in-progress' ? 'In Progress' : t.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-mono uppercase whitespace-nowrap ${
                              t.priority === 'high' ? 'bg-red-100 text-red-600' : 
                              t.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{t.user_name}</td>
                          <td className="p-3 text-sm">{t.assigned_to_name || '-'}</td>
                          <td className="p-3 text-sm text-gray-500">
                            {t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => handleDeleteTodo(t.id, e)}
                                disabled={deletingId === t.id}
                                className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                  deletingId === t.id 
                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title="Delete Task"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400 italic">No tasks found with current filters</p>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setFilterDate('all');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">
                {selectedUser ? `${selectedUser.name}'s Notes` : 'All User Notes'} ({filteredNotes.length})
              </h3>
              {filteredNotes.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotes.map((n: any) => (
                    <div key={n.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg relative group hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{n.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{n.content}</p>
                          <div className="flex gap-2 text-xs text-gray-400 flex-wrap">
                            <span>By: <strong>{n.user_name}</strong></span>
                            <span>• Created: {new Date(n.created_at).toLocaleDateString()}</span>
                            {n.updated_at && (
                              <span>• Updated: {new Date(n.updated_at).toLocaleDateString()}</span>
                            )}
                            <span>• {n.content.length} characters</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNote(n.id, e)}
                          disabled={deletingId === n.id}
                          className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ml-4 ${
                            deletingId === n.id 
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Delete Note"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400 italic">No notes found with current filters</p>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setFilterDate('all');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Create New User</h3>
                <button onClick={() => setShowCreateUser(false)} className="text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" required className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-[#141414] text-white py-2 rounded-lg font-bold hover:bg-black transition-all">
                  Create User
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Assign Task Modal */}
        {showAssignTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Assign Task to User</h3>
                <button onClick={() => setShowAssignTask(false)} className="text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select required className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newTask.assigned_to} onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}>
                    <option value="">Select User</option>
                    {users.filter((u: any) => u.role !== 'admin').map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title</label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black resize-none" rows={3} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-all">
                  Assign Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;