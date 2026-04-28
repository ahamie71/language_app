const { User, UserStats } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

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
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

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
      return res.status(400).json({ error: 'Le nom d’utilisateur ou l’email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await UserStats.findOne({ where: { user_id: req.user.id } });

    if (!stats) {
      return res.json({
        total_messages: 0,
        total_conversations: 0,
        total_words_learned: 0
      });
    }

    res.json({
      total_messages: stats.total_messages,
      total_conversations: stats.total_conversations,
      total_words_learned: stats.total_words_learned
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
