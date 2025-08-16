import sqlite3 from 'sqlite3';
const { verbose } = sqlite3;
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'users.db');
    this.db = new verbose().Database(this.dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Create users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fullName TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          resetToken TEXT,
          resetTokenExpiry DATETIME
        )
      `);

      // Create chat_history table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          chatId TEXT NOT NULL,
          title TEXT NOT NULL,
          messages TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id)
        )
      `);
    });
  }

  // User registration
  async registerUser(userData) {
    return new Promise((resolve, reject) => {
      const { fullName, username, email, password } = userData;
      
      // Check if username or email already exists
      this.db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        async (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            resolve({ success: false, message: 'Username or email already exists' });
            return;
          }
          
          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Insert new user
          this.db.run(
            'INSERT INTO users (fullName, username, email, password) VALUES (?, ?, ?, ?)',
            [fullName, username, email, hashedPassword],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              resolve({ 
                success: true, 
                message: 'User registered successfully',
                userId: this.lastID 
              });
            }
          );
        }
      );
    });
  }

  // User login
  async loginUser(credentials) {
    return new Promise((resolve, reject) => {
      const { username, password } = credentials;
      
      this.db.get(
        'SELECT id, fullName, username, email, password FROM users WHERE username = ? OR email = ?',
        [username, username],
        async (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve({ success: false, message: 'Invalid credentials' });
            return;
          }
          
          // Check password
          const isValidPassword = await bcrypt.compare(password, row.password);
          
          if (!isValidPassword) {
            resolve({ success: false, message: 'Invalid credentials' });
            return;
          }
          
          resolve({
            success: true,
            message: 'Login successful',
            user: {
              id: row.id,
              fullName: row.fullName,
              username: row.username,
              email: row.email
            }
          });
        }
      );
    });
  }

  // Forgot password
  async forgotPassword(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve({ success: false, message: 'Email not found' });
            return;
          }
          
          // Generate reset token (in a real app, you'd send this via email)
          const resetToken = Math.random().toString(36).substring(2, 15);
          const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
          
          this.db.run(
            'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
            [resetToken, resetTokenExpiry.toISOString(), email],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              resolve({ 
                success: true, 
                message: 'Password reset link sent to your email',
                resetToken // In real app, this would be sent via email
              });
            }
          );
        }
      );
    });
  }

  // Reset password
  async resetPassword(token, newPassword) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM users WHERE resetToken = ? AND resetTokenExpiry > ?',
        [token, new Date().toISOString()],
        async (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve({ success: false, message: 'Invalid or expired reset token' });
            return;
          }
          
          // Hash new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
          // Update password and clear reset token
          this.db.run(
            'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
            [hashedPassword, row.id],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              resolve({ success: true, message: 'Password reset successfully' });
            }
          );
        }
      );
    });
  }

  // Save chat history
  async saveChat(userId, chatData) {
    return new Promise((resolve, reject) => {
      const { chatId, title, messages } = chatData;
      
      // First check if chat exists
      this.db.get(
        'SELECT id FROM chat_history WHERE userId = ? AND chatId = ?',
        [userId, chatId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            // Update existing chat
            this.db.run(
              'UPDATE chat_history SET title = ?, messages = ? WHERE userId = ? AND chatId = ?',
              [title, JSON.stringify(messages), userId, chatId],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
                resolve({ success: true, chatId: chatId });
              }
            );
          } else {
            // Insert new chat
            this.db.run(
              'INSERT INTO chat_history (userId, chatId, title, messages) VALUES (?, ?, ?, ?)',
              [userId, chatId, title, JSON.stringify(messages)],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
                resolve({ success: true, chatId: chatId });
              }
            );
          }
        }
      );
    });
  }

  // Get chat history for user
  async getChatHistory(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT chatId, title, messages, createdAt FROM chat_history WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const chats = rows.map(row => ({
            id: row.chatId,
            title: row.title,
            messages: JSON.parse(row.messages),
            createdAt: row.createdAt
          }));
          
          resolve(chats);
        }
      );
    });
  }

  // Delete chat for user
  async deleteChat(userId, chatId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM chat_history WHERE userId = ? AND chatId = ?',
        [userId, chatId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({ 
            success: true, 
            message: 'Chat deleted successfully',
            deletedRows: this.changes
          });
        }
      );
    });
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

export default new Database(); 