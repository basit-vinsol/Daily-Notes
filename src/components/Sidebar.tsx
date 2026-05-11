import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, FileText, User, LogOut, Activity, Menu, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { cn } from '../lib/utils.ts';
import { designSystem } from '../lib/design-system.ts';
import logo from '../assets/vintage_logo.jpeg';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Todo List', icon: CheckSquare, path: '/todos' },
    { name: 'Notes', icon: FileText, path: '/notes' },
    ...(user?.role === 'admin' ? [{ name: 'User', icon: Activity, path: '/admin' }] : []),
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-[#3b82f6] to-[#2863af] text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-72 bg-gradient-to-b from-[#1e40af] via-[#2863af] to-[#1e3a8a] text-white flex flex-col h-screen fixed left-0 top-0 border-r border-white/10 z-40 transition-transform duration-300 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative overflow-hidden rounded-xl shadow-2xl border-2 border-white/20 hover:scale-105 transition-transform">
              <img 
                src={logo} 
                alt="Vinsol Logo" 
                className="w-14 h-14 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/20 to-[#2863af]/20 rounded-xl flex items-center justify-center">
            
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black bg-gradient-to-r via-blue-500 to-purple-600 bg-clip-text text-transparent font-bold tracking-tight">
              
              </h1>
              <p className="text-sm text-blue-200 font-medium mt-1">Productivity Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-[#60a5fa] to-[#2863af] text-white shadow-lg scale-105" 
                    : "text-[#94a3b8] hover:text-white hover:bg-white/10"
                )
              }
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <item.icon size={20} />
                  </div>
                  <span className="font-semibold text-sm">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">{user?.name}</p>
              <p className="text-xs text-blue-200">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all group"
          >
            <LogOut size={20} />
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
