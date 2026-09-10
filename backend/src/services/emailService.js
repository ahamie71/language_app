const nodemailer = require('nodemailer');
const { resetPasswordTemplate } = require('../emails/resetPasswordTemplate');
const { verifyEmailTemplate } = require('../emails/verifyEmailTemplate');

// Tant que SMTP_HOST n'est pas renseigné (compte Mailtrap pas encore créé/
// collé dans .env), on logge l'email au lieu d'échouer — permet de tester
// tout le flux avant même d'avoir un compte Mailtrap.
const smtpConfigured = !!process.env.SMTP_HOST;

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const sendMail = async ({ to, subject, html, logLink }) => {
  if (!smtpConfigured) {
    console.log('\n📧 [EMAIL — SMTP non configuré, repli console]');
    console.log(`   À      : ${to}`);
    console.log(`   Sujet  : ${subject}`);
    console.log(`   Lien   : ${logLink}\n`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'DuoLingua <no-reply@duolingua.app>',
    to,
    subject,
    html,
  });
};

exports.sendPasswordResetEmail = async (to, resetLink, username) => {
  await sendMail({
    to,
    subject: 'Réinitialise ton mot de passe DuoLingua',
    html: resetPasswordTemplate({ username, resetLink }),
    logLink: resetLink,
  });
};

exports.sendVerificationEmail = async (to, verifyLink, username) => {
  await sendMail({
    to,
    subject: 'Confirme ton adresse email — DuoLingua',
    html: verifyEmailTemplate({ username, verifyLink }),
    logLink: verifyLink,
  });
};
