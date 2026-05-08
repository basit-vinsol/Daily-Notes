import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, CheckSquare, FileText, X, Trash2, Ban, CheckCircle, Calendar, Flag } from 'lucide-react';
import API from '../api/axios.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { socket, connectSocket } from '../lib/socket.ts';

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

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
    
    // Real-time updates
    if (user) {
      connectSocket(user.id);
      
      socket.on('user_created', () => fetchData());
      socket.on('user_updated', () => fetchData());
      socket.on('user_deleted', () => fetchData());
      socket.on('todo_created', () => fetchData());
      socket.on('todo_updated', () => fetchData());
      socket.on('todo_deleted', () => fetchData());
      socket.on('todo_assigned', () => fetchData());
      socket.on('note_created', () => fetchData());
      socket.on('note_updated', () => fetchData());
      socket.on('note_deleted', () => fetchData());
    }
    
    return () => {
      socket.off('user_created');
      socket.off('user_updated');
      socket.off('user_deleted');
      socket.off('todo_created');
      socket.off('todo_updated');
      socket.off('todo_deleted');
      socket.off('todo_assigned');
      socket.off('note_created');
      socket.off('note_updated');
      socket.off('note_deleted');
    };
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
      alert(error.response?.data?.message || 'Error deleting user');
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
    if (filterDate === 'today') {
      const today = new Date();
      const taskDate = new Date(t.created_at);
      matchesDate = today.toDateString() === taskDate.toDateString();
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const taskDate = new Date(t.created_at);
      matchesDate = taskDate >= weekAgo;
    }
    
    return matchesUser && matchesDate;
  });

  const filteredNotes = notes.filter((n: any) => {
    const matchesUser = !selectedUser || n.user_id === selectedUser.id;
    
    let matchesDate = true;
    if (filterDate === 'today') {
      const today = new Date();
      const noteDate = new Date(n.created_at);
      matchesDate = today.toDateString() === noteDate.toDateString();
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const noteDate = new Date(n.created_at);
      matchesDate = noteDate >= weekAgo;
    }
    
    return matchesUser && matchesDate;
  });

  const handleUserClick = (clickedUser: any) => {
    setSelectedUser(clickedUser);
    setActiveTab('todos');
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-1">Users Management</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            {selectedUser ? `Viewing: ${selectedUser.name}` : 'Manage users and monitor activity'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedUser && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setActiveTab('users');
              }}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
            >
              ← Back to All Users
            </button>
          )}
          <button
            onClick={() => setShowAssignTask(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
          >
            <CheckSquare size={16} /> Assign Task
          </button>
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center gap-2 bg-[#141414] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-all"
          >
            <Plus size={16} /> Create User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 md:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-mono uppercase text-gray-500 mb-1">Total Users</p>
              <h3 className="text-2xl md:text-3xl font-bold">{users.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 text-white"><Users size={24} /></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 md:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-mono uppercase text-gray-500 mb-1">Total Tasks</p>
              <h3 className="text-2xl md:text-3xl font-bold">{todos.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-500 text-white"><CheckSquare size={24} /></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 md:p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-mono uppercase text-gray-500 mb-1">Total Notes</p>
              <h3 className="text-2xl md:text-3xl font-bold">{notes.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500 text-white"><FileText size={24} /></div>
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
            activeTab === 'users' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab('todos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'todos' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          {selectedUser ? `${selectedUser.name}'s Tasks` : 'All Tasks'}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'notes' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
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
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-500 mb-2">Filter by Date</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
          </div>
          {(selectedUser || filterDate !== 'all') && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setFilterDate('all');
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
      <div className="bg-white border border-gray-200 p-4 md:p-6">
        {activeTab === 'users' && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold mb-4">All Users ({users.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Name</th>
                    <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Email</th>
                    <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Role</th>
                    <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Status</th>
                    <th className="text-left p-3 text-xs font-mono uppercase text-gray-600">Joined</th>
                    <th className="text-right p-3 text-xs font-mono uppercase text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr 
                      key={u.id} 
                      onClick={() => u.role !== 'admin' && handleUserClick(u)}
                      className={`border-b border-gray-100 ${u.role !== 'admin' ? 'hover:bg-blue-50 cursor-pointer' : ''} transition-colors`}
                    >
                      <td className="p-3">
                        <span className="font-semibold">{u.name}</span>
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
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTodos.map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
            <h3 className="text-lg font-bold mb-4">All User Notes ({filteredNotes.length})</h3>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((n: any) => (
                <div key={n.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">{n.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{n.content}</p>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>By: <strong>{n.user_name}</strong></span>
                    <span>• {new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-400 italic">No notes found with current filters</p>
                <button
                  onClick={() => {
                    setFilterUser('all');
                    setFilterDate('all');
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
  );
};

export default AdminPanel;
