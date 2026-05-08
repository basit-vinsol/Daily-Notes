import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckSquare, FileText, Clock, TrendingUp, Plus } from 'lucide-react';
import API from '../api/axios.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalNotes: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, notesRes] = await Promise.all([
          API.get('/todos'),
          API.get('/notes')
        ]);
        
        const tasks = tasksRes.data;
        const notes = notesRes.data;
        
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
          pendingTasks: tasks.filter((t: any) => t.status === 'pending').length,
          totalNotes: notes.length
        });
        
        setRecentTasks(tasks.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>;

  const cards = [
    { title: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'bg-blue-500' },
    { title: 'Completed', value: stats.completedTasks, icon: TrendingUp, color: 'bg-green-500' },
    { title: 'Pending', value: stats.pendingTasks, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Total Notes', value: stats.totalNotes, icon: FileText, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-1">Morning, {user?.name.split(' ')[0]}</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Here is your daily flow summary</p>
        </div>
        <div className="flex gap-4">
          <Link to="/todos" className="flex items-center gap-2 bg-[#141414] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-all">
            <Plus size={16} /> New Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-mono uppercase text-gray-500 mb-1">{card.title}</p>
                <h3 className="text-2xl md:text-3xl font-bold">{card.value}</h3>
              </div>
              <div className={`p-2 md:p-3 rounded-xl ${card.color} text-white shadow-lg shadow-${card.color.split('-')[1]}-200 group-hover:scale-110 transition-transform`}>
                <card.icon size={20} className="md:w-6 md:h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-serif italic">Recent Tasks</h3>
            <Link to="/todos" className="text-xs md:text-sm font-bold border-b-2 border-black">View All</Link>
          </div>
          <div className="space-y-3 md:space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task: any) => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-300 transition-all gap-2">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <div className="min-w-0">
                      <h4 className={`font-semibold text-sm md:text-base ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{task.description || 'No description'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 bg-white px-2 py-1 border border-gray-200 rounded self-start sm:self-auto">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 md:py-12 text-gray-400 italic text-sm">No tasks found. Start by adding one!</p>
            )}
          </div>
        </div>

        <div className="bg-[#141414] text-white p-6 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-serif italic mb-2">Think It. Do It.</h3>
            <p className="text-gray-400 text-sm mb-6 md:mb-8 leading-relaxed">Your productivity is a reflection of your systems. Keep refining the flow.</p>
            
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-4 group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-700 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all text-sm">01</div>
                <p className="text-xs md:text-sm font-mono uppercase">Add Daily Tasks</p>
              </div>
              <div className="flex items-center gap-3 md:gap-4 group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-700 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all text-sm">02</div>
                <p className="text-xs md:text-sm font-mono uppercase">Quick Notes Capture</p>
              </div>
              <div className="flex items-center gap-3 md:gap-4 group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-700 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all text-sm">03</div>
                <p className="text-xs md:text-sm font-mono uppercase">Review Progress</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
