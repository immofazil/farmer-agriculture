require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./database');

// Debug: Check if Gemini API key is loaded
console.log('🔑 Gemini API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'No');
console.log('🤖 Gemini AI Service will be used for responses');

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

// Root route to serve dashboard for authenticated users, login for others
app.get('/', (req, res) => {
  console.log('Root route accessed, serving dashboard');
  res.sendFile(__dirname + '/public/dashboard.html');
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

// Weather API endpoints
app.get('/weather/current/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const weatherService = require('./weatherService');
    const weather = await weatherService.getCurrentWeather(parseFloat(lat), parseFloat(lon));
    res.json(weather);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
  }
});

app.get('/weather/forecast/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const weatherService = require('./weatherService');
    const forecast = await weatherService.getForecast(parseFloat(lat), parseFloat(lon));
    res.json(forecast);
  } catch (error) {
    console.error('Forecast API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch forecast data' });
  }
});

app.get('/weather/alerts/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const weatherService = require('./weatherService');
    const alerts = await weatherService.getWeatherAlerts(parseFloat(lat), parseFloat(lon));
    res.json(alerts);
  } catch (error) {
    console.error('Weather alerts API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weather alerts' });
  }
});

// POST endpoint for farmer questions with AI integration
app.post('/ask', async (req, res) => {
  try {
    const { question, conversationHistory, userLocation, userProfile } = req.body;

    if (!question || question.trim() === '') {
      return res.json({ answer: 'Please ask me a specific question about farming, and I\'ll be happy to help!' });
    }

    // Use the AI service to generate intelligent responses with user profile context
    const aiService = require('./aiService');
    const answer = await aiService.generateResponse(question.trim(), conversationHistory, userLocation, userProfile);

    console.log(`Question: ${question}`);
    console.log(`User Profile included:`, userProfile ? 'Yes' : 'No');
    console.log(`Answer generated successfully`);

    res.json({ answer });
  } catch (err) {
    console.error('Error in /ask:', err);

    // Fallback to basic response if AI fails
    const aiService = require('./aiService');
    const fallbackAnswer = aiService.getFallbackResponse(req.body.question || '');

    res.json({
      answer: fallbackAnswer,
      note: 'This is a basic response due to technical issues. Full AI functionality will be restored shortly.'
    });
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