const { Conversation, Message, UserStats, User } = require('../models');
const aiService = require('../services/aiService');

exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { title = 'Nouvelle conversation' } = req.body;

    const conversation = await Conversation.create({
      user_id: req.user.id,
      title
    });

    // Update stats
    await UserStats.increment('total_conversations', {
      where: { user_id: req.user.id }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        user_id: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const messages = await Message.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { conversation_id, role, original_text, translated_text, explanation } = req.body;

    const conversation = await Conversation.findOne({
      where: {
        id: conversation_id,
        user_id: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const message = await Message.create({
      conversation_id,
      role,
      original_text,
      translated_text,
      explanation
    });

    // Update stats
    await UserStats.increment('total_messages', {
      where: { user_id: req.user.id }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.processUserMessage = async (req, res) => {
  try {
    const { conversation_id, original_text } = req.body;

    // Get conversation and user info
    const conversation = await Conversation.findOne({
      where: {
        id: conversation_id,
        user_id: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const user = await User.findByPk(req.user.id);

    // Save user message
    const userMessage = await Message.create({
      conversation_id,
      role: 'user',
      original_text
    });

    // Extract vocabulary from user message (async, don't wait)
    // User writes in their native language, so extract with native_language
    const { extractWordsFromMessage } = require('./vocabularyController');
    extractWordsFromMessage(req.user.id, original_text, user.native_language).catch(err => 
      console.error('Vocabulary extraction error:', err)
    );

    // Process with AI: translate, explain, and generate response
    const [translation, explanation, aiResponse] = await Promise.allSettled([
      aiService.translate(original_text, user.native_language, user.target_language),
      aiService.getExplanation(original_text, user.target_language, user.level),
      aiService.generateResponse(original_text, [], user.target_language)
    ]);

    // Extract results
    const translatedText = translation.status === 'fulfilled' ? translation.value : null;
    const explanationText = explanation.status === 'fulfilled' ? explanation.value : null;
    const responseText = aiResponse.status === 'fulfilled' ? aiResponse.value : null;

    // Extract vocabulary from AI response (async, don't wait)
    // AI responds in target language, so extract with target_language
    if (responseText) {
      extractWordsFromMessage(req.user.id, responseText, user.target_language).catch(err => 
        console.error('Vocabulary extraction error:', err)
      );
    }

    // Save AI response message
    const assistantMessage = await Message.create({
      conversation_id,
      role: 'assistant',
      original_text: responseText || 'Désolé, je ne peux pas répondre pour le moment.',
      translated_text: translatedText,
      explanation: explanationText
    });

    // Update stats
    await UserStats.increment('total_messages', {
      where: { user_id: req.user.id },
      by: 2 // user + assistant message
    });

    res.status(201).json({
      userMessage,
      assistantMessage: {
        id: assistantMessage.id,
        original_text: assistantMessage.original_text,
        translated_text: assistantMessage.translated_text,
        explanation: assistantMessage.explanation
      }
    });
  } catch (error) {
    console.error('Process message error:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du message' });
  }
};
