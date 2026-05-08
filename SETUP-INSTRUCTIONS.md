# DailyFlow Dashboard - Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- MySQL Server (v5.7 or higher)

## MySQL Setup

### 1. Install MySQL
If you don't have MySQL installed, download and install it from:
- Windows: https://dev.mysql.com/downloads/installer/
- Or use XAMPP/WAMP which includes MySQL

### 2. Start MySQL Service
Make sure MySQL service is running:
- **XAMPP**: Start MySQL from XAMPP Control Panel
- **Windows Service**: Open Services and start "MySQL" service
- **Command**: `net start MySQL80` (or your MySQL version)

### 3. Create Database and User

Open MySQL command line or phpMyAdmin and run:

```sql
-- Login as root
mysql -u root -p

-- Create the database
CREATE DATABASE dailyflow;

-- Create a user (optional, or use root)
CREATE USER 'dailyflow_user'@'localhost' IDENTIFIED BY 'Malik123@';
GRANT ALL PRIVILEGES ON dailyflow.* TO 'dailyflow_user'@'localhost';
FLUSH PRIVILEGES;
```

Or simply run the provided SQL file:
```bash
mysql -u root -p < setup-database.sql
```

### 4. Configure Environment Variables

Update the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Malik123@
DB_NAME=dailyflow
```

**Note**: If you created a separate user, use those credentials instead.

## Application Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm run dev
```

The application will:
- Create the necessary tables automatically
- Start the backend server on port 3000
- Start the Vite dev server for the frontend

### 3. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## Troubleshooting

### MySQL Connection Error
If you see "Access denied for user 'root'@'localhost'":

1. **Check MySQL is running**:
   - Open Task Manager and look for "mysqld.exe"
   - Or check XAMPP/WAMP control panel

2. **Verify password**:
   - Try logging in via command line: `mysql -u root -p`
   - If password is wrong, reset it:
     ```sql
     ALTER USER 'root'@'localhost' IDENTIFIED BY 'Malik123@';
     ```

3. **Check .env file**:
   - Make sure DB_PASSWORD matches your MySQL root password
   - No quotes needed around the password

### Port Already in Use
If port 3000 is already in use, you can change it in `server.ts`:
```typescript
const PORT = 3001; // Change to any available port
```

## Features

✅ **MySQL Database** - All data stored in MySQL instead of SQLite
✅ **Responsive Design** - Works on mobile, tablet, and desktop
✅ **User Authentication** - Secure login and signup
✅ **Todo Management** - Create, update, delete todos with priorities
✅ **Notes System** - Personal notes with search functionality
✅ **Dashboard** - Overview of your tasks and notes

## Mobile Responsive Features

- **Hamburger Menu**: Sidebar collapses on mobile with a menu button
- **Adaptive Layouts**: Grid layouts adjust for different screen sizes
- **Touch-Friendly**: Larger touch targets on mobile devices
- **Optimized Forms**: Better form layouts for mobile input

## Project Structure

```
dailyflow-dashboard/
├── backend/
│   ├── config/
│   │   └── db.ts              # MySQL connection
│   ├── controllers/           # Business logic
│   ├── middleware/            # Auth middleware
│   ├── routes/                # API routes
│   └── utils/                 # Helper functions
├── src/
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── context/               # React context
│   └── api/                   # API client
├── .env                       # Environment variables
├── server.ts                  # Express server
└── setup-database.sql         # Database schema
```

## Support

For issues or questions, please check:
1. MySQL is running
2. Database credentials are correct in .env
3. Port 3000 is available
4. All dependencies are installed
