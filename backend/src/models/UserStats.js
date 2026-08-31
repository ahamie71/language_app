const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserStats = sequelize.define('UserStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false
  },
  total_messages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_conversations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_words_learned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  streak_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_activity_date: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  xp_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  exercises_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dictation_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  flashcards_reviewed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'user_stats',
  timestamps: false
});

module.exports = UserStats;
