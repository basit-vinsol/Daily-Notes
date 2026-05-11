import { getDB } from '../config/db.ts';

export const createNotification = async (
  userId: number,
  type: string,
  message: string,
  todoId?: number,
  noteId?: number
) => {
  try {
    const db = getDB();
    const [result]: any = await db.query(
      'INSERT INTO notifications (user_id, type, message, todo_id, note_id) VALUES (?, ?, ?, ?, ?)',
      [userId, type, message, todoId || null, noteId || null]
    );
    
    const [notification]: any = await db.query(
      'SELECT * FROM notifications WHERE id = ?',
      [result.insertId]
    );
    
    console.log('Notification created:', notification[0]);
    return notification[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};