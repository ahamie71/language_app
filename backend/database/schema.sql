-- LinguaAI Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS linguaai;
USE linguaai;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    target_language VARCHAR(10) DEFAULT 'en',
    native_language VARCHAR(10) DEFAULT 'fr',
    level ENUM('debutant', 'intermediaire', 'avance') DEFAULT 'debutant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) DEFAULT 'Nouvelle conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    original_text TEXT,
    translated_text TEXT,
    explanation TEXT,
    audio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    total_messages INT DEFAULT 0,
    total_conversations INT DEFAULT 0,
    total_words_learned INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    streak_days INT DEFAULT 0,
    last_activity_date DATE DEFAULT NULL,
    xp_total INT DEFAULT 0,
    exercises_completed INT DEFAULT 0,
    dictation_completed INT DEFAULT 0,
    flashcards_reviewed INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    word VARCHAR(100) NOT NULL,
    translation VARCHAR(100) NOT NULL,
    language VARCHAR(5) NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    times_practiced INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    mastered BOOLEAN DEFAULT FALSE,
    last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_learned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    srs_interval INT DEFAULT 1,
    srs_ease_factor FLOAT DEFAULT 2.5,
    next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_word_lang (user_id, word, language),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_conversation_user ON conversations(user_id);
CREATE INDEX idx_message_conversation ON messages(conversation_id);
CREATE INDEX idx_stats_user ON user_stats(user_id);
CREATE INDEX idx_vocab_user ON vocabulary(user_id);
CREATE INDEX idx_vocab_review ON vocabulary(user_id, next_review_date);
