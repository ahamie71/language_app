const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');
const UserStats = require('./UserStats');
const Vocabulary = require('./Vocabulary');

// Define relationships
User.hasMany(Conversation, { foreignKey: 'user_id' });
Conversation.belongsTo(User, { foreignKey: 'user_id' });

Conversation.hasMany(Message, { foreignKey: 'conversation_id' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });

User.hasOne(UserStats, { foreignKey: 'user_id' });
UserStats.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Vocabulary, { foreignKey: 'user_id' });
Vocabulary.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Conversation,
  Message,
  UserStats,
  Vocabulary
};
