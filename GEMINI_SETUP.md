# Gemini AI Chatbot Setup Guide

This application now uses Google's Gemini AI to provide intelligent responses to farming questions.

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose "Create API key in new project" or select an existing project
5. Copy the API key (it starts with `AIza`)

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace `your-gemini-api-key-here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyYour-actual-api-key-here
   ```

### 3. Install Dependencies

Make sure you have installed all required packages:
```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

## Features

### Intelligent Responses
- The AI is specifically trained to be a farming expert
- Provides practical, actionable advice
- Considers regional variations and safety precautions
- Maintains conversation context for better responses

### Conversation History
- The AI remembers the conversation context
- Provides more relevant follow-up responses
- Maintains continuity in multi-turn conversations

### Fallback System
- If the AI service is unavailable, the system provides basic farming advice
- Graceful error handling ensures the app continues to work

## API Usage and Costs

### Gemini Pricing (as of 2024)
- Gemini 1.5 Flash: Free tier with generous limits
- 15 requests per minute
- 1 million tokens per day
- 1,500 requests per day

### Token Management
- Each conversation uses approximately 200-800 tokens
- Conversation history is limited to last 6 messages to control usage
- System prompt is optimized for farming expertise

### Cost Estimation
- **Free Tier**: Up to 1,500 requests per day at no cost
- **Paid Tier**: $0.35 per 1M input tokens, $1.05 per 1M output tokens

## Model Information

### Gemini 1.5 Flash
- **Speed**: Very fast responses
- **Context**: 1M token context window
- **Capabilities**: Text generation, reasoning, code generation
- **Languages**: Supports multiple languages
- **Safety**: Built-in safety filters

## Customization

### Model Selection
You can change the AI model in `aiService.js`:
```javascript
this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // For better responses
// or
this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // For faster responses
```

### Generation Config
Adjust the generation parameters in `aiService.js`:
```javascript
generationConfig: {
  temperature: 0.7,    // Creativity (0.0-1.0)
  topK: 40,           // Token selection diversity
  topP: 0.95,         // Nucleus sampling
  maxOutputTokens: 1000, // Response length
}
```

### System Prompt
Modify the `systemPrompt` in `aiService.js` to customize the AI's behavior and expertise areas.

## Troubleshooting

### Common Issues

1. **"API Key Issue" Error**
   - Check that your API key is correct in the `.env` file
   - Ensure the key starts with `AIza`
   - Verify your Google AI Studio account has API access

2. **"High Demand" Error**
   - You're making too many requests too quickly
   - Wait a few minutes and try again
   - Check your quota limits in Google AI Studio

3. **"Access Denied" Error**
   - Your API key doesn't have proper permissions
   - Check your billing status in Google Cloud Console
   - Verify the API is enabled for your project

4. **Fallback Responses Showing**
   - The AI service is temporarily unavailable
   - Check your internet connection
   - Verify your API key is working

### Testing the AI

You can test if the AI is working by asking farming questions like:
- "What's the best time to plant tomatoes?"
- "How do I improve my soil quality?"
- "What irrigation method should I use for corn?"

## Security Notes

- Never commit your `.env` file to version control
- Keep your API key secure and don't share it
- Monitor your Gemini usage regularly
- Consider implementing rate limiting for production use

## Advantages of Gemini over OpenAI

1. **Cost**: Free tier with generous limits
2. **Speed**: Gemini 1.5 Flash is very fast
3. **Context**: Large context window (1M tokens)
4. **Integration**: Easy Google ecosystem integration
5. **Safety**: Built-in safety and content filtering
6. **Multimodal**: Supports text, images, and more (future features)

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify your Gemini API key is valid
3. Test with simple questions first
4. Check your Google AI Studio dashboard for usage and errors