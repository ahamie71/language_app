const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vocabulary = sequelize.define('Vocabulary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  word: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  translation: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'General'
  },
  difficulty_level: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  times_practiced: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  times_correct: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mastered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_practiced: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  first_learned: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'vocabulary',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'word', 'language']
    }
  ]
});

module.exports = Vocabulary;