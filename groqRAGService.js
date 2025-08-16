const Groq = require('groq-sdk');
const knowledgeService = require('./knowledgeService');

class GroqRAGService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'your-groq-api-key-here'
    });

    this.systemPrompt = `You are an expert agricultural advisor and farming consultant with decades of experience helping farmers worldwide. Your role is to provide practical, accurate, and helpful advice on all aspects of farming and agriculture.

CRITICAL LANGUAGE INSTRUCTIONS:
1. ALWAYS detect the language of the user's question
2. ALWAYS respond in the EXACT SAME LANGUAGE as the user's question
3. If user asks in Hindi (हिंदी), respond ONLY in Hindi
4. If user asks in English, respond ONLY in English
5. If user asks in Marathi (मराठी), respond ONLY in Marathi
6. If user asks in Gujarati (ગુજરાતી), respond ONLY in Gujarati
7. If user asks in Spanish, respond ONLY in Spanish
8. If user asks in Arabic (العربية), respond ONLY in Arabic

CONTENT INSTRUCTIONS:
1. Use the provided knowledge base context to answer questions accurately
2. If the knowledge base doesn't contain relevant information, use your general farming knowledge
3. Always provide practical, actionable advice
4. Consider the user's specific farm profile when giving recommendations
5. Use clear formatting with emojis and bullet points for readability

Key areas of expertise include:
- Crop selection, planting, and harvesting
- Soil management and fertility
- Irrigation and water management
- Pest and disease control
- Weather impact and climate adaptation
- Market conditions and pricing strategies
- Sustainable farming practices
- Farm equipment and technology

RESPONSE FORMAT:
Use this structure with appropriate emojis:
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

Always be helpful, accurate, and supportive in your responses.`;
  }

  async generateResponse(question, conversationHistory = [], userLocation = null, userProfile = null) {
    console.log('🤖 Groq RAG Service called with question:', question.substring(0, 50) + '...');
    console.log('🔑 Groq API Key available:', process.env.GROQ_API_KEY ? 'Yes' : 'No');

    try {
      // Step 1: Retrieve relevant knowledge from the knowledge base
      console.log('🔍 Searching knowledge base...');
      const relevantKnowledge = await knowledgeService.searchSimilar(question, 3);

      // Step 2: Prepare context with retrieved knowledge
      let contextPrompt = this.systemPrompt + '\n\n';

      // Add retrieved knowledge context
      if (relevantKnowledge && relevantKnowledge.length > 0) {
        contextPrompt += 'RELEVANT KNOWLEDGE FROM DATABASE:\n';
        relevantKnowledge.forEach((knowledge, index) => {
          contextPrompt += `\n${index + 1}. ${knowledge.title}\n`;
          contextPrompt += `${knowledge.content}\n`;
          contextPrompt += `Category: ${knowledge.category}\n`;
          contextPrompt += `Similarity Score: ${knowledge.similarity.toFixed(3)}\n`;
        });
        contextPrompt += '\nUse this knowledge to provide accurate and specific answers.\n\n';
      }

      // Add user profile context if available
      if (userProfile) {
        const profileContext = this.getUserProfileContext(userProfile);
        if (profileContext) {
          contextPrompt += `USER PROFILE AND FARM INFORMATION:\n${profileContext}\n\n`;
        }
      }

      // Add weather context if available
      if (userLocation) {
        const weatherContext = await this.getWeatherContext(userLocation);
        if (weatherContext) {
          contextPrompt += `CURRENT LOCATION AND WEATHER CONTEXT:\n${weatherContext}\n\n`;
        }
      }

      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-4); // Last 4 messages
        contextPrompt += 'CONVERSATION HISTORY:\n';
        recentHistory.forEach(msg => {
          contextPrompt += `${msg.isUser ? 'Human' : 'Assistant'}: ${msg.content}\n`;
        });
        contextPrompt += '\n';
      }

      // Step 3: Detect language and add explicit instruction
      const detectedLanguage = this.detectLanguage(question);
      const languageInstruction = this.getLanguageInstruction(detectedLanguage);

      // Step 4: Generate response using Groq
      console.log('📡 Calling Groq API...');
      console.log('🌍 Detected language:', detectedLanguage);

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: contextPrompt + '\n\n' + languageInstruction
          },
          {
            role: 'user',
            content: question
          }
        ],
        model: 'llama3-8b-8192', // Fast and efficient model
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 0.9,
        stream: false
      });

      console.log('✅ Groq API response received');
      const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Format the response for better readability
      return this.formatResponse(response);

    } catch (error) {
      console.error('❌ Groq RAG Service Error:', error);

      // Handle different types of errors
      if (error.status === 429 || error.message?.includes('rate limit')) {
        return "🚦 **Rate Limit Notice**\n\nGroq API rate limit reached. Please wait a moment and try again.\n\n**What you can do:**\n• Wait 1-2 minutes and retry\n• Try asking a simpler question\n• The service should return to normal shortly";
      } else if (error.status === 401 || error.message?.includes('API key')) {
        return "🔑 **API Key Issue**\n\nThere's an issue with the Groq API configuration. Please check your API key.";
      } else if (error.status === 503 || error.message?.includes('unavailable')) {
        return "🔧 **Service Temporarily Unavailable**\n\nGroq's service is temporarily unavailable. Please try again in a few minutes.";
      } else {
        // Fallback to knowledge base only
        return await this.getFallbackResponse(question, relevantKnowledge);
      }
    }
  }

  async getFallbackResponse(question, relevantKnowledge = null) {
    try {
      if (!relevantKnowledge) {
        relevantKnowledge = await knowledgeService.searchSimilar(question, 2);
      }

      if (relevantKnowledge && relevantKnowledge.length > 0) {
        let response = `🌾 **Based on our farming knowledge base:**\n\n`;

        relevantKnowledge.forEach((knowledge, index) => {
          response += `**${knowledge.title}**\n`;
          response += `${knowledge.content}\n\n`;
        });

        response += `💡 **Note:** This response is from our local knowledge base. For more personalized advice, please try again when the AI service is available.`;

        return response;
      } else {
        return this.getBasicFallbackResponse(question);
      }
    } catch (error) {
      console.error('❌ Error in fallback response:', error);
      return this.getBasicFallbackResponse(question);
    }
  }

  getBasicFallbackResponse(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('crop') || lowerQuestion.includes('plant') || lowerQuestion.includes('grow')) {
      return `🌾 **Crop Growing Advice:**\n\nFor successful crop growing, consider these key factors:\n\n• **Soil Preparation:** Test your soil pH and add organic matter\n• **Timing:** Plant according to your local climate and season\n• **Variety Selection:** Choose varieties suited to your region\n• **Spacing:** Give plants adequate room to grow\n• **Water Management:** Provide consistent, appropriate moisture\n• **Pest Management:** Monitor regularly and use integrated approaches\n\nFor specific crop advice, please let me know what you're planning to grow and your location.`;
    }

    if (lowerQuestion.includes('water') || lowerQuestion.includes('irrigation')) {
      return `💧 **Irrigation Best Practices:**\n\nEffective water management is crucial for farming success:\n\n• **Timing:** Water early morning to reduce evaporation\n• **Method:** Drip irrigation is most efficient (90-95% efficiency)\n• **Frequency:** Deep, less frequent watering is better\n• **Monitoring:** Check soil moisture regularly\n• **Conservation:** Use mulch, collect rainwater, maintain systems\n\nThe key is providing consistent moisture while avoiding overwatering.`;
    }

    return `🌱 **Farming Guidance:**\n\nI'm here to help with all your farming questions! I can provide advice on:\n\n• Crop selection and growing techniques\n• Soil management and fertility\n• Irrigation and water conservation\n• Pest and disease management\n• Weather adaptation strategies\n• Market planning and economics\n• Sustainable farming practices\n\nPlease feel free to ask me specific questions about any aspect of farming.`;
  }

  getUserProfileContext(userProfile) {
    try {
      let context = '';

      if (userProfile.profile) {
        const profile = userProfile.profile;
        context += `Farmer Profile:\n`;
        if (profile.fullName) context += `- Name: ${profile.fullName}\n`;
        if (profile.location) context += `- Location: ${profile.location}\n`;
        context += '\n';
      }

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
        context += `IMPORTANT: Use this profile and farm information to provide personalized farming advice.`;
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

      const currentWeather = await weatherService.getCurrentWeather(location.lat, location.lon);
      const forecast = await weatherService.getForecast(location.lat, location.lon);
      const alerts = await weatherService.getWeatherAlerts(location.lat, location.lon);

      let context = `User Location: ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;

      if (currentWeather.success) {
        context += weatherService.formatWeatherForAI(currentWeather, location.city);
        context += '\n';
      }

      if (forecast.success) {
        context += weatherService.formatForecastForAI(forecast);
        context += '\n';
      }

      if (alerts.success) {
        context += weatherService.formatAlertsForAI(alerts);
        context += '\n';
      }

      context += `\nIMPORTANT: Use this weather information to provide location-specific farming advice.`;

      return context;
    } catch (error) {
      console.error('Error getting weather context:', error);
      return null;
    }
  }

  detectLanguage(text) {
    // Simple language detection based on character patterns
    const hindiPattern = /[\u0900-\u097F]/;
    const marathiPattern = /[\u0900-\u097F]/; // Marathi uses same script as Hindi
    const gujaratiPattern = /[\u0A80-\u0AFF]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const spanishPattern = /[ñáéíóúü]/i;

    if (hindiPattern.test(text)) {
      // Check for specific Hindi words
      if (text.includes('क्या') || text.includes('कैसे') || text.includes('मुझे') || text.includes('बताएं')) {
        return 'hindi';
      }
      // Check for specific Marathi words
      if (text.includes('काय') || text.includes('कसे') || text.includes('मला') || text.includes('सांगा')) {
        return 'marathi';
      }
      return 'hindi'; // Default to Hindi for Devanagari script
    }

    if (gujaratiPattern.test(text)) return 'gujarati';
    if (arabicPattern.test(text)) return 'arabic';
    if (spanishPattern.test(text)) return 'spanish';

    return 'english'; // Default to English
  }

  getLanguageInstruction(language) {
    const instructions = {
      hindi: 'CRITICAL: The user asked in Hindi. You MUST respond ONLY in Hindi (हिंदी). Do not use any English words. Use Hindi farming terminology.',
      marathi: 'CRITICAL: The user asked in Marathi. You MUST respond ONLY in Marathi (मराठी). Do not use any English words. Use Marathi farming terminology.',
      gujarati: 'CRITICAL: The user asked in Gujarati. You MUST respond ONLY in Gujarati (ગુજરાતી). Do not use any English words. Use Gujarati farming terminology.',
      arabic: 'CRITICAL: The user asked in Arabic. You MUST respond ONLY in Arabic (العربية). Do not use any English words. Use Arabic farming terminology.',
      spanish: 'CRITICAL: The user asked in Spanish. You MUST respond ONLY in Spanish (Español). Do not use any English words. Use Spanish farming terminology.',
      english: 'CRITICAL: The user asked in English. You MUST respond ONLY in English. Use clear English farming terminology.'
    };

    return instructions[language] || instructions.english;
  }

  formatResponse(text) {
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

    // Clean up excessive newlines
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
    formatted = formatted.replace(/^\n+/, '');

    return formatted.trim();
  }
}

module.exports = new GroqRAGService();