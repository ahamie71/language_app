const { Vocabulary, UserStats } = require('../models');

exports.getVocabulary = async (req, res) => {
  try {
    const { category, mastered, language } = req.query;

    let whereClause = { user_id: req.user.id };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (mastered !== undefined) {
      whereClause.mastered = mastered === 'true';
    }

    if (language && language !== 'all') {
      whereClause.language = language;
    }

    const vocabulary = await Vocabulary.findAll({
      where: whereClause,
      order: [['last_practiced', 'DESC']]
    });

    console.log('Vocabulary found:', vocabulary.length, 'words');
    res.json(vocabulary);
  } catch (error) {
    console.error('Get vocabulary error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

exports.addWord = async (req, res) => {
  try {
    const { word, translation, language, category = 'General' } = req.body;

    // Check if word already exists
    const existingWord = await Vocabulary.findOne({
      where: {
        user_id: req.user.id,
        word: word.toLowerCase(),
        language
      }
    });

    if (existingWord) {
      return res.status(400).json({ error: 'Ce mot existe déjà dans votre vocabulaire' });
    }

    const newWord = await Vocabulary.create({
      user_id: req.user.id,
      word: word.toLowerCase(),
      translation,
      language,
      category,
      difficulty_level: 'medium' // Default, can be adjusted based on word length/complexity
    });

    // Update stats
    await UserStats.increment('total_words_learned', {
      where: { user_id: req.user.id }
    });

    res.status(201).json(newWord);
  } catch (error) {
    console.error('Add word error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateWordProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { correct } = req.body;

    const word = await Vocabulary.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!word) {
      return res.status(404).json({ error: 'Mot non trouvé' });
    }

    // Update practice stats
    await word.increment('times_practiced');

    if (correct) {
      await word.increment('times_correct');
    }

    // Update last practiced
    word.last_practiced = new Date();
    await word.save();

    // Check if mastered (80% success rate and practiced at least 5 times)
    const successRate = (word.times_correct / word.times_practiced) * 100;
    if (word.times_practiced >= 5 && successRate >= 80 && !word.mastered) {
      word.mastered = true;
      await word.save();
    }

    res.json(word);
  } catch (error) {
    console.error('Update word progress error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteWord = async (req, res) => {
  try {
    const { id } = req.params;

    const word = await Vocabulary.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!word) {
      return res.status(404).json({ error: 'Mot non trouvé' });
    }

    await word.destroy();

    // Update stats
    await UserStats.decrement('total_words_learned', {
      where: { user_id: req.user.id }
    });

    res.json({ message: 'Mot supprimé avec succès' });
  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.extractWordsFromMessage = async (userId, messageText, language) => {
  try {
    // Get user info to know their target language
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    if (!user) return;

    // Simple word extraction - split by spaces and filter common words
    const words = messageText.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter short words
      .filter(word => !['les', 'des', 'une', 'dans', 'pour', 'avec', 'sur', 'par', 'mais', 'donc', 'puis', 'the', 'and', 'but', 'for', 'with', 'from', 'this', 'that', 'keep', 'your', 'english'].includes(word)); // Filter common words

    const uniqueWords = [...new Set(words)];

    for (const word of uniqueWords.slice(0, 3)) { // Limit to 3 words per message to avoid spam
      // Check if word already exists
      const existingWord = await Vocabulary.findOne({
        where: {
          user_id: userId,
          word,
          language
        }
      });

      if (!existingWord) {
        // Try to get translation
        try {
          // If word is in user's native language, translate to target language
          // If word is in target language, translate to native language
          const translationLang = (language === user.native_language) 
            ? user.target_language 
            : user.native_language;
            
          const translation = await require('../services/aiService').translate(word, language, translationLang);

          // Skip if translation is mock/bad
          if (!translation || translation.includes('[Mock') || translation === word) {
            console.log(`Skipping word "${word}" - no valid translation`);
            continue;
          }

          await Vocabulary.create({
            user_id: userId,
            word,
            translation: translation,
            language,
            category: 'From Conversation'
          });

          // Update stats
          await UserStats.increment('total_words_learned', {
            where: { user_id: userId }
          });
        } catch (translationError) {
          console.error(`Translation error for "${word}":`, translationError.message);
          // Skip word if translation fails
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Extract words error:', error);
    // Don't throw error to avoid breaking message processing
  }
};