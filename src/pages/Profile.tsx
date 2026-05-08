import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <div className="w-32 h-32 rounded-full bg-[#141414] text-white flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-xl">
          {user?.name.charAt(0)}
        </div>
        <h2 className="text-4xl font-serif italic">{user?.name}</h2>
        <p className="text-gray-500 font-mono text-sm uppercase tracking-[0.2em] mt-2">Verified Professional</p>
      </div>

      <div className="bg-white border border-gray-200 divide-y divide-gray-100 shadow-sm">
        <div className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Display Name</p>
            <p className="font-bold text-lg">{user?.name}</p>
          </div>
        </div>

        <div className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Email Connection</p>
            <p className="font-bold text-lg">{user?.email}</p>
          </div>
        </div>

        <div className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Account Security</p>
            <p className="font-bold text-lg text-green-600">JWT Protected Session</p>
          </div>
        </div>

        <div className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
            <p className="font-bold text-lg">May 2026</p>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] text-white p-8 border border-black shadow-[8px_8px_0px_0px_rgba(34,197,94,0.2)]">
        <h3 className="text-xl font-serif italic mb-4 text-green-400">Productivity Insight</h3>
        <p className="text-gray-400 text-sm leading-relaxed font-mono">
          "Consistency is the only currency that matters in a world of distraction. You have captured {user?.name.split(' ')[0]}'s flow successfully."
        </p>
      </div>
    </div>
  );
};

export default Profile;
