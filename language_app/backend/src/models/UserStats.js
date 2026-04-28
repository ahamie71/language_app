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
  }
}, {
  tableName: 'user_stats',
  timestamps: false
});

module.exports = UserStats;
