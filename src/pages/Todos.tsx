import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle, Circle, Filter, Search, Flag, Calendar, X, Zap, Clock, Target } from 'lucide-react';
import API from '../api/axios.ts';
import { cn } from '../lib/utils.ts';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.tsx';
import { designSystem } from '../lib/design-system.ts';

const Todos: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchTodos = async () => {
    try {
      const { data } = await API.get('/todos');
      setTodos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    
    // Connect socket
    if (user) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);
      newSocket.emit('join', user.id);
      
      // Listen for real-time updates
      newSocket.on('todo_created', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchTodos();
        }
      });
      
      newSocket.on('todo_updated', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchTodos();
        }
      });
      
      newSocket.on('todo_deleted', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchTodos();
        }
      });
      
      return () => {
        newSocket.off('todo_created');
        newSocket.off('todo_updated');
        newSocket.off('todo_deleted');
        newSocket.close();
      };
    }
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title) return;
    try {
      const { data } = await API.post('/todos', newTodo);
      setTodos([data, ...todos]);
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    // Cycle through statuses: pending -> in-progress -> completed -> pending
    let newStatus = 'pending';
    if (currentStatus === 'pending') newStatus = 'in-progress';
    else if (currentStatus === 'in-progress') newStatus = 'completed';
    else newStatus = 'pending';
    
    try {
      const { data } = await API.put(`/todos/${id}`, { status: newStatus });
      setTodos(todos.map((t: any) => (t.id === id ? data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      console.log('Deleting todo with id:', id);
      await API.delete(`/todos/${id}`);
      console.log('Todo deleted successfully');
      setTodos(todos.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      alert('Error deleting task. Please try again.');
    }
  };

  const filteredTodos = todos.filter((t: any) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 border-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#60a5fa] to-[#2863af] rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#60a5fa] to-[#2863af] bg-clip-text text-transparent">
                Task Management
              </h1>
              <p className="text-gray-600 text-sm">Organize and track your daily tasks</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Task Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#3b82f6] to-[#2863af] rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full text-lg font-semibold border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2863af] transition-colors placeholder:text-gray-400"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                />
                <textarea
                  placeholder="Add details (optional)"
                  className="w-full text-sm border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2863af] transition-colors placeholder:text-gray-400 resize-none min-h-[80px]"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                    <Flag size={16} className="text-gray-500" />
                    <select 
                      className="bg-transparent text-sm font-medium outline-none"
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                    <Calendar size={16} className="text-gray-500" />
                    <input 
                      type="date" 
                      className="bg-transparent text-sm font-medium outline-none"
                      value={newTodo.due_date}
                      onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:ml-auto bg-gradient-to-r from-[#3b82f6] to-[#2863af] text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Plus size={18} /> Add Task
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showFilters 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'in-progress', 'completed'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              filterStatus === s 
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Priority</p>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'low', 'medium', 'high'].map((p) => (
                          <button
                            key={p}
                            onClick={() => setFilterPriority(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              filterPriority === p 
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterPriority('all');
                      setSearch('');
                    }}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
                  >
                    <X size={16} /> Clear all filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tasks List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                />
              </div>
            ) : filteredTodos.length > 0 ? (
              filteredTodos.map((todo: any, index) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStatus(todo.id, todo.status)}
                      className="mt-1 flex-shrink-0 transition-all hover:scale-110"
                      title={`Status: ${todo.status}`}
                    >
                      {todo.status === 'completed' ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="text-white" size={16} />
                        </div>
                      ) : todo.status === 'in-progress' ? (
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Clock className="text-white" size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-blue-500 transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}>
                          {todo.title}
                        </h3>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                          todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {todo.priority}
                        </span>
                        
                        {todo.due_date && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                            <Calendar size={12} />
                            {new Date(todo.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {todo.description && (
                        <p className={`text-sm mb-3 ${
                          todo.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created {new Date(todo.created_at).toLocaleDateString()}</span>
                        {todo.assigned_to_name && (
                          <span className="text-blue-600">Assigned to: {todo.assigned_to_name}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
              >
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No tasks found</h3>
                <p className="text-gray-400">Start by creating your first task or adjust your filters</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Todos;
