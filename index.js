const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./database');

app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Body:', req.body);
  }
  next();
});

// Root route to serve login page
app.get('/', (req, res) => {
  console.log('Root route accessed, serving login page');
  res.sendFile(__dirname + '/public/login.html');
});

// Authentication routes
app.post('/register', async (req, res) => {
  try {
    const result = await db.registerUser(req.body);
    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const result = await db.loginUser(req.body);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/forgot-password', async (req, res) => {
  try {
    const result = await db.forgotPassword(req.body.email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await db.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

// Chat history routes
app.post('/save-chat', async (req, res) => {
  try {
    const { userId, chatData } = req.body;
    const result = await db.saveChat(userId, chatData);
    res.json(result);
  } catch (error) {
    console.error('Save chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to save chat' });
  }
});

app.get('/chat-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await db.getChatHistory(userId);
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat history' });
  }
});

app.delete('/delete-chat/:userId/:chatId', async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const result = await db.deleteChat(userId, chatId);
    res.json(result);
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete chat' });
  }
});

// POST endpoint for farmer questions (protected by frontend auth)
app.post('/ask', (req, res) => {
  try {
    const { question } = req.body;
    // For now, respond with dummy text
    const answer = 'This is a dummy response. Your question was: ' + (question || 'No question provided.');
    console.log('Sending answer:', answer);
    res.json({ answer });
  } catch (err) {
    console.error('Error in /ask:', err);
    res.status(500).json({ answer: 'Sorry, something went wrong on the server.' });
  }
});

// Catch-all error handler for JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ answer: 'Sorry, an unexpected error occurred.' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});