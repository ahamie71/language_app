const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
const testConnection = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.log(`⏳ DB not ready (${error.message}) - retry ${i + 1}/${retries}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }

  console.error('❌ Could not connect to DB after retries');
  process.exit(1);
};

module.exports = { sequelize, testConnection };
