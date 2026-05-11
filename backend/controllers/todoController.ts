import { Response } from 'express';
import { getDB } from '../config/db.ts';
import { createNotification } from '../utils/notificationHelper.ts';

export const getTodos = async (req: any, res: Response) => {
  try {
    const db = getDB();
    const [todos] = await db.query(`
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             a.name as assigned_to_name
      FROM todos t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.user_id = ? OR t.assigned_to = ?
      ORDER BY t.created_at DESC
    `, [req.user.id, req.user.id]);
    res.json(todos);
  } catch (error: any) {
    console.error('Error fetching todos:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTodo = async (req: any, res: Response) => {
  const { title, description, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const db = getDB();
    const [result]: any = await db.query(
      'INSERT INTO todos (user_id, title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || '', priority || 'medium', due_date || null, 'pending']
    );
    const [newTodo]: any = await db.query(`
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM todos t JOIN users u ON t.user_id = u.id WHERE t.id = ?
    `, [result.insertId]);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('todo_created', { todo: newTodo[0], userId: req.user.id });
      
      // NOTIFY ADMINS about new task
      const [admins]: any = await db.query('SELECT id FROM users WHERE role = ?', ['admin']);
      for (const admin of admins) {
        const notification = await createNotification(
          admin.id,
          'todo_created',
          `${req.user.name} created a task: "${title}"`,
          result.insertId
        );
        if (notification && io) {
          io.to(`user_${admin.id}`).emit('new_notification', notification);
          console.log('Notification sent to admin:', admin.id);
        }
      }
    }
    
    res.status(201).json(newTodo[0]);
  } catch (error: any) {
    console.error('Error creating todo:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTodo = async (req: any, res: Response) => {
  const { title, description, status, priority, due_date } = req.body;
  const { id } = req.params;

  try {
    const db = getDB();
    const [rows]: any = await db.query(
      'SELECT * FROM todos WHERE id = ? AND (user_id = ? OR assigned_to = ?)', 
      [id, req.user.id, req.user.id]
    );
    const todo = rows[0];
    if (!todo) return res.status(404).json({ message: 'Todo not found or unauthorized' });

    await db.query(
      'UPDATE todos SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ?',
      [
        title !== undefined ? title : todo.title,
        description !== undefined ? description : todo.description,
        status !== undefined ? status : todo.status,
        priority !== undefined ? priority : todo.priority,
        due_date !== undefined ? due_date : todo.due_date,
        id
      ]
    );

    const [updatedTodo]: any = await db.query(`
      SELECT t.*, 
             u.name as user_name, u.email as user_email,
             a.name as assigned_to_name
      FROM todos t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `, [id]);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('todo_updated', { todo: updatedTodo[0], userId: req.user.id });
      
      // NOTIFY if status changed
      if (status && status !== todo.status) {
        const [admins]: any = await db.query('SELECT id FROM users WHERE role = ?', ['admin']);
        for (const admin of admins) {
          const notification = await createNotification(
            admin.id,
            'todo_status_changed',
            `${req.user.name} changed task "${todo.title}" to ${status}`,
            id
          );
          if (notification && io) {
            io.to(`user_${admin.id}`).emit('new_notification', notification);
            console.log('Status notification sent to admin:', admin.id);
          }
        }
      }
    }
    
    res.json(updatedTodo[0]);
  } catch (error: any) {
    console.error('Error updating todo:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTodo = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const db = getDB();
    const [result]: any = await db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found' });
    
    const io = req.app.get('io');
    if (io) io.emit('todo_deleted', { todoId: parseInt(id), userId: req.user.id });
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting todo:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};