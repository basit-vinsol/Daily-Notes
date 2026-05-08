import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle, Circle, Filter, Search, Flag, Calendar, X } from 'lucide-react';
import API from '../api/axios.ts';
import { cn } from '../lib/utils.ts';
import { socket, connectSocket, disconnectSocket } from '../lib/socket.ts';
import { useAuth } from '../context/AuthContext.tsx';

const Todos: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
      connectSocket(user.id);
      
      // Listen for real-time updates
      socket.on('todo_created', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchTodos();
        }
      });
      
      socket.on('todo_updated', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchTodos();
        }
      });
      
      socket.on('todo_deleted', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchTodos();
        }
      });
    }
    
    return () => {
      socket.off('todo_created');
      socket.off('todo_updated');
      socket.off('todo_deleted');
    };
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
    try {
      await API.delete(`/todos/${id}`);
      setTodos(todos.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error(err);
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
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-1">Todo List</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Execute your strategy</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-[#141414] p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What needs to be done?"
            className="w-full text-base md:text-lg font-semibold border-none outline-none placeholder:text-gray-300"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
          />
          <textarea
            placeholder="Add details (optional)"
            className="w-full text-sm border-none outline-none resize-none placeholder:text-gray-300 min-h-[60px]"
            value={newTodo.description}
            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
          />
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-gray-400" />
              <select 
                className="text-xs font-mono uppercase bg-gray-50 border border-gray-200 outline-none p-1 rounded"
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input 
                type="date" 
                className="text-xs font-mono bg-gray-50 border border-gray-200 outline-none p-1 rounded"
                value={newTodo.due_date}
                onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
              />
            </div>

            <div className="w-full sm:w-auto sm:ml-auto">
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#141414] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                <Plus size={18} /> Add Task
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-black transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all",
              showFilters ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-black"
            )}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col md:flex-row md:flex-wrap gap-4 md:gap-6 shadow-sm">
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase text-gray-400">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'completed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={cn(
                          "px-3 py-1 rounded text-xs font-medium border transition-all",
                          filterStatus === s ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                        )}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase text-gray-400">Priority</p>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={cn(
                          "px-3 py-1 rounded text-xs font-medium border transition-all",
                          filterPriority === p ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                        )}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setSearch('');
                  }}
                  className="md:ml-auto text-xs font-mono text-gray-400 hover:text-black flex items-center gap-1 self-start md:self-end md:mb-1"
                >
                  <X size={12} /> Clear All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="text-center py-12 text-gray-400 italic text-sm">Synchronizing...</div>
          ) : filteredTodos.length > 0 ? (
            filteredTodos.map((todo: any) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white border border-gray-200 hover:border-black transition-all shadow-sm"
              >
                <button
                  onClick={() => toggleStatus(todo.id, todo.status)}
                  className="mt-1 flex-shrink-0 transition-colors"
                  title={`Status: ${todo.status}`}
                >
                  {todo.status === 'completed' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : todo.status === 'in-progress' ? (
                    <Circle className="text-yellow-500 fill-yellow-500" size={20} />
                  ) : (
                    <Circle className="text-gray-300 group-hover:text-black" size={20} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                    <h4 className={cn("font-bold text-base md:text-lg leading-tight", todo.status === 'completed' && "line-through text-gray-400")}>
                      {todo.title}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono uppercase border",
                      getPriorityColor(todo.priority)
                    )}>
                      {todo.priority}
                    </span>
                    {todo.due_date && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        <Calendar size={10} />
                        {new Date(todo.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {todo.assigned_to_name && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Assigned by: {todo.created_by_name}
                      </span>
                    )}
                  </div>
                  {todo.description && (
                    <p className={cn("text-sm text-gray-500 line-clamp-2", todo.status === 'completed' && "text-gray-300")}>
                      {todo.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 font-serif italic text-sm">No matching tasks found. Refine your query or start fresh.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Todos;
