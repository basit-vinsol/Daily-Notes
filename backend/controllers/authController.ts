import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDB } from '../config/db.ts';
import { generateToken } from '../utils/generateToken.ts';

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
    const db = getDB();
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result]: any = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', 'active']
    );

    const userId = result.insertId;

    if (userId) {
      res.status(201).json({
        id: userId,
        name,
        email,
        role: 'user',
        status: 'active',
        token: generateToken(userId),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const db = getDB();
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  res.json(req.user);
};

// Admin: Create new user
export const createUser = async (req: any, res: Response) => {
  const { name, email, password } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
    const db = getDB();
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result]: any = await db.query(
      'INSERT INTO users (name, email, password, role, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', 'active', req.user.id]
    );

    const userId = result.insertId;
    const [newUser]: any = await db.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [userId]);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('user_created', newUser[0]);

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all users
export const getAllUsers = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const db = getDB();
    const [users]: any = await db.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete user
export const deleteUser = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  try {
    const db = getDB();
    const [result]: any = await db.query('DELETE FROM users WHERE id = ? AND role != ?', [id, 'admin']);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or cannot delete admin' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('user_deleted', { userId: id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Block/Unblock user
export const toggleUserStatus = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'blocked'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Use "active" or "blocked"' });
  }

  // Prevent admin from blocking themselves
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Cannot change your own status' });
  }

  try {
    const db = getDB();
    await db.query('UPDATE users SET status = ? WHERE id = ? AND role != ?', [status, id, 'admin']);
    
    const [updatedUser]: any = await db.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [id]);
    
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found or cannot modify admin' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('user_updated', updatedUser[0]);

    res.json(updatedUser[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all todos from all users
export const getAllTodos = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const db = getDB();
    const [todos]: any = await db.query(`
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             a.name as assigned_to_name
      FROM todos t 
      JOIN users u ON t.user_id = u.id 
      LEFT JOIN users a ON t.assigned_to = a.id
      ORDER BY t.created_at DESC
    `);
    res.json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all notes from all users
export const getAllNotes = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const db = getDB();
    const [notes]: any = await db.query(`
      SELECT n.*, u.name as user_name, u.email as user_email 
      FROM notes n 
      JOIN users u ON n.user_id = u.id 
      ORDER BY n.created_at DESC
    `);
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Assign task to user
export const assignTask = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { title, description, priority, due_date, assigned_to } = req.body;

  if (!title || !assigned_to) {
    return res.status(400).json({ message: 'Title and assigned_to are required' });
  }

  try {
    const db = getDB();
    
    // Check if assigned user exists
    const [user]: any = await db.query('SELECT id FROM users WHERE id = ?', [assigned_to]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [result]: any = await db.query(
      'INSERT INTO todos (user_id, assigned_to, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, assigned_to, title, description, priority || 'medium', due_date]
    );

    const [newTodo]: any = await db.query(`
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             a.name as assigned_to_name
      FROM todos t 
      JOIN users u ON t.user_id = u.id 
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `, [result.insertId]);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('todo_assigned', { todo: newTodo[0], assignedTo: assigned_to });

    res.status(201).json(newTodo[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get notifications for user
export const getNotifications = async (req: any, res: Response) => {
  try {
    const db = getDB();
    const [notifications]: any = await db.query(`
      SELECT n.*, t.title as task_title
      FROM notifications n
      LEFT JOIN todos t ON n.todo_id = t.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: any, res: Response) => {
  const { id } = req.params;
  
  try {
    const db = getDB();
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: any, res: Response) => {
  try {
    const db = getDB();
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
