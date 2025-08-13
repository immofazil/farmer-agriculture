const { GoogleGenerativeAI } = require('@google/generative-ai');

class FarmingAIService {
  constructor() {
    // Initialize Gemini client
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key-here');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // System prompt to make the AI a farming expert with multilingual support
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

MULTILINGUAL SUPPORT:
- ALWAYS respond in the same language the user asked the question in
- If the user asks in Hindi, respond in Hindi
- If the user asks in English, respond in English
- If the user asks in Spanish, respond in Spanish
- Support these languages: English, Hindi, Marathi, Gujarati, Spanish, and Arabic
- Maintain technical accuracy while using language-appropriate farming terminology

FORMATTING GUIDELINES:
- Use clear headings with emojis (🌾, 💧, 🌱, etc.)
- Break information into digestible sections
- Use bullet points and numbered lists for clarity
- Add spacing between sections for readability
- Use bold text for important points
- Include practical examples in boxes or highlighted sections
- Structure responses as: Overview → Key Points → Practical Steps → Additional Tips

RESPONSE STRUCTURE:
1. Start with a brief, friendly acknowledgment in the user's language
2. Provide main information in well-organized sections with clear headers
3. Include practical, actionable steps in numbered or bulleted lists
4. End with encouragement or next steps
5. Use appropriate emojis to make content visually appealing

FORMATTING EXAMPLES:
For English: "🌾 **Crop Selection Guide**"
For Hindi: "🌾 **फसल चयन गाइड**"
For Spanish: "🌾 **Guía de Selección de Cultivos**"

Use this structure:
🌾 **Main Topic Header**

Brief introduction paragraph.

**🔍 Key Points:**
• Point 1 with practical advice
• Point 2 with specific examples
• Point 3 with actionable steps

**💡 Pro Tips:**
• Advanced tip 1
• Advanced tip 2

**⚠️ Important Notes:**
• Safety considerations
• Regional variations to consider

Guidelines for responses:
- Provide practical, actionable advice
- Consider regional variations when relevant
- Mention safety precautions when dealing with chemicals or equipment
- Suggest consulting local agricultural extension services when appropriate
- Use clear, farmer-friendly language appropriate to the user's language
- Include specific examples and recommendations
- Consider both traditional and modern farming methods
- Be encouraging and supportive to farmers at all levels
- Format responses for easy reading and visual appeal

Always aim to be helpful, accurate, and supportive in your responses. If you're unsure about something specific to a particular region, suggest consulting local agricultural experts.`;
  }

  async generateResponse(question, conversationHistory = [], userLocation = null, userProfile = null) {
    console.log('🤖 AI Service called with question:', question.substring(0, 50) + '...');
    console.log('🔑 API Key available:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');

    try {
      // Prepare the conversation context
      let conversationContext = this.systemPrompt + '\n\n';
      
      // Add user profile and farm information context if available
      if (userProfile) {
        const profileContext = this.getUserProfileContext(userProfile);
        if (profileContext) {
          conversationContext += `USER PROFILE AND FARM INFORMATION:\n${profileContext}\n\n`;
        }
      }
      
      // Add weather and location context if available
      if (userLocation) {
        const weatherContext = await this.getWeatherContext(userLocation);
        if (weatherContext) {
          conversationContext += `CURRENT LOCATION AND WEATHER CONTEXT:\n${weatherContext}\n\n`;
        }
      }
      
      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        // Add last few messages for context (limit to prevent token overflow)
        const recentHistory = conversationHistory.slice(-6); // Last 6 messages
        recentHistory.forEach(msg => {
          conversationContext += `${msg.isUser ? 'Human' : 'Assistant'}: ${msg.content}\n\n`;
        });
      }

      // Add the current question
      conversationContext += `Human: ${question}\n\nAssistant:`;

      // Call Gemini API
      console.log('📡 Calling Gemini API...');
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: conversationContext }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1200, // Increased for better multilingual responses
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });

      console.log('✅ Gemini API response received');
      const response = await result.response;
      const rawText = response.text().trim();
      
      // Format the response for better readability
      return this.formatResponse(rawText);

    } catch (error) {
      console.error('Gemini API Error:', error);

      // Handle different types of errors
      if (error.status === 429 || error.message?.includes('quota')) {
        return "🚦 **High Demand Notice**\n\nGoogle's Gemini API is currently experiencing high demand. This is temporary and should resolve within a few minutes.\n\n**What you can do:**\n• Wait 1-2 minutes and try again\n• Try asking a simpler question\n• The service should return to normal shortly\n\nI apologize for the inconvenience - this is due to high usage across all Gemini services.";
      } else if (error.status === 401 || error.message?.includes('API key')) {
        return "🔑 **API Key Issue**\n\nThere's an issue with the Gemini API configuration. Please check your API key and try again.";
      } else if (error.status === 403) {
        return "🚫 **Access Denied**\n\nThe Gemini API access is restricted. Please check your API key permissions or billing status.";
      } else if (error.status === 503 || error.message?.includes('unavailable')) {
        return "🔧 **Service Temporarily Unavailable**\n\nGemini's service is temporarily down for maintenance. Please try again in a few minutes.";
      } else {
        return "⚠️ **Technical Issue**\n\nI'm experiencing a technical difficulty right now. Please try again in a moment.\n\n**If the problem persists:**\n• Wait a few minutes and retry\n• Try asking a different question\n• Contact support if issues continue";
      }
    }
  }

  getUserProfileContext(userProfile) {
    try {
      let context = '';
      
      // Add profile information
      if (userProfile.profile) {
        const profile = userProfile.profile;
        context += `Farmer Profile:\n`;
        if (profile.fullName) context += `- Name: ${profile.fullName}\n`;
        if (profile.location) context += `- Location: ${profile.location}\n`;
        if (profile.email) context += `- Contact: ${profile.email}\n`;
        if (profile.phone) context += `- Phone: ${profile.phone}\n`;
        context += '\n';
      }
      
      // Add farm information
      if (userProfile.farm) {
        const farm = userProfile.farm;
        context += `Farm Information:\n`;
        if (farm.farmName) context += `- Farm Name: ${farm.farmName}\n`;
        if (farm.farmSize) context += `- Farm Size: ${farm.farmSize} acres\n`;
        if (farm.soilType) context += `- Primary Soil Type: ${farm.soilType}\n`;
        if (farm.primaryCrops) context += `- Primary Crops: ${farm.primaryCrops}\n`;
        if (farm.irrigationType) context += `- Irrigation Type: ${farm.irrigationType}\n`;
        context += '\n';
      }
      
      // Add budget information if available
      if (userProfile.budget) {
        const budget = userProfile.budget;
        context += `Budget Information:\n`;
        if (budget.totalBudget) context += `- Total Budget: ₹${budget.totalBudget.toLocaleString()}\n`;
        if (budget.period) context += `- Budget Period: ${budget.period}\n`;
        if (budget.expenses && budget.expenses.length > 0) {
          const totalSpent = budget.expenses.reduce((sum, expense) => sum + expense.amount, 0);
          const remaining = budget.totalBudget - totalSpent;
          context += `- Total Spent: ₹${totalSpent.toLocaleString()}\n`;
          context += `- Remaining Budget: ₹${remaining.toLocaleString()}\n`;
        }
        context += '\n';
      }
      
      if (context) {
        context += `IMPORTANT: Use this profile and farm information to provide personalized farming advice. Consider the farmer's specific crops, soil type, farm size, irrigation method, and budget when making recommendations. Tailor your advice to their specific situation and needs.`;
      }
      
      return context;
    } catch (error) {
      console.error('Error getting user profile context:', error);
      return null;
    }
  }

  async getWeatherContext(location) {
    try {
      const weatherService = require('./weatherService');
      
      // Get current weather
      const currentWeather = await weatherService.getCurrentWeather(location.lat, location.lon);
      const forecast = await weatherService.getForecast(location.lat, location.lon);
      const alerts = await weatherService.getWeatherAlerts(location.lat, location.lon);
      
      let context = `User Location: ${location.city || 'Unknown'}, ${location.country || 'Unknown'} (${location.lat}, ${location.lon})\n`;
      
      if (currentWeather.success) {
        context += weatherService.formatWeatherForAI(currentWeather, location.city);
        context += '\n\n';
      }
      
      if (forecast.success) {
        context += weatherService.formatForecastForAI(forecast);
        context += '\n';
      }
      
      if (alerts.success) {
        context += weatherService.formatAlertsForAI(alerts);
        context += '\n';
      }
      
      context += `\nIMPORTANT: Use this weather and location information to provide location-specific farming advice. Consider the current weather conditions, forecast, and any alerts when giving recommendations about planting, harvesting, irrigation, or other farming activities.`;
      
      return context;
    } catch (error) {
      console.error('Error getting weather context:', error);
      return null;
    }
  }

  // Format response for better readability
  formatResponse(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text;
    
    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert bullet points to proper format
    formatted = formatted.replace(/^[•·]\s*/gm, '• ');
    
    // Add proper spacing around headers with emojis
    formatted = formatted.replace(/(🌾|💧|🌱|🌤️|💰|🏛️|🐛|🌍|⚡|🔧|📋|🎯|💡|⚠️|✅|🚀)(\s*<strong>[^<]+<\/strong>)/g, '\n\n$1 $2\n');
    
    // Add spacing around standalone headers
    formatted = formatted.replace(/(<strong>[^<]+<\/strong>)/g, '\n$1\n');
    
    // Ensure proper spacing around bullet points
    formatted = formatted.replace(/([•·])/g, '\n$1');
    
    // Add spacing around numbered lists
    formatted = formatted.replace(/^(\d+\.)/gm, '\n$1');
    
    // Clean up excessive newlines but preserve intentional spacing
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
    formatted = formatted.replace(/^\n+/, '');
    
    return formatted.trim();
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