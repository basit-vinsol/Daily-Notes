import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, FileText, Search, Grid, List } from 'lucide-react';
import API from '../api/axios.ts';
import { cn } from '../lib/utils.ts';
import { socket, connectSocket } from '../lib/socket.ts';
import { useAuth } from '../context/AuthContext.tsx';

const Notes: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');

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
      connectSocket(user.id);
      
      // Listen for real-time updates
      socket.on('note_created', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchNotes();
        }
      });
      
      socket.on('note_updated', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchNotes();
        }
      });
      
      socket.on('note_deleted', (data) => {
        if (data.userId === user.id || user.role === 'admin') {
          fetchNotes();
        }
      });
    }
    
    return () => {
      socket.off('note_created');
      socket.off('note_updated');
      socket.off('note_deleted');
    };
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

  const handleDelete = async (id: number) => {
    try {
      await API.delete(`/notes/${id}`);
      setNotes(notes.filter((n: any) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter((n: any) => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-1">Personal Notes</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Capture the fleeting thoughts</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start">
          <button 
            onClick={() => setView('grid')}
            className={cn("p-1.5 rounded-md transition-all", view === 'grid' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black")}
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setView('list')}
            className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black")}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <form onSubmit={handleAdd} className="bg-white border border-[#141414] p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] lg:sticky lg:top-24">
            <h3 className="text-xs md:text-sm font-mono uppercase mb-4 pb-2 border-b border-gray-100">New Note</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                className="w-full font-bold border-none outline-none text-sm md:text-base"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <textarea
                placeholder="Write something..."
                className="w-full text-sm border-none outline-none resize-none min-h-[150px] md:min-h-[200px]"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              />
              <button
                type="submit"
                className="w-full bg-[#141414] text-white py-2 text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Save Note
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-3 space-y-4 md:space-y-6 order-1 lg:order-2">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-2.5 md:top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search in your notes..."
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black transition-all shadow-sm text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={cn(
            "grid gap-4 md:gap-6",
            view === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note: any) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-all group relative"
                >
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="absolute top-3 right-3 md:top-4 md:right-4 p-2 text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="mb-3 md:mb-4">
                    <h4 className="text-lg md:text-xl font-bold mb-2 pr-8">{note.title}</h4>
                    {note.user_name && (
                      <p className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                        By: {note.user_name}
                      </p>
                    )}
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-tighter">
                      {new Date(note.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {note.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredNotes.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 md:py-24 text-gray-300 italic border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="font-serif text-sm md:text-base">The archive is empty. Document your legacy.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
