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
    }
  }
});

User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
