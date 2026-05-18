const { User, UserStats, Vocabulary } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, native_language, target_language, level } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (native_language) user.native_language = native_language;
    if (target_language) user.target_language = target_language;
    if (level) user.level = level;

    await user.save();

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Le nom d\'utilisateur ou l\'email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Compute and persist streak based on today's date
async function computeStreak(stats) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const last  = stats.last_activity_date;              // DATEONLY string or null

  if (!last) {
    stats.streak_days = 1;
    stats.last_activity_date = today;
  } else if (last === today) {
    // already counted today — no change
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (last === yStr) {
      stats.streak_days = (stats.streak_days || 0) + 1;
    } else {
      stats.streak_days = 1;
    }
    stats.last_activity_date = today;
  }

  await stats.save();
}

exports.getStats = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ where: { user_id: req.user.id } });

    if (!stats) {
      stats = await UserStats.create({ user_id: req.user.id });
    }

    await computeStreak(stats);

    // Count mastered words for badge data
    const masteredCount = await Vocabulary.count({
      where: { user_id: req.user.id, mastered: true }
    });

    res.json({
      total_messages:      stats.total_messages,
      total_conversations: stats.total_conversations,
      total_words_learned: stats.total_words_learned,
      streak_days:         stats.streak_days,
      xp_total:            stats.xp_total || (stats.total_messages * 10),
      exercises_completed: stats.exercises_completed,
      dictation_completed: stats.dictation_completed,
      flashcards_reviewed: stats.flashcards_reviewed,
      mastered_words:      masteredCount,
      last_activity_date:  stats.last_activity_date,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.recordActivity = async (req, res) => {
  try {
    const { type, xp = 0 } = req.body;

    let stats = await UserStats.findOne({ where: { user_id: req.user.id } });
    if (!stats) stats = await UserStats.create({ user_id: req.user.id });

    if (type === 'exercise') stats.exercises_completed += 1;
    if (type === 'dictation') stats.dictation_completed += 1;

    stats.xp_total = (stats.xp_total || 0) + xp;
    await computeStreak(stats);

    res.json({ ok: true, streak_days: stats.streak_days });
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
