import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'users.db');
    this.db = new sqlite3.Database(this.dbPath);
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

      // Note: Unique constraint is temporarily disabled to allow cleanup of existing duplicates
      // It will be re-enabled after cleanup
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
            console.error('Database error during registration:', err);
            reject(err);
            return;
          }
          
          if (row) {
            resolve({ success: false, message: 'Username or email already exists' });
            return;
          }
          
          try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            this.db.run(
              'INSERT INTO users (fullName, username, email, password) VALUES (?, ?, ?, ?)',
              [fullName, username, email, hashedPassword],
              function(err) {
                if (err) {
                  console.error('Error inserting user:', err);
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
          } catch (error) {
            console.error('Error hashing password:', error);
            reject(error);
          }
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
            console.error('Database error during login:', err);
            reject(err);
            return;
          }
          
          if (!row) {
            resolve({ success: false, message: 'Invalid credentials' });
            return;
          }
          
          try {
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
          } catch (error) {
            console.error('Error comparing password:', error);
            reject(error);
          }
        }
      );
    });
  }

  // Get user by ID
  async getUserById(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, fullName, username, email, createdAt FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve(null);
            return;
          }
          
          resolve(row);
        }
      );
    });
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    return new Promise((resolve, reject) => {
      const { fullName, email } = updateData;
      
      this.db.run(
        'UPDATE users SET fullName = ?, email = ? WHERE id = ?',
        [fullName, email, userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            resolve({ success: false, message: 'User not found' });
            return;
          }
          
          resolve({ success: true, message: 'Profile updated successfully' });
        }
      );
    });
  }

  // Change password
  async changePassword(userId, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        this.db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, userId],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            
            if (this.changes === 0) {
              resolve({ success: false, message: 'User not found' });
              return;
            }
            
            resolve({ success: true, message: 'Password changed successfully' });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Set reset token
  async setResetToken(email, token, expiry) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
        [token, expiry, email],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            resolve({ success: false, message: 'Email not found' });
            return;
          }
          
          resolve({ success: true, message: 'Reset token set successfully' });
        }
      );
    });
  }

  // Reset password with token
  async resetPasswordWithToken(token, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if token exists and is not expired
        const user = await new Promise((resolve, reject) => {
          this.db.get(
            'SELECT id FROM users WHERE resetToken = ? AND resetTokenExpiry > datetime("now")',
            [token],
            (err, row) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(row);
            }
          );
        });
        
        if (!user) {
          resolve({ success: false, message: 'Invalid or expired reset token' });
          return;
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear reset token
        this.db.run(
          'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
          [hashedPassword, user.id],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({ success: true, message: 'Password reset successfully' });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Save chat history
  async saveChatHistory(userId, chatId, title, messages) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO chat_history (userId, chatId, title, messages) VALUES (?, ?, ?, ?)',
        [userId, chatId, title, JSON.stringify(messages)],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({ success: true, message: 'Chat history saved successfully' });
        }
      );
    });
  }

  // Get chat history
  async getChatHistory(userId, chatId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM chat_history WHERE userId = ? AND chatId = ?',
        [userId, chatId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve(null);
            return;
          }
          
          try {
            row.messages = JSON.parse(row.messages);
          } catch (error) {
            row.messages = [];
          }
          
          resolve(row);
        }
      );
    });
  }

  // Get all chat histories for a user
  async getAllChatHistories(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM chat_history WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Parse messages for each chat
          rows.forEach(row => {
            try {
              row.messages = JSON.parse(row.messages);
            } catch (error) {
              row.messages = [];
            }
          });
          
          resolve(rows);
        }
      );
    });
  }

  // Delete chat history
  async deleteChatHistory(userId, chatId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM chat_history WHERE userId = ? AND chatId = ?',
        [userId, chatId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            resolve({ success: false, message: 'Chat history not found' });
            return;
          }
          
          resolve({ success: true, message: 'Chat history deleted successfully' });
        }
      );
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }

  // Forgot password - set reset token
  async forgotPassword(email) {
    return new Promise((resolve, reject) => {
      // Generate a simple reset token (in production, use crypto.randomBytes)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      
      this.db.run(
        'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
        [token, expiry, email],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            resolve({ success: false, message: 'Email not found' });
            return;
          }
          
          resolve({ success: true, message: 'Password reset email sent', token });
        }
      );
    });
  }

  // Reset password (alias for resetPasswordWithToken)
  async resetPassword(token, newPassword) {
    return this.resetPasswordWithToken(token, newPassword);
  }

  // Save chat (alias for saveChatHistory)
  async saveChat(userId, chatData) {
    const { chatId, title, messages } = chatData;
    return this.saveChatHistory(userId, chatId, title, messages);
  }

  // Get chat history (alias for getAllChatHistories)
  async getChatHistory(userId) {
    return this.getAllChatHistories(userId);
  }

  // Delete chat (alias for deleteChatHistory)
  async deleteChat(userId, chatId) {
    return this.deleteChatHistory(userId, chatId);
  }

  // Clean up duplicate chats for a user
  async cleanupDuplicateChats(userId) {
    return new Promise((resolve, reject) => {
      // First, get all chats for the user
      this.db.all(
        'SELECT * FROM chat_history WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Group by title and keep only the most recent one
          const chatGroups = {};
          rows.forEach(row => {
            const title = row.title.replace(/\.\.\.$/, '').trim();
            if (!chatGroups[title] || new Date(row.createdAt) > new Date(chatGroups[title].createdAt)) {
              chatGroups[title] = row;
            }
          });

          // Delete all chats for this user
          this.db.run(
            'DELETE FROM chat_history WHERE userId = ?',
            [userId],
            (err) => {
              if (err) {
                reject(err);
                return;
              }

              // Re-insert only the unique chats
              const uniqueChats = Object.values(chatGroups);
              let completed = 0;
              let hasError = false;

              if (uniqueChats.length === 0) {
                resolve({ success: true, message: 'No chats to clean up' });
                return;
              }

              uniqueChats.forEach(chat => {
                this.db.run(
                  'INSERT INTO chat_history (userId, chatId, title, messages, createdAt) VALUES (?, ?, ?, ?, ?)',
                  [userId, chat.chatId, chat.title, chat.messages, chat.createdAt],
                  function(err) {
                    if (err) {
                      hasError = true;
                      console.error('Error re-inserting chat:', err);
                    }
                    completed++;
                    
                    if (completed === uniqueChats.length) {
                      if (hasError) {
                        reject(new Error('Some chats could not be re-inserted'));
                      } else {
                        resolve({ 
                          success: true, 
                          message: `Cleaned up ${rows.length - uniqueChats.length} duplicate chats`,
                          remainingChats: uniqueChats.length
                        });
                      }
                    }
                  }
                );
              });
            }
          );
        }
      );
    });
  }
}

// Create a singleton instance
const databaseInstance = new Database();

export default databaseInstance; 