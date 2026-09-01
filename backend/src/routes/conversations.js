const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const conversationController = require('../controllers/conversationController');

router.get('/', authMiddleware, conversationController.listConversations);
router.post('/', authMiddleware, conversationController.createConversation);
router.get('/:conversationId/messages', authMiddleware, conversationController.getMessages);
router.post('/messages', authMiddleware, conversationController.createMessage);
router.post('/process', authMiddleware, conversationController.processUserMessage);
router.post('/process/stream', authMiddleware, conversationController.processUserMessageStream);

module.exports = router;
