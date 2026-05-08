import express from 'express';
import { signup, login, getProfile, createUser, getAllUsers, getAllTodos, getAllNotes, deleteUser, toggleUserStatus, assignTask, getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/authController.ts';
import { protect } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', protect, getProfile);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

// Admin routes
router.post('/admin/users', protect, createUser);
router.get('/admin/users', protect, getAllUsers);
router.delete('/admin/users/:id', protect, deleteUser);
router.put('/admin/users/:id/status', protect, toggleUserStatus);
router.get('/admin/todos', protect, getAllTodos);
router.get('/admin/notes', protect, getAllNotes);
router.post('/admin/assign-task', protect, assignTask);

export default router;
