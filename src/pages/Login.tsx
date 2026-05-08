import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock } from 'lucide-react';
import logo from '../assets/vintage_logo.jpeg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="DailyFlow Logo" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
          </div>
          <h2 className="text-3xl font-serif italic mb-2">Welcome Back</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">DailyFlow Task Manager</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 focus:border-black outline-none transition-colors"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 focus:border-black outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#141414] text-white py-3 font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2 group"
          >
            Access Dashboard
            <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 italic">
          Contact admin for account access
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
