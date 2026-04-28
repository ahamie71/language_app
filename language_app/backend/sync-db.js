const { sequelize } = require('./src/config/database');
const { User, Conversation, Message, UserStats, Vocabulary } = require('./src/models');

const syncDatabase = async () => {
  try {
    console.log('Syncing database tables...');
    
    // This will create tables if they don't exist
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database tables are ready!');
    console.log('Tables created/updated: User, Conversation, Message, UserStats, Vocabulary');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    process.exit(1);
  }
};

syncDatabase();
