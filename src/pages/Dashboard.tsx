import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckSquare, FileText, Clock, TrendingUp, Plus, Activity, Target, Calendar, BarChart3, Users, Zap } from 'lucide-react';
import API from '../api/axios.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Link } from 'react-router-dom';
import { designSystem } from '../lib/design-system.ts';
import { io, Socket } from 'socket.io-client';
import logo from '../assets/vintage_logo.jpeg';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    totalNotes: 0,
    todayTasks: 0,
    weeklyProgress: 0,
    productivity: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.emit('join', user?.id);

    newSocket.on('todo_created', (data) => {
      console.log('Todo created:', data);
      fetchData();
    });

    newSocket.on('todo_updated', (data) => {
      console.log('Todo updated:', data);
      fetchData();
    });

    newSocket.on('todo_deleted', (data) => {
      console.log('Todo deleted:', data);
      fetchData();
    });

    newSocket.on('notification', (data) => {
      console.log('Notification:', data);
      fetchData();
    });

    newSocket.on('note_created', (data) => {
      console.log('Note created:', data);
      fetchData();
    });

    newSocket.on('note_updated', (data) => {
      console.log('Note updated:', data);
      fetchData();
    });

    newSocket.on('note_deleted', (data) => {
      console.log('Note deleted:', data);
      fetchData();
    });

    return () => newSocket.close();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [tasksRes, notesRes] = await Promise.all([
        API.get('/todos'),
        API.get('/notes')
      ]);
      
      const tasks = tasksRes.data;
      const notes = notesRes.data;
      
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter((t: any) => t.created_at.split('T')[0] === today);
      const completedTasks = tasks.filter((t: any) => t.status === 'completed');
      const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
      const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress');
      
      const weeklyProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
      const productivity = todayTasks.length > 0 ? Math.round((completedTasks.filter(t => todayTasks.includes(t)).length / todayTasks.length) * 100) : 0;

      setStats({
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        totalNotes: notes.length,
        todayTasks: todayTasks.length,
        weeklyProgress,
        productivity
      });
      
      setRecentTasks(tasks.slice(0, 5));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Tasks', 
      value: stats.totalTasks, 
      icon: CheckSquare, 
      color: designSystem.colors.primary,
      gradient: designSystem.gradients.primary,
      change: '+12%',
      changeType: 'positive'
    },
    { 
      title: 'Completed', 
      value: stats.completedTasks, 
      icon: TrendingUp, 
      color: designSystem.colors.accent,
      gradient: designSystem.gradients.success,
      change: '+8%',
      changeType: 'positive'
    },
    { 
      title: 'In Progress', 
      value: stats.inProgressTasks, 
      icon: Clock, 
      color: designSystem.colors.secondary,
      gradient: designSystem.gradients.secondary,
      change: '+5%',
      changeType: 'positive'
    },
    { 
      title: 'Productivity', 
      value: `${stats.productivity}%`, 
      icon: Target, 
      color: designSystem.colors.info,
      gradient: designSystem.gradients.accent,
      change: '+15%',
      changeType: 'positive'
    },
  ];

  const quickActions = [
    { icon: Plus, label: 'New Task', color: 'bg-blue-600', to: '/todos' },
    { icon: FileText, label: 'New Note', color: 'bg-purple-600', to: '/notes' },
    { icon: Calendar, label: 'Schedule', color: 'bg-green-600', to: '/calendar' },
    { icon: BarChart3, label: 'Analytics', color: 'bg-orange-600', to: '/analytics' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-white/20 hover:scale-105 transition-transform">
                <img 
                  src={logo} 
                  alt="Vinsol Logo" 
                  className="w-12 h-12 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                 
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Vinsol Daily Task
                </h1>
                <p className="text-gray-600 text-sm">Welcome back, {user?.name?.split(' ')[0]}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.to}
                  className={`${action.color} text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2 shadow-lg`}
                >
                  <action.icon size={16} />
                  <span className="hidden sm:inline">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: card.gradient }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl`} style={{ background: card.gradient }}>
                      <card.icon size={24} className="text-white" />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      card.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                  <p className="text-sm text-gray-600">{card.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Activity Overview</h3>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{stats.totalTasks}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{stats.totalNotes}</p>
                <p className="text-sm text-gray-600">Total Notes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Productivity</h3>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">{stats.productivity}%</p>
              <p className="text-blue-100">Completion Rate</p>
              <div className="w-full bg-white/20 rounded-full h-3 mt-4">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${stats.productivity}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Tasks & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Tasks</h3>
              <Link to="/todos" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task: any, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' : 
                        task.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <h4 className={`font-semibold text-gray-900 ${
                          task.status === 'completed' ? 'line-through opacity-60' : ''
                        }`}>{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks yet. Start by creating your first task!</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Stay Focused</h3>
              <p className="text-blue-100 mb-6">Your productivity journey continues. Every task completed is a step towards your goals.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Today's Progress</span>
                  <span className="font-bold">{stats.weeklyProgress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${stats.weeklyProgress}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold">{stats.todayTasks}</p>
                    <p className="text-xs text-blue-100">Today's Tasks</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold">{stats.totalNotes}</p>
                    <p className="text-xs text-blue-100">Total Notes</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
