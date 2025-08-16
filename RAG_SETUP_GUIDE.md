# 🧠 RAG-Powered Farming Advisor Setup Guide

This guide will help you set up the RAG (Retrieval-Augmented Generation) system with Groq API for your farming advisor application.

## 🚀 What's New

Your farming advisor now uses:
- **Groq API** for ultra-fast AI responses (much faster than Gemini)
- **RAG System** that retrieves relevant farming knowledge before generating responses
- **Vector Embeddings** for semantic search of farming knowledge
- **Knowledge Management** interface to add/manage farming expertise
- **Personalized Responses** based on user profile and farm information

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Groq API Key** (free tier available)
3. **OpenWeatherMap API Key** (for weather data)

## 🔧 Setup Instructions

### 1. Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Update Environment Variables

Update your `.env` file:

```env
# Groq API Configuration
GROQ_API_KEY=your-actual-groq-api-key-here

# Weather API Configuration
WEATHER_API_KEY=your-weather-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Install Dependencies

The required packages are already installed:
- `groq-sdk` - Groq API client
- `@xenova/transformers` - For generating embeddings
- `sqlite3` - Knowledge base storage

### 4. Start the Server

```bash
node index.js
```

You should see:
```
🚀 Server running on port 3000
🧠 RAG-powered farming advisor ready!
📚 Knowledge base initializing...
🧠 Loading embedding model...
✅ Embedding model loaded successfully
✅ Knowledge database initialized
🌱 Seeding initial farming knowledge...
✅ Initial knowledge base seeded successfully
```

## 🎯 How the RAG System Works

### 1. **Knowledge Storage**
- Farming knowledge is stored in SQLite database
- Each entry has title, content, category, tags, and vector embedding
- Embeddings enable semantic search (meaning-based, not just keyword)

### 2. **Query Process**
1. User asks a farming question
2. System generates embedding for the question
3. Searches knowledge base for similar content using cosine similarity
4. Retrieves top 3 most relevant knowledge entries
5. Sends question + retrieved knowledge + user profile to Groq API
6. Groq generates personalized response using all context

### 3. **Response Enhancement**
- Responses are based on actual farming knowledge in the database
- User's farm profile (crops, soil type, size, budget) personalizes advice
- Current weather conditions influence recommendations
- Conversation history provides context

## 📚 Knowledge Management

### Adding Knowledge via Dashboard

1. Go to Dashboard → Knowledge Base section
2. Click "➕ Add Knowledge"
3. Fill in:
   - **Title**: Clear, descriptive title
   - **Category**: crops, soil, irrigation, pest_control, etc.
   - **Tags**: Comma-separated keywords
   - **Content**: Detailed farming information

### Knowledge Categories

- **crops**: Crop-specific growing information
- **soil**: Soil management and fertility
- **irrigation**: Water management techniques
- **pest_control**: Pest and disease management
- **organic**: Organic farming practices
- **weather**: Weather-related farming advice
- **sustainable**: Sustainable farming practices
- **general**: General farming knowledge

### API Endpoints

- `GET /knowledge` - Get all knowledge entries
- `POST /knowledge` - Add new knowledge entry
- `DELETE /knowledge/:id` - Delete knowledge entry
- `POST /knowledge/search` - Search knowledge base

## 🧪 Testing the System

### 1. Basic Functionality Test

1. Start the server
2. Go to `http://localhost:3000/dashboard.html`
3. Fill in your profile and farm information in Settings
4. Go to chat interface
5. Ask: "What crops should I plant this season?"

### 2. Knowledge Base Test

1. Go to Dashboard → Knowledge Base
2. Add a new knowledge entry about your specific crop
3. Ask the chatbot about that crop
4. The response should include information from your added knowledge

### 3. Personalization Test

1. Set your farm size to 5 acres in Settings
2. Set primary crops to "Wheat, Rice"
3. Set soil type to "Loamy"
4. Ask: "Give me advice for my farm"
5. Response should mention your specific farm characteristics

## 🔍 Monitoring and Debugging

### Server Logs

Watch for these log messages:
- `🔍 Searching knowledge base...` - RAG retrieval working
- `📡 Calling Groq API...` - API call initiated
- `✅ Groq API response received` - Successful response
- `User Profile included: Yes` - Personalization active

### Common Issues

1. **"API Key Issue"** - Check your Groq API key in .env
2. **"Rate Limit Notice"** - Wait a moment, Groq has generous limits
3. **Slow first response** - Embedding model loads on first use
4. **No personalization** - Ensure profile/farm info is saved in Settings

## 🌟 Benefits of RAG System

### Accuracy
- Responses based on curated farming knowledge
- Reduces AI hallucinations
- Consistent, reliable information

### Speed
- Groq API is extremely fast (often sub-second responses)
- Local knowledge base for instant retrieval
- Efficient embedding search

### Personalization
- Considers user's specific farm characteristics
- Weather-aware recommendations
- Budget-conscious advice

### Scalability
- Easy to add new farming knowledge
- Knowledge base grows with use
- Community-driven knowledge expansion

## 📈 Next Steps

1. **Add More Knowledge**: Continuously add farming expertise to improve responses
2. **User Feedback**: Collect feedback on response quality
3. **Knowledge Curation**: Review and update knowledge entries regularly
4. **Advanced Features**: Consider adding image analysis, crop disease detection, etc.

## 🆘 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify API keys are correctly set
3. Ensure all dependencies are installed
4. Check network connectivity for API calls

The RAG system provides a powerful foundation for accurate, personalized farming advice that grows smarter with each knowledge addition!