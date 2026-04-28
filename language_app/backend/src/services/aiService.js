const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

/**
 * Translate text from source language to target language
 * 3.3.2. Mise en place de la traduction
 */
exports.translate = async (text, sourceLang, targetLang) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/translate`, {
      text,
      source_lang: sourceLang,
      target_lang: targetLang
    });

    return response.data.translation;
  } catch (error) {
    console.error('Translation error:', error.message);
    throw new Error('Échec de la traduction');
  }
};

/**
 * Get text for speech synthesis
 * 3.3.3. Mise en place de la lecture de la traduction
 */
exports.getSpeechText = async (text, language) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/speak`, {
      text,
      language
    });

    return response.data;
  } catch (error) {
    console.error('Speech error:', error.message);
    throw new Error('Échec de la préparation audio');
  }
};

/**
 * Get AI explanation for grammar, context, and usage
 * 3.3.4. Mise en place des explications
 */
exports.getExplanation = async (text, language, level = 'debutant') => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/explain`, {
      text,
      language,
      level
    });

    return response.data.explanation;
  } catch (error) {
    console.error('Explanation error:', error.message);
    throw new Error('Échec de l\'explication');
  }
};

/**
 * Generate AI response in conversation context
 */
exports.generateResponse = async (userMessage, conversationHistory, targetLang) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/respond`, {
      user_message: userMessage,
      conversation_history: conversationHistory,
      target_language: targetLang
    });

    return response.data.response;
  } catch (error) {
    console.error('Response generation error:', error.message);
    throw new Error('Échec de la génération de réponse');
  }
};
