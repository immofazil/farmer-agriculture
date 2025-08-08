const OpenAI = require('openai');

class FarmingAIService {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });

    // System prompt to make the AI a farming expert
    this.systemPrompt = `You are an expert agricultural advisor and farming consultant with decades of experience helping farmers worldwide. Your role is to provide practical, accurate, and helpful advice on all aspects of farming and agriculture.

Key areas of expertise include:
- Crop selection, planting, and harvesting
- Soil management and fertility
- Irrigation and water management
- Pest and disease control
- Weather impact and climate adaptation
- Market conditions and pricing strategies
- Government policies and agricultural subsidies
- Sustainable farming practices
- Farm equipment and technology
- Livestock management (if asked)

Guidelines for responses:
- Provide practical, actionable advice
- Consider regional variations when relevant
- Mention safety precautions when dealing with chemicals or equipment
- Suggest consulting local agricultural extension services when appropriate
- Use clear, farmer-friendly language
- Include specific examples and recommendations
- Consider both traditional and modern farming methods
- Be encouraging and supportive to farmers at all levels

Always aim to be helpful, accurate, and supportive in your responses. If you're unsure about something specific to a particular region, suggest consulting local agricultural experts.`;
  }

  async generateResponse(question, conversationHistory = []) {
    console.log('🤖 AI Service called with question:', question.substring(0, 50) + '...');
    console.log('🔑 API Key available:', this.openai.apiKey ? 'Yes' : 'No');

    try {
      // Prepare messages for the conversation
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        }
      ];

      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        // Add last few messages for context (limit to prevent token overflow)
        const recentHistory = conversationHistory.slice(-6); // Last 6 messages
        recentHistory.forEach(msg => {
          messages.push({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      // Add the current question
      messages.push({
        role: 'user',
        content: question
      });

      // Call OpenAI API
      console.log('📡 Calling OpenAI API...');
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // You can upgrade to gpt-4 for better responses
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7, // Balanced creativity and consistency
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      console.log('✅ OpenAI API response received');
      return completion.choices[0].message.content.trim();

    } catch (error) {
      console.error('OpenAI API Error:', error);

      // Handle different types of errors
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        return "🚦 **High Demand Notice**\n\nOpenAI's servers are currently experiencing high demand. This is temporary and should resolve within a few minutes.\n\n**What you can do:**\n• Wait 1-2 minutes and try again\n• Try asking a simpler question\n• The service should return to normal shortly\n\nI apologize for the inconvenience - this is due to high usage across all OpenAI services.";
      } else if (error.status === 401 || error.code === 'invalid_api_key') {
        return "🔑 **API Key Issue**\n\nThere's an issue with the API configuration. Please contact the administrator to resolve this.";
      } else if (error.code === 'insufficient_quota') {
        return "💳 **Usage Limit Reached**\n\nThe API usage limit has been reached. Please contact the administrator to upgrade the plan or wait for the limit to reset.";
      } else if (error.status === 503 || error.code === 'service_unavailable') {
        return "🔧 **Service Temporarily Unavailable**\n\nOpenAI's service is temporarily down for maintenance. Please try again in a few minutes.";
      } else {
        return "⚠️ **Technical Issue**\n\nI'm experiencing a technical difficulty right now. Please try again in a moment.\n\n**If the problem persists:**\n• Wait a few minutes and retry\n• Try asking a different question\n• Contact support if issues continue";
      }
    }
  }

  // Fallback responses for when AI is unavailable
  getFallbackResponse(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('crop') || lowerQuestion.includes('plant') || lowerQuestion.includes('grow')) {
      return `🌾 **Crop Growing Advice:**

For successful crop growing, consider these key factors:

• **Soil Preparation:** Test your soil pH and add organic matter
• **Timing:** Plant according to your local climate and season
• **Variety Selection:** Choose varieties suited to your region
• **Spacing:** Give plants adequate room to grow
• **Water Management:** Provide consistent, appropriate moisture
• **Pest Management:** Monitor regularly and use integrated approaches

For specific crop advice, please let me know what you're planning to grow and your location/climate zone.`;
    }

    if (lowerQuestion.includes('water') || lowerQuestion.includes('irrigation')) {
      return `💧 **Irrigation Best Practices:**

Effective water management is crucial for farming success:

• **Timing:** Water early morning to reduce evaporation
• **Method:** Drip irrigation is most efficient (90-95% efficiency)
• **Frequency:** Deep, less frequent watering is better than shallow, frequent watering
• **Monitoring:** Check soil moisture regularly
• **Conservation:** Use mulch, collect rainwater, and maintain systems

The key is providing consistent moisture while avoiding overwatering and water waste.`;
    }

    return `🌱 **Farming Guidance:**

I'm here to help with all your farming questions! I can provide advice on:

• Crop selection and growing techniques
• Soil management and fertility
• Irrigation and water conservation
• Pest and disease management
• Weather adaptation strategies
• Market planning and economics
• Sustainable farming practices

Please feel free to ask me specific questions about any aspect of farming, and I'll provide detailed, practical advice to help you succeed.`;
  }
}

module.exports = new FarmingAIService();