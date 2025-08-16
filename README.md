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
- ⚡ **Fast AI**: Powered by Groq API for intelligent responses
- 👤 **Personalized**: Considers your farm profile, budget, and location
- 🌍 **Multi-language**: Supports multiple languages
- 🌤️ **Weather-aware**: Integrates real-time weather data
- 💰 **Budget tracking**: Manage farming expenses and budgets
- 🔐 **User Authentication**: Secure login and registration system

## Usage

1. Fill in your profile and farm information in Settings
2. Set your farming budget and track expenses
3. Ask questions about farming in your preferred language
4. Get personalized advice based on your specific situation

## Technology Stack

- **Backend**: Node.js, Express
- **AI**: Groq API
- **Knowledge Base**: SQLite with vector embeddings
- **Embeddings**: Xenova Transformers (all-MiniLM-L6-v2)
- **Weather**: OpenWeatherMap API
- **Authentication**: bcryptjs for password hashing

## Getting Started

1. Register a new account
2. Login with your credentials
3. Set up your farm profile
4. Start asking farming questions!

## API Endpoints

- `POST /register` - User registration
- `POST /login` - User authentication
- `POST /save-chat` - Save chat history
- `GET /chat-history/:userId` - Get user's chat history
- `POST /knowledge/search` - Search farming knowledge
- `GET /knowledge` - Get all knowledge entries

## Environment Variables

- `GROQ_API_KEY` - Groq API key
- `WEATHER_API_KEY` - OpenWeatherMap API key
- `PORT` - Server port (default: 7860)