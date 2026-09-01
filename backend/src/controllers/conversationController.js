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

    // Generate the coach's reply in the target language first, since the
    // translation and explanation below both depend on its content.
    const aiResponse = await aiService.generateResponse(original_text, [], user.target_language)
      .catch(err => { console.error('Response generation error:', err.message); return null; });
    const responseText = aiResponse;

    // Translate the AI's reply into the user's native language ("Traduction IA"
    // helper text), and explain it — both describe the assistant's message,
    // not the user's own input.
    const [translation, explanation] = await Promise.allSettled([
      responseText ? aiService.translate(responseText, user.target_language, user.native_language) : Promise.resolve(null),
      responseText ? aiService.getExplanation(responseText, user.target_language, user.level) : Promise.resolve(null)
    ]);

    const translatedText = translation.status === 'fulfilled' ? translation.value : null;
    const explanationText = explanation.status === 'fulfilled' ? explanation.value : null;

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

// Même pipeline que processUserMessage, mais streamé en SSE : la réponse du
// coach part dès qu'elle est prête (1 appel bloquant) au lieu d'attendre
// aussi la traduction et l'explication (2 appels de plus) avant de répondre.
exports.processUserMessageStream = async (req, res) => {
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { conversation_id, original_text } = req.body;

    const conversation = await Conversation.findOne({
      where: { id: conversation_id, user_id: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const user = await User.findByPk(req.user.id);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const userMessage = await Message.create({
      conversation_id,
      role: 'user',
      original_text
    });
    sendEvent('user_message', userMessage);

    const { extractWordsFromMessage } = require('./vocabularyController');
    extractWordsFromMessage(req.user.id, original_text, user.native_language).catch(err =>
      console.error('Vocabulary extraction error:', err)
    );

    const responseText = await aiService.generateResponse(original_text, [], user.target_language)
      .catch(err => { console.error('Response generation error:', err.message); return null; });

    if (!responseText) {
      sendEvent('error', { error: 'Échec de la génération de réponse' });
      return res.end();
    }
    sendEvent('reply', { text: responseText });

    if (responseText) {
      extractWordsFromMessage(req.user.id, responseText, user.target_language).catch(err =>
        console.error('Vocabulary extraction error:', err)
      );
    }

    let translatedText = null;
    let explanationText = null;

    const translationPromise = aiService.translate(responseText, user.target_language, user.native_language)
      .then(text => { translatedText = text; sendEvent('translation', { text }); })
      .catch(err => console.error('Translation error:', err.message));

    const explanationPromise = aiService.getExplanation(responseText, user.target_language, user.level)
      .then(text => { explanationText = text; sendEvent('explanation', { text }); })
      .catch(err => console.error('Explanation error:', err.message));

    await Promise.allSettled([translationPromise, explanationPromise]);

    const assistantMessage = await Message.create({
      conversation_id,
      role: 'assistant',
      original_text: responseText,
      translated_text: translatedText,
      explanation: explanationText
    });

    await UserStats.increment('total_messages', {
      where: { user_id: req.user.id },
      by: 2
    });

    sendEvent('done', { id: assistantMessage.id });
    res.end();
  } catch (error) {
    console.error('Process message stream error:', error);
    try {
      sendEvent('error', { error: 'Erreur lors du traitement du message' });
      res.end();
    } catch {
      res.status(500).json({ error: 'Erreur lors du traitement du message' });
    }
  }
};
