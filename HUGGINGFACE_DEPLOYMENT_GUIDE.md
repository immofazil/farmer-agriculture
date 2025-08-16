# 🚀 Hugging Face Spaces Deployment Guide

This guide will help you deploy your RAG-powered Farming Advisor to Hugging Face Spaces for free hosting and sharing.

## 📋 Prerequisites

1. **Hugging Face Account** - Sign up at [huggingface.co](https://huggingface.co)
2. **Git** installed on your computer
3. **Groq API Key** - Get from [console.groq.com](https://console.groq.com)
4. **OpenWeatherMap API Key** - Get from [openweathermap.org](https://openweathermap.org/api)

## 🎯 What We're Deploying

- **RAG-powered AI chatbot** with 51+ farming knowledge entries
- **Personalized responses** based on user farm profile
- **Weather integration** for location-specific advice
- **Multi-language support** (English, Hindi, Marathi, Gujarati, Spanish, Arabic)
- **Budget management** and expense tracking
- **SQLite knowledge database** with vector embeddings

## 📁 Step 1: Prepare Your Files

### 1.1 Create Required Files for Hugging Face

Create these files in your project root:

#### `app.py` (Hugging Face entry point)
```python
import subprocess
import sys
import os

# Install Node.js dependencies
subprocess.run([sys.executable, "-m", "pip", "install", "nodejs"], check=True)

# Start the Node.js server
os.system("npm install && node index.js")
```

#### `requirements.txt` (Python dependencies)
```
nodejs
```

#### `package.json` (Update your existing one)
```json
{
  "name": "farming-advisor-rag",
  "version": "1.0.0",
  "description": "RAG-powered farming advisor with personalized AI responses",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "populate": "node populateKnowledge.cjs"
  },
  "dependencies": {
    "express": "^4.18.2",
    "groq-sdk": "^0.3.1",
    "@xenova/transformers": "^2.17.1",
    "sqlite3": "^5.1.6",
    "bcrypt": "^5.1.1",
    "axios": "^1.6.2",
    "node-fetch": "^3.3.2",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### `README.md` (For Hugging Face Space)
```markdown
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

## Features

- 🧠 **RAG System**: Retrieves relevant farming knowledge before generating responses
- ⚡ **Fast AI**: Powered by Groq API for sub-second responses
- 👤 **Personalized**: Considers your farm profile, budget, and location
- 🌍 **Multi-language**: Supports 6 languages including Hindi, Marathi, Gujarati
- 🌤️ **Weather-aware**: Integrates real-time weather data
- 💰 **Budget tracking**: Manage farming expenses and budgets

## Usage

1. Fill in your profile and farm information in Settings
2. Set your farming budget and track expenses
3. Ask questions about farming in your preferred language
4. Get personalized advice based on your specific situation

## Technology Stack

- **Backend**: Node.js, Express
- **AI**: Groq API with Llama 3
- **Knowledge Base**: SQLite with vector embeddings
- **Embeddings**: Xenova Transformers (all-MiniLM-L6-v2)
- **Weather**: OpenWeatherMap API
```

#### `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create knowledge database and populate it
RUN node populateKnowledge.cjs

# Expose port
EXPOSE 7860

# Start the application
CMD ["npm", "start"]
```

### 1.2 Update Environment Variables

Create `.env.example` for Hugging Face:
```env
# Groq API Configuration
GROQ_API_KEY=your-groq-api-key-here

# Weather API Configuration
WEATHER_API_KEY=your-openweathermap-api-key-here

# Server Configuration
PORT=7860
NODE_ENV=production
```

### 1.3 Update Server Port

In your `index.js`, update the port configuration:
```javascript
const PORT = process.env.PORT || 7860; // Hugging Face uses port 7860
```

## 📤 Step 2: Create Hugging Face Space

### 2.1 Create New Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Fill in details:
   - **Space name**: `farming-advisor-rag`
   - **License**: MIT
   - **SDK**: Docker
   - **Hardware**: CPU basic (free tier)
   - **Visibility**: Public

### 2.2 Clone the Repository

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/farming-advisor-rag
cd farming-advisor-rag
```

## 📁 Step 3: Upload Your Files

### 3.1 Copy All Files

Copy these files to your Hugging Face Space directory:

**Essential Files:**
- `index.js` (main server)
- `groqRAGService.js` (AI service)
- `knowledgeService.js` (knowledge management)
- `weatherService.js` (weather integration)
- `populateKnowledge.cjs` (knowledge population)
- `package.json` (dependencies)
- `Dockerfile` (container config)
- `README.md` (space description)
- `requirements.txt` (Python deps)

**Frontend Files:**
- `public/` folder with all HTML, CSS, JS files
- `public/dashboard.html`
- `public/index.html`
- `public/login.html`
- `public/register.html`
- `public/dashboard.css`
- `public/style.css`
- Logo files (`logo.svg`, `logo-small.svg`, `favicon.svg`)

**Database:**
- `knowledge.db` (pre-populated database)
- `users.db` (user database)

### 3.2 Set Environment Variables

In Hugging Face Space settings:

1. Go to your Space → Settings → Variables and secrets
2. Add these secrets:
   - `GROQ_API_KEY`: Your Groq API key
   - `WEATHER_API_KEY`: Your OpenWeatherMap API key

## 🚀 Step 4: Deploy

### 4.1 Commit and Push

```bash
git add .
git commit -m "Initial deployment of RAG-powered farming advisor"
git push
```

### 4.2 Monitor Build

1. Go to your Space on Hugging Face
2. Watch the build logs in the "Logs" tab
3. Wait for "Running on port 7860" message

### 4.3 Test Deployment

1. Click on your Space URL
2. Test the login/registration
3. Fill in profile and farm information
4. Ask farming questions in different languages
5. Verify RAG responses include relevant knowledge

## 🔧 Step 5: Optimization

### 5.1 Performance Optimization

Add to your `Dockerfile`:
```dockerfile
# Optimize for production
ENV NODE_ENV=production
ENV NPM_CONFIG_PRODUCTION=true

# Clear npm cache
RUN npm cache clean --force
```

### 5.2 Database Optimization

Pre-populate the knowledge database in the Docker build:
```dockerfile
# Populate knowledge base during build
RUN node populateKnowledge.cjs
```

### 5.3 Memory Optimization

Add to `package.json`:
```json
{
  "scripts": {
    "start": "node --max-old-space-size=1024 index.js"
  }
}
```

## 📊 Step 6: Monitoring and Updates

### 6.1 Monitor Usage

- Check Space analytics in Hugging Face dashboard
- Monitor API usage in Groq console
- Track weather API calls in OpenWeatherMap dashboard

### 6.2 Update Knowledge Base

To add more farming knowledge:

1. Update `populateKnowledge.cjs` with new entries
2. Commit and push changes
3. Space will rebuild automatically

### 6.3 Version Updates

For major updates:
```bash
git tag v1.1.0
git push origin v1.1.0
```

## 🎯 Expected Results

After successful deployment:

- **Public URL**: `https://huggingface.co/spaces/YOUR_USERNAME/farming-advisor-rag`
- **Response Time**: Sub-second AI responses
- **Knowledge Base**: 51+ farming articles with vector search
- **Languages**: Multi-language support working
- **Personalization**: User profiles and farm data saved
- **Weather Integration**: Real-time weather data

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails**: Check Dockerfile syntax and dependencies
2. **Port Issues**: Ensure using port 7860
3. **API Errors**: Verify environment variables are set
4. **Database Issues**: Check if knowledge.db is included
5. **Memory Issues**: Reduce embedding model size or use CPU optimization

### Debug Commands:

```bash
# Check logs
docker logs container_id

# Test locally
docker build -t farming-advisor .
docker run -p 7860:7860 farming-advisor
```

## 🌟 Advanced Features

### Custom Domain (Pro)

Upgrade to Hugging Face Pro for custom domain:
- `your-farm-advisor.com` → Your Space

### Scaling (Enterprise)

For high traffic:
- Use Hugging Face Enterprise
- Consider dedicated GPU instances
- Implement caching strategies

## 📈 Success Metrics

Track these metrics:
- **User Registrations**: Number of farmers using the system
- **Questions Asked**: Daily/monthly question volume
- **Language Usage**: Which languages are most popular
- **Knowledge Retrieval**: Most accessed farming topics
- **Response Quality**: User feedback and ratings

Your RAG-powered farming advisor is now ready for global deployment! 🌾🚀