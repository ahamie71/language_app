const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  target_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  native_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'fr'
  },
  level: {
    type: DataTypes.ENUM('debutant', 'intermediaire', 'avance'),
    defaultValue: 'debutant'
  },
  reset_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // TRUE par defaut : les comptes deja existants (crees avant cette
  // fonctionnalite) restent utilisables sans etre bloques au prochain
  // login. Seul `register` force explicitement `false` pour les
  // nouvelles inscriptions.
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  verify_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  verify_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
