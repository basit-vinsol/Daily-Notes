import { Response } from 'express';
import { getDB } from '../config/db.ts';

export const getTodos = async (req: any, res: Response) => {
  try {
    const db = getDB();
    // Get user's own todos and todos assigned to them
    const [todos] = await db.query(`
      SELECT t.*, 
             u.name as created_by_name,
             a.name as assigned_to_name
      FROM todos t 
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.user_id = ? OR t.assigned_to = ?
      ORDER BY t.created_at DESC
    `, [req.user.id, req.user.id]);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTodo = async (req: any, res: Response) => {
  const { title, description, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  try {
    const db = getDB();
    const [result]: any = await db.query(
      'INSERT INTO todos (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, description, priority || 'medium', due_date]
    );
    const [newTodo]: any = await db.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('todo_created', { todo: newTodo[0], userId: req.user.id });
    
    res.status(201).json(newTodo[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTodo = async (req: any, res: Response) => {
  const { title, description, status, priority, due_date } = req.body;
  const { id } = req.params;

  try {
    const db = getDB();
    const [rows]: any = await db.query('SELECT * FROM todos WHERE id = ? AND (user_id = ? OR assigned_to = ?)', [id, req.user.id, req.user.id]);
    const todo = rows[0];

    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    const oldStatus = todo.status;
    const newStatus = status !== undefined ? status : todo.status;

    await db.query(
      'UPDATE todos SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ?',
      [
        title !== undefined ? title : todo.title,
        description !== undefined ? description : todo.description,
        newStatus,
        priority !== undefined ? priority : todo.priority,
        due_date !== undefined ? due_date : todo.due_date,
        id
      ]
    );

    const [updatedTodo]: any = await db.query('SELECT * FROM todos WHERE id = ?', [id]);
    
    // Create notification for admin if status changed
    if (oldStatus !== newStatus && todo.user_id !== req.user.id) {
      const statusText = newStatus === 'in-progress' ? 'is working on' : newStatus === 'completed' ? 'completed' : 'changed status of';
      const message = `${req.user.name} ${statusText} task: "${todo.title}"`;
      
      await db.query(
        'INSERT INTO notifications (user_id, todo_id, message, type) VALUES (?, ?, ?, ?)',
        [todo.user_id, id, message, 'task_update']
      );
      
      // Emit real-time notification
      const io = req.app.get('io');
      io.emit('notification', { 
        userId: todo.user_id, 
        message, 
        type: 'task_update',
        todoId: id,
        newStatus 
      });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('todo_updated', { todo: updatedTodo[0], userId: req.user.id });
    
    res.json(updatedTodo[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTodo = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const db = getDB();
    const [result]: any = await db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found' });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('todo_deleted', { todoId: id, userId: req.user.id });
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
