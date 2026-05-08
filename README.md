# DailyFlow - Vinsol

A modern productivity dashboard for managing your daily tasks and notes.

## Features

- ✅ Todo Management with priorities and due dates
- 📝 Personal Notes System
- 📊 Dashboard with analytics
- 🔐 User Authentication
- 📱 Fully Responsive Design
- 🗄️ MySQL Database

## Run Locally

**Prerequisites:** Node.js, MySQL

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure MySQL in `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=dailyflow
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Express.js, Node.js
- **Database:** MySQL
- **Build Tool:** Vite
