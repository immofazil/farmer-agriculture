import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 7860; // Hugging Face uses port 7860

// Debug: Check if Groq API key is loaded
console.log('🔑 Groq API Key loaded:', process.env.GROQ_API_KEY ? 'Yes (length: ' + process.env.GROQ_API_KEY.length + ')' : 'No');
console.log('🤖 Groq AI Service will be used for responses');

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

// Clean up duplicate chats for a user
app.post('/cleanup-chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.cleanupDuplicateChats(userId);
    res.json(result);
  } catch (error) {
    console.error('Cleanup chats error:', error);
    res.status(500).json({ success: false, message: 'Failed to cleanup chats' });
  }
});

// Weather API endpoints
app.get('/weather/current/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { default: weatherService } = await import('./weatherService.js');
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
    const { default: weatherService } = await import('./weatherService.js');
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
    const { default: weatherService } = await import('./weatherService.js');
    const alerts = await weatherService.getWeatherAlerts(parseFloat(lat), parseFloat(lon));
    res.json(alerts);
  } catch (error) {
    console.error('Weather alerts API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weather alerts' });
  }
});

// POST endpoint for farmer questions with Groq RAG integration
app.post('/ask', async (req, res) => {
  try {
    const { question, conversationHistory, userLocation, userProfile } = req.body;

    if (!question || question.trim() === '') {
      return res.json({ answer: 'Please ask me a specific question about farming, and I\'ll be happy to help!' });
    }

    // Use the Groq RAG service to generate intelligent responses
    const { default: groqRAGService } = await import('./groqRAGService.js');
    const answer = await groqRAGService.generateResponse(question.trim(), conversationHistory, userLocation, userProfile);

    console.log(`Question: ${question}`);
    console.log(`User Profile included:`, userProfile ? 'Yes' : 'No');
    console.log(`Answer generated successfully with RAG`);

    res.json({ answer });
  } catch (err) {
    console.error('Error in /ask:', err);

    // Fallback to basic response if RAG service fails
    const { default: groqRAGService } = await import('./groqRAGService.js');
    const fallbackAnswer = await groqRAGService.getFallbackResponse(req.body.question || '');

    res.json({
      answer: fallbackAnswer,
      note: 'This is a response from our knowledge base due to technical issues. Full AI functionality will be restored shortly.'
    });
  }
});

// Knowledge Management Endpoints
import knowledgeService from './knowledgeService.js';

// Get all knowledge entries
app.get('/knowledge', async (req, res) => {
  try {
    const knowledge = await knowledgeService.getAllKnowledge();
    res.json({ success: true, data: knowledge });
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch knowledge' });
  }
});

// Add new knowledge entry
app.post('/knowledge', async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const id = await knowledgeService.addKnowledge(title, content, category || 'general', tags || []);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error adding knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to add knowledge' });
  }
});

// Delete knowledge entry
app.delete('/knowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changes = await knowledgeService.deleteKnowledge(id);
    
    if (changes > 0) {
      res.json({ success: true, message: 'Knowledge deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Knowledge not found' });
    }
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to delete knowledge' });
  }
});

// Search knowledge
app.post('/knowledge/search', async (req, res) => {
  try {
    const { query, limit } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const results = await knowledgeService.searchSimilar(query, limit || 5);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to search knowledge' });
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
  // Close database connection if available
  if (typeof db !== 'undefined' && db && typeof db.close === 'function') {
    db.close();
  }
  process.exit(0);
});

// Initialize knowledge service and start server
async function startServer() {
  try {
    // Wait for database to be ready
    console.log('⏳ Waiting for database to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Initialize knowledge service
    const { default: knowledgeService } = await import('./knowledgeService.js');
    
    // Wait a moment for the service to initialize
    setTimeout(async () => {
      await knowledgeService.seedInitialKnowledge();
    }, 2000);

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🧠 RAG-powered farming advisor ready!`);
      console.log(`📚 Knowledge base initializing...`);
      console.log(`✅ Database is ready for connections`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();