const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  original_text: {
    type: DataTypes.TEXT
  },
  translated_text: {
    type: DataTypes.TEXT
  },
  explanation: {
    type: DataTypes.TEXT
  },
  audio_url: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Message;
