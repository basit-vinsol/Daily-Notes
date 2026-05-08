import { Response } from 'express';
import { getDB } from '../config/db.ts';

export const getNotes = async (req: any, res: Response) => {
  try {
    const db = getDB();
    const [notes] = await db.query(`
      SELECT n.*, u.name as user_name, u.email as user_email
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `, [req.user.id]);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNote = async (req: any, res: Response) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const db = getDB();
    const [result]: any = await db.query(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content]
    );
    const [newNote]: any = await db.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('note_created', { note: newNote[0], userId: req.user.id });
    
    res.status(201).json(newNote[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateNote = async (req: any, res: Response) => {
  const { title, content } = req.body;
  const { id } = req.params;

  try {
    const db = getDB();
    const [rows]: any = await db.query('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    const note = rows[0];

    if (!note) return res.status(404).json({ message: 'Note not found' });

    await db.query(
      'UPDATE notes SET title = ?, content = ? WHERE id = ?',
      [title || note.title, content || note.content, id]
    );

    const [updatedNote]: any = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('note_updated', { note: updatedNote[0], userId: req.user.id });
    
    res.json(updatedNote[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteNote = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const db = getDB();
    const [result]: any = await db.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found' });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('note_deleted', { noteId: id, userId: req.user.id });
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
