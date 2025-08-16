---
title: Farming Advisor RAG
emoji: 🌾
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
license: mit
---

# 🌾 RAG-Powered Farming Advisor

An intelligent farming advisor that uses Retrieval-Augmented Generation (RAG) to provide personalized agricultural advice.

## 🚀 Features

- 🧠 **RAG System**: Retrieves relevant farming knowledge before generating responses
- ⚡ **Ultra-Fast AI**: Powered by Groq API for sub-second responses
- 👤 **Personalized Advice**: Considers your farm profile, budget, and location
- 🌍 **Multi-language Support**: English, Hindi, Marathi, Gujarati, Spanish, Arabic
- 🌤️ **Weather Integration**: Real-time weather data and farming recommendations
- 💰 **Budget Management**: Track farming expenses and manage budgets
- 📚 **Knowledge Base**: 51+ curated farming articles with vector search

## 🎯 How It Works

1. **Knowledge Retrieval**: System searches 51+ farming articles using semantic similarity
2. **Context Building**: Combines retrieved knowledge + user profile + weather data
3. **AI Generation**: Groq API generates personalized responses using all context
4. **Multi-language**: Automatically detects and responds in user's language

## 🛠️ Technology Stack

- **Backend**: Node.js, Express
- **AI**: Groq API with Llama 3.1 (8B parameters)
- **RAG**: Vector embeddings with semantic search
- **Knowledge Base**: SQLite with 384-dimensional embeddings
- **Embeddings**: Xenova Transformers (all-MiniLM-L6-v2)
- **Weather**: OpenWeatherMap API integration
- **Frontend**: Vanilla JavaScript, responsive design

## 📖 Usage Guide

### 1. **Setup Your Profile**
- Go to Settings → Profile: Add your name, location, contact info
- Go to Settings → Farm Info: Enter farm details, crops, soil type, irrigation
- Set your farming budget and track expenses

### 2. **Ask Questions**
- Use natural language in any supported language
- Examples:
  - "गेहूं की खेती कैसे करें?" (Hindi)
  - "What's the best irrigation for tomatoes?"
  - "How should I manage my budget for this season?"

### 3. **Get Personalized Advice**
- Responses consider your specific farm characteristics
- Weather conditions influence recommendations
- Budget constraints are factored into suggestions

## 🌟 Sample Knowledge Base

The system includes expert knowledge on:

- **Crop Management**: Wheat, rice, tomatoes, potatoes, corn, soybeans
- **Soil Health**: pH management, composting, organic amendments
- **Irrigation**: Drip systems, sprinklers, water conservation
- **Pest Control**: IPM, organic methods, disease prevention
- **Sustainable Practices**: Crop rotation, cover crops, green manure
- **Weather Adaptation**: Frost protection, drought management
- **Equipment**: Maintenance, safety, optimization

## 🔧 Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd farming-advisor-rag

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GROQ_API_KEY and WEATHER_API_KEY

# Populate knowledge base
node populateKnowledge.cjs

# Start the server
npm start
```

## 🌍 Supported Languages

- **English**: Full support with technical terminology
- **Hindi (हिंदी)**: Complete farming vocabulary
- **Marathi (मराठी)**: Agricultural terms and advice
- **Gujarati (ગુજરાતી)**: Farming guidance and tips
- **Spanish (Español)**: Agricultural terminology
- **Arabic (العربية)**: Farming advice with RTL support

## 📊 Performance

- **Response Time**: < 1 second average
- **Knowledge Retrieval**: Semantic search across 51+ articles
- **Accuracy**: Responses based on curated agricultural knowledge
- **Personalization**: Considers 15+ user profile factors
- **Weather Integration**: Real-time data from OpenWeatherMap

## 🤝 Contributing

This is an open-source project. Contributions welcome:

1. **Add Knowledge**: Contribute farming expertise
2. **Improve Translations**: Enhance multi-language support
3. **Bug Fixes**: Report and fix issues
4. **Feature Requests**: Suggest new capabilities

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Groq**: Ultra-fast AI inference
- **Hugging Face**: Free hosting and transformers
- **OpenWeatherMap**: Weather data API
- **Xenova**: Browser-compatible transformers
- **Farming Community**: Knowledge and feedback

---

**Try it now!** Ask any farming question in your preferred language and get personalized, expert advice powered by RAG technology. 🌾✨