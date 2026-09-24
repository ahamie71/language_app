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

    const word = await Vocabulary.findOne({ where: { id, user_id: req.user.id } });
    if (!word) return res.status(404).json({ error: 'Mot non trouvé' });

    word.times_practiced += 1;
    if (correct) word.times_correct += 1;
    word.last_practiced = new Date();

    // SM-2 spaced repetition algorithm
    const q = correct ? 5 : 1;
    let ef = word.srs_ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3) ef = 1.3;
    word.srs_ease_factor = ef;

    if (!correct) {
      word.srs_interval = 1;
    } else if (word.times_practiced === 1) {
      word.srs_interval = 1;
    } else if (word.times_practiced === 2) {
      word.srs_interval = 6;
    } else {
      word.srs_interval = Math.round(word.srs_interval * ef);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + word.srs_interval);
    word.next_review_date = nextReview;

    const successRate = (word.times_correct / word.times_practiced) * 100;
    if (word.times_practiced >= 5 && successRate >= 80 && !word.mastered) {
      word.mastered = true;
    } else if (word.mastered && successRate < 80) {
      word.mastered = false; // un mot rate a nouveau n'est plus « maitrise »
    }

    await word.save();

    // Update flashcards_reviewed stat
    await UserStats.increment('flashcards_reviewed', { where: { user_id: req.user.id } });

    res.json(word);
  } catch (error) {
    console.error('Update word progress error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getDueForReview = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const now = new Date();

    const candidates = await Vocabulary.findAll({
      where: {
        user_id: req.user.id,
        next_review_date: { [Op.lte]: now },
        // Anciens mots sans vraie traduction (placeholder "…") : carte inutile.
        translation: { [Op.notIn]: ['…', '...', ''] }
      },
      order: [['next_review_date', 'ASC']],
      limit: 40
    });

    // Anciens noms propres enregistres avant le filtre d'extraction.
    const dueWords = candidates
      .filter(w => w.translation.trim().toLowerCase() !== w.word.trim().toLowerCase())
      .slice(0, 20);

    res.json(dueWords);
  } catch (error) {
    console.error('Get due words error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.exportVocabulary = async (req, res) => {
  try {
    const words = await Vocabulary.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    const csv = [
      'Mot,Traduction,Langue,Catégorie,Maîtrisé,Pratiqué,Correct',
      ...words.map(w =>
        `"${w.word}","${w.translation}","${w.language}","${w.category}","${w.mastered ? 'Oui' : 'Non'}","${w.times_practiced}","${w.times_correct}"`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="vocabulaire.csv"');
    res.send('﻿' + csv);
  } catch (error) {
    console.error('Export vocabulary error:', error);
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

// Langues qui ne mettent pas de majuscule aux noms communs, jours, mois ni
// langues : une traduction qui y commence par une majuscule est un nom propre.
// (Pas l'anglais — Monday, English — ni l'allemand, qui capitalise les noms.)
const LOWERCASE_LANGS = ['fr', 'es', 'it', 'pt'];

// NLLB renvoie un nom propre tel quel (« messi » -> « Messi ») ou juste
// capitalise (« leonel » -> « Leonel ») au lieu de le traduire.
function isProperNounTranslation(word, translation, translationLang) {
  const tr = translation.trim();
  if (tr.toLowerCase() === word.toLowerCase()) return true;
  return LOWERCASE_LANGS.includes(translationLang) && /^\p{Lu}/u.test(tr) && !/\s/.test(tr);
}
exports.isProperNounTranslation = isProperNounTranslation;

exports.extractWordsFromMessage = async (userId, messageText, language) => {
  try {
    // Get user info to know their target language
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    if (!user) return;

    // Mots avec majuscule en milieu de phrase = noms propres (Lionel, Paris…) :
    // on ne les apprend pas comme du vocabulaire.
    const properNouns = new Set(
      [...messageText.replace(/[’]/g, "'").matchAll(/(?<![.!?]\s*|^\s*)(?<=[\s"«(])(\p{Lu}[\p{L}-]*)/gu)]
        .map(m => m[1].toLowerCase())
    );

    // Simple word extraction - split by spaces and filter common words
    const words = messageText.toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/[^\p{L}\s'-]/gu, ' ') // Remove punctuation (keep accented letters: \w drops é, à…)
      .split(/\s+/)
      .map(word => word.replace(/^(?:qu|[cdjlmnst])'/, '').replace(/^[-']+|[-']+$/g, '')) // l'assiette -> assiette
      .filter(word => word.length > 2) // Filter short words
      .filter(word => !['les', 'des', 'une', 'dans', 'pour', 'avec', 'sur', 'par', 'mais', 'donc', 'puis', 'the', 'and', 'but', 'for', 'with', 'from', 'this', 'that', 'keep', 'your', 'english'].includes(word)); // Filter common words

    const uniqueWords = [...new Set(words)].filter(word => !properNouns.has(word));

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
        const translationLang = (language === user.native_language)
          ? user.target_language
          : user.native_language;

        let translation = null;
        try {
          const result = await require('../services/aiService').translate(word, language, translationLang);
          if (result && !result.includes('[') && !isProperNounTranslation(word, result, translationLang)) {
            translation = result.trim();
          }
        } catch (translationError) {
          console.error(`Translation error for "${word}":`, translationError.message);
        }

        // Without a real translation the word is useless (the vocab quiz used to
        // show "…" as answer options), so skip it instead of storing a placeholder.
        if (!translation) continue;

        await Vocabulary.create({
          user_id: userId,
          word,
          translation,
          language,
          category: 'From Conversation'
        });

        await UserStats.increment('total_words_learned', {
          where: { user_id: userId }
        });
      }
    }
  } catch (error) {
    console.error('Extract words error:', error);
    // Don't throw error to avoid breaking message processing
  }
};