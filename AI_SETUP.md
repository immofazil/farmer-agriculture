# AI Chatbot Setup Guide

This application now uses OpenAI's GPT model to provide intelligent responses to farming questions.

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI's website](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Create a new API key
5. Copy the API key (it starts with `sk-`)

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace `your-openai-api-key-here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
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

### OpenAI Pricing (as of 2024)
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens (higher quality responses)

### Token Management
- Each conversation uses approximately 200-800 tokens
- Conversation history is limited to last 6 messages to control costs
- System prompt is optimized for farming expertise

### Cost Estimation
- With GPT-3.5-turbo: ~1000 conversations = $1-2
- With GPT-4: ~1000 conversations = $15-30

## Customization

### Model Selection
You can change the AI model in `aiService.js`:
```javascript
model: 'gpt-4', // For better responses (higher cost)
// or
model: 'gpt-3.5-turbo', // For cost-effective responses
```

### System Prompt
Modify the `systemPrompt` in `aiService.js` to customize the AI's behavior and expertise areas.

### Response Length
Adjust `max_tokens` in the API call to control response length:
- 500 tokens ≈ 375 words (shorter responses)
- 1000 tokens ≈ 750 words (current setting)
- 1500 tokens ≈ 1125 words (longer responses)

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Check that your API key is correct in the `.env` file
   - Ensure the key starts with `sk-`
   - Verify your OpenAI account has API access

2. **"Rate Limit Exceeded" Error**
   - You're making too many requests too quickly
   - Wait a few minutes and try again
   - Consider upgrading your OpenAI plan

3. **"Insufficient Quota" Error**
   - You've exceeded your OpenAI usage limits
   - Add billing information to your OpenAI account
   - Check your usage dashboard

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
- Monitor your OpenAI usage regularly
- Consider implementing rate limiting for production use

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify your OpenAI API key is valid
3. Test with simple questions first
4. Check your OpenAI account status and billing