import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, FileText, User, LogOut, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { cn } from '../lib/utils.ts';
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#141414] text-white rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-[#141414] text-white flex flex-col h-screen fixed left-0 top-0 border-r border-[#333] z-40 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="DailyFlow Logo" className="w-10 h-10 rounded-lg object-cover" />
          <h1 className="text-xl font-bold tracking-tighter italic font-serif">DailyFlow</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-[#222]"
                )
              }
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#333]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:text-white hover:bg-red-950/20 transition-all group"
          >
            <LogOut size={20} className="group-hover:text-red-400" />
            <span className="font-medium text-sm group-hover:text-red-400">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
