import express from 'express';
import { handleAIRequest, getConversationHistory, getAIAnalytics, getAISettings, updateAISettings, deleteConversation } from '../controllers/aiController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI requests require an authenticated user to enforce RBAC and tracking
router.use(isAuthenticated);

// Execute an AI tool (Symptom Checker, Chatbot, etc.)
router.post('/execute', handleAIRequest);

// Fetch conversation history scoped to the user
router.get('/history', getConversationHistory);

// Delete conversation history scoped to the user
router.delete('/history/:conversationId', deleteConversation);

// Admin routes for AI Analytics and Settings
router.get('/analytics', hasRole(['ADMIN']), getAIAnalytics);
router.get('/settings', hasRole(['ADMIN']), getAISettings);
router.post('/settings', hasRole(['ADMIN']), updateAISettings);

export default router;
