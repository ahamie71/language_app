const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const vocabularyController = require('../controllers/vocabularyController');

router.get('/', authMiddleware, vocabularyController.getVocabulary);
router.get('/due', authMiddleware, vocabularyController.getDueForReview);
router.get('/export', authMiddleware, vocabularyController.exportVocabulary);
router.post('/', authMiddleware, vocabularyController.addWord);
router.put('/:id/progress', authMiddleware, vocabularyController.updateWordProgress);
router.delete('/:id', authMiddleware, vocabularyController.deleteWord);

module.exports = router;