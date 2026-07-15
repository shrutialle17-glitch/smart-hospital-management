import express from 'express';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow public or generic authenticated access to view departments
router.get('/', getDepartments);

// Admin only routes
router.post('/', isAuthenticated, hasRole(['ADMIN']), createDepartment);
router.put('/:id', isAuthenticated, hasRole(['ADMIN']), updateDepartment);
router.delete('/:id', isAuthenticated, hasRole(['ADMIN']), deleteDepartment);

export default router;
