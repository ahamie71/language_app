const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, UserStats } = require('../models');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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

    // Create user — email_verified:false explicitement : les comptes deja
    // existants restent verifies (defaultValue true sur le modele), seules
    // les nouvelles inscriptions doivent confirmer leur email.
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      username,
      email,
      password_hash: password,
      target_language: target_language || 'en',
      native_language: native_language || 'fr',
      level: level || 'debutant',
      email_verified: false,
      verify_token_hash: hashToken(verifyToken),
      verify_token_expires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS)
    });

    // Create initial stats
    await UserStats.create({
      user_id: user.id,
      total_messages: 0,
      total_conversations: 0,
      total_words_learned: 0
    });

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    await sendVerificationEmail(user.email, verifyLink, user.username).catch(err =>
      console.error('Verification email error:', err.message)
    );

    res.status(201).json({
      message: 'Compte créé ! Vérifiez votre email pour l\'activer.',
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

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Merci de confirmer votre email avant de vous connecter',
        code: 'EMAIL_NOT_VERIFIED'
      });
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

// Message générique volontairement identique que le compte existe ou non,
// pour ne pas laisser deviner quels emails sont inscrits.
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.';

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.reset_token_hash = hashToken(token);
      user.reset_token_expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      await sendPasswordResetEmail(user.email, resetLink, user.username);
    }

    res.json({ message: FORGOT_PASSWORD_GENERIC_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Même en cas d'erreur interne, on ne révèle rien côté client.
    res.json({ message: FORGOT_PASSWORD_GENERIC_MESSAGE });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    const user = await User.findOne({
      where: { reset_token_hash: hashToken(token) }
    });

    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    user.password_hash = password; // rehashé par le hook beforeUpdate
    user.reset_token_hash = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: { verify_token_hash: hashToken(token) }
    });

    if (!user || !user.verify_token_expires || user.verify_token_expires < new Date()) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    user.email_verified = true;
    user.verify_token_hash = null;
    user.verify_token_expires = null;
    await user.save();

    res.json({ message: 'Email confirmé avec succès' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation' });
  }
};

// Même logique anti-énumération que forgotPassword : réponse générique
// identique que le compte existe, soit déjà vérifié, ou n'existe pas.
const RESEND_VERIFICATION_GENERIC_MESSAGE =
  'Si un compte non confirmé existe avec cet email, un nouveau lien vient de lui être envoyé.';

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user && !user.email_verified) {
      const verifyToken = crypto.randomBytes(32).toString('hex');
      user.verify_token_hash = hashToken(verifyToken);
      user.verify_token_expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
      await user.save();

      const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
      await sendVerificationEmail(user.email, verifyLink, user.username);
    }

    res.json({ message: RESEND_VERIFICATION_GENERIC_MESSAGE });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.json({ message: RESEND_VERIFICATION_GENERIC_MESSAGE });
  }
};
