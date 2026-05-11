import express from 'express';
import { 
  signup, login, getProfile, createUser, getAllUsers, deleteUser, 
  toggleUserStatus, getAllTodos, getAllNotes, assignTask, 
  getNotifications, getUnreadNotificationCount, getFilteredNotifications,
  markNotificationRead, markAllNotificationsRead, 
  deleteNotification, clearAllNotifications,
  adminDeleteNote, adminDeleteTodo
} from '../controllers/authController.ts';
import { protect, admin } from '../middleware/authMiddleware.ts';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.get('/notifications/unread-count', protect, getUnreadNotificationCount);
router.get('/notifications/filtered', protect, getFilteredNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.delete('/notifications/:id', protect, deleteNotification);
router.delete('/notifications/clear-all', protect, clearAllNotifications);

// Admin routes
router.post('/admin/users', protect, admin, createUser);
router.get('/admin/users', protect, admin, getAllUsers);
router.delete('/admin/users/:id', protect, admin, deleteUser);
router.put('/admin/users/:id/status', protect, admin, toggleUserStatus);
router.get('/admin/todos', protect, admin, getAllTodos);
router.get('/admin/notes', protect, admin, getAllNotes);
router.post('/admin/assign-task', protect, admin, assignTask);
router.delete('/admin/notes/:id', protect, admin, adminDeleteNote);
router.delete('/admin/todos/:id', protect, admin, adminDeleteTodo);

export default router;