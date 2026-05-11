import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, FileText, Search, Grid, List, Zap, Edit3, Calendar } from 'lucide-react';
import API from '../api/axios.ts';
import { cn } from '../lib/utils.ts';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.tsx';
import { designSystem } from '../lib/design-system.ts';

const Notes: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null); // Track which note is being deleted

  const fetchNotes = async () => {
    try {
      const { data } = await API.get('/notes');
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    
    // Connect socket
    if (user) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);
      newSocket.emit('join', user.id);
      
      // Listen for real-time updates
      newSocket.on('note_created', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchNotes();
        }
      });
      
      newSocket.on('note_updated', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchNotes();
        }
      });
      
      newSocket.on('note_deleted', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchNotes();
        }
      });
      
      return () => {
        newSocket.off('note_created');
        newSocket.off('note_updated');
        newSocket.off('note_deleted');
        newSocket.close();
      };
    }
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title) return;
    try {
      const { data } = await API.post('/notes', newNote);
      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent any default behavior
    
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setDeletingId(id); // Show loading state for this specific note
      console.log('Deleting note with id:', id);
      await API.delete(`/notes/${id}`);
      console.log('Note deleted successfully');
      setNotes(notes.filter((n: any) => n.id !== id));
    } catch (err: any) {
      console.error('Error deleting note:', err);
      // More detailed error handling
      if (err.response) {
        console.error('Server response:', err.response.data);
        console.error('Status code:', err.response.status);
        alert(`Error deleting note: ${err.response.data.message || 'Server error'}`);
      } else if (err.request) {
        alert('No response from server. Please check your connection.');
      } else {
        alert('Error deleting note. Please try again.');
      }
    } finally {
      setDeletingId(null); // Clear loading state
    }
  };

  const filteredNotes = notes.filter((n: any) => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#60a5fa] to-[#2863af] rounded-xl flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#60a5fa] to-[#2863af] bg-clip-text text-transparent">
                  Personal Notes
                </h1>
                <p className="text-gray-600 text-sm">Capture your thoughts and ideas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? "bg-white text-[#2863af] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? "bg-white text-[#2863af] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Add Note Form */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:sticky lg:top-24"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#2863af] rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">New Note</h3>
              </div>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <input
                  type="text"
                  placeholder="Note title..."
                  className="w-full font-semibold text-lg border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2863af] transition-colors placeholder:text-gray-400"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <textarea
                  placeholder="Write your thoughts..."
                  className="w-full text-sm border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#2863af] transition-colors placeholder:text-gray-400 resize-none min-h-[200px]"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2863af] text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
                >
                  <Plus size={18} /> Save Note
                </button>
              </form>
            </motion.div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search your notes..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white focus:border-2 focus:border-purple-500 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Notes Grid/List */}
              <div className={cn(
                "grid gap-6",
                view === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    filteredNotes.map((note: any, index) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-bl-2xl opacity-50" />
                        
                        <button
                          onClick={(e) => handleDelete(note.id, e)}
                          disabled={deletingId === note.id}
                          className={`absolute top-4 right-4 p-2 rounded-lg transition-all z-20 ${
                            deletingId === note.id 
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                          }`}
                          title="Delete note"
                        >
                          {deletingId === note.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                            />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">{note.title}</h3>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(note.created_at).toLocaleDateString()}
                                </span>
                                {note.user_name && (
                                  <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                    By: {note.user_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-gray-600 text-sm leading-relaxed line-clamp-6 whitespace-pre-wrap">
                            {note.content}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {note.content.length} characters
                              </span>
                              <FileText className="w-4 h-4 text-gray-300" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
                    >
                      <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No notes found</h3>
                      <p className="text-gray-400">Start by creating your first note or adjust your search</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;