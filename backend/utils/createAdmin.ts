import bcrypt from 'bcryptjs';
import { getDB } from '../config/db.ts';

export async function createDefaultAdmin() {
  try {
    const db = getDB();
    
    // Check if admin exists
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', ['admin@dailyflow.com']);
    
    if (rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin@dailyflow.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Default admin created: admin@dailyflow.com / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}
