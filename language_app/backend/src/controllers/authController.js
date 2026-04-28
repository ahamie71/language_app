const jwt = require('jsonwebtoken');
const { User, UserStats } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, target_language, native_language, level } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { 
        [require('sequelize').Op.or]: [{ email }, { username }] 
      } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email déjà utilisé' : 'Nom d\'utilisateur déjà pris' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      target_language: target_language || 'en',
      native_language: native_language || 'fr',
      level: level || 'debutant'
    });

    // Create initial stats
    await UserStats.create({
      user_id: user.id,
      total_messages: 0,
      total_conversations: 0,
      total_words_learned: 0
    });

    res.status(201).json({
      message: 'Compte créé avec succès',
      user_id: user.id
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValid = await user.verifyPassword(password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user.id);

    res.json({
      access_token: token,
      token_type: 'bearer'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur de connexion' });
  }
};
