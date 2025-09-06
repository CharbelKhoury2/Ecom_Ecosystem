import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import mlService from './mlService.js';
import sentimentService from './sentimentService.js';
import userBehaviorService from './userBehaviorService.js';
import recommendationEngine from './recommendationEngine.js';
import conversationService from './conversationService.js';
import realTimeDataService from './realTimeDataService.js';

dotenv.config();

class AIService {
  constructor() {
    // Initialize Gemini AI with error handling
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
        this.geminiAvailable = false;
      } else {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.geminiAvailable = true;
        console.log('✅ Gemini AI initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
      this.geminiAvailable = false;
    }
    
    this.conversationHistory = new Map(); // Store conversation history by session
    this.userBehavior = new Map(); // Store user behavior patterns
  }

  // Enhanced query classification using ML service
  classifyQuery(query) {
    const intentResult = mlService.recognizeIntent(query);
    return {
      category: intentResult.intent,
      confidence: intentResult.confidence,
      subIntents: intentResult.subIntents,
      matchedPattern: intentResult.matchedPattern
    };
  }

  // Analyze sentiment of the query with advanced capabilities
  async analyzeSentiment(query, userId = null, context = {}) {
    return await sentimentService.analyzeSentimentAdvanced(query, userId, context);
  }

  // Track user behavior and update user profile with enhanced analytics
  async trackUserBehavior(userId, query, classificationResult, sentimentResult, responseData = {}) {
    if (!userId || userId === 'anonymous') return;

    try {
      // Prepare comprehensive tracking data
      const trackingData = {
        query_text: query,
        intent: classificationResult.intent,
        category: classificationResult.category,
        sentiment: sentimentResult.sentiment,
        sentiment_score: sentimentResult.confidence || 0,
        response_text: responseData.response || '',
        response_type: responseData.type || 'general',
        processing_time: responseData.processing_time || 0,
        success: responseData.success !== false,
        session_id: responseData.session_id || this.generateSessionId(userId),
        context: {
          emotions: sentimentResult.emotions || [],
          business_context: sentimentResult.businessContext || [],
          confidence_scores: {
            intent: classificationResult.confidence || 0,
            sentiment: sentimentResult.confidence || 0
          }
        },
        metadata: {
          user_segments: mlService.segmentUser(userId, this.getUserBehaviorSummary(userId)),
          timestamp: new Date().toISOString(),
          ai_model: 'gemini-pro'
        }
      };

      // Track in database via userBehaviorService
      await userBehaviorService.trackUserQuery(userId, trackingData);

      // Update in-memory cache for quick access
      this.updateUserProfileCache(userId, trackingData);

      // Generate real-time recommendations if user is active
      if (this.shouldGenerateRecommendations(userId)) {
        setTimeout(() => {
          this.generateRealTimeRecommendations(userId);
        }, 1000); // Async recommendation generation
      }

    } catch (error) {
      console.error('Error tracking user behavior:', error);
      // Fallback to in-memory tracking
      this.trackUserBehaviorFallback(userId, query, classificationResult, sentimentResult);
    }
  }

  // Fallback method for in-memory tracking when database is unavailable
  trackUserBehaviorFallback(userId, query, classificationResult, sentimentResult) {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        queries: [],
        categories: {},
        sentiments: {},
        emotions: {},
        businessContext: {},
        lastActive: new Date(),
        userSegments: []
      });
    }

    const userProfile = this.userBehavior.get(userId);
    const category = classificationResult.category;
    const sentiment = sentimentResult.sentiment;
    
    userProfile.queries.push({ 
      query, 
      timestamp: new Date(), 
      category, 
      sentiment,
      confidence: classificationResult.confidence,
      emotions: sentimentResult.emotions,
      businessContext: sentimentResult.businessContext
    });
    
    userProfile.categories[category] = (userProfile.categories[category] || 0) + 1;
    userProfile.sentiments[sentiment] = (userProfile.sentiments[sentiment] || 0) + 1;
    
    // Track emotions and business context
    sentimentResult.emotions.forEach(emotion => {
      userProfile.emotions[emotion] = (userProfile.emotions[emotion] || 0) + 1;
    });
    
    sentimentResult.businessContext.forEach(context => {
      userProfile.businessContext[context] = (userProfile.businessContext[context] || 0) + 1;
    });
    
    userProfile.lastActive = new Date();
    
    // Update user segments using ML service
    userProfile.userSegments = mlService.segmentUser(userId, userProfile);

    // Keep only last 50 queries to manage memory
    if (userProfile.queries.length > 50) {
      userProfile.queries = userProfile.queries.slice(-50);
    }
  }

  // Get real-time business data based on query intent
  async getRealTimeBusinessData(intent) {
    try {
      switch (intent) {
        case 'revenue_inquiry':
        case 'sales_analytics':
          return await realTimeDataService.getSalesData();
        case 'inventory_management':
        case 'stock_inquiry':
          return await realTimeDataService.getInventoryData();
        case 'marketing_analytics':
        case 'campaign_performance':
          return await realTimeDataService.getMarketingData();
        case 'order_analytics':
        case 'order_management':
          const dashboardData = await realTimeDataService.getDashboardData();
          return {
            orders: dashboardData.orders,
            lastUpdated: dashboardData.orders.lastUpdated
          };
        default:
          return await realTimeDataService.getDashboardData();
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      return {
        error: 'Real-time data temporarily unavailable',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Format real-time data for AI prompt
  formatRealTimeData(data) {
    if (data.error) {
      return `Real-time data: ${data.error}`;
    }

    let formatted = [];

    if (data.revenue) {
      formatted.push(`Current Revenue: $${data.revenue.today} today, $${data.revenue.thisMonth} this month (${data.revenue.growth}% growth)`);
    }

    if (data.products) {
      formatted.push(`Products: ${data.products.total} total, ${data.products.lowStock} low stock items`);
      if (data.products.topSelling && data.products.topSelling.length > 0) {
        formatted.push(`Top Selling: ${data.products.topSelling.slice(0, 3).map(p => `${p.name} (${p.sales} sales)`).join(', ')}`);
      }
    }

    if (data.orders) {
      formatted.push(`Orders: ${data.orders.total} total, ${data.orders.processing} processing`);
    }

    if (data.marketing) {
      formatted.push(`Marketing: $${data.marketing.totalSpend} spend, ${data.marketing.totalImpressions} impressions, ROAS: ${data.marketing.averageROAS}`);
    }

    if (data.alerts && data.alerts.length > 0) {
      formatted.push(`Alerts: ${data.alerts.map(a => a.message).join('; ')}`);
    }

    return formatted.join('\n');
  }

  // Generate personalized recommendations
  generatePersonalizedRecommendations(userId) {
    const userProfile = this.userBehavior.get(userId);
    if (!userProfile) {
      return {
        type: 'general',
        recommendations: [
          'Start by checking your revenue dashboard',
          'Review your top-performing products',
          'Monitor your recent orders'
        ]
      };
    }

    const topCategory = Object.keys(userProfile.categories)
      .reduce((a, b) => userProfile.categories[a] > userProfile.categories[b] ? a : b);

    const recommendations = {
      revenue: [
        'Check your monthly revenue trends',
        'Analyze profit margins by product category',
        'Review seasonal sales patterns'
      ],
      inventory: [
        'Monitor low-stock items',
        'Review fast-moving products',
        'Check inventory turnover rates'
      ],
      orders: [
        'Review recent order patterns',
        'Check customer retention rates',
        'Analyze order fulfillment times'
      ],
      analytics: [
        'Explore advanced analytics dashboard',
        'Set up custom performance metrics',
        'Review conversion funnel analysis'
      ]
    };

    return {
      type: 'personalized',
      category: topCategory,
      recommendations: recommendations[topCategory] || recommendations.revenue
    };
  }

  // Pure Gemini response generation - no templates or fallbacks
  async generateEnhancedResponse(query, userId = 'anonymous', context = {}) {
    const startTime = Date.now();
    
    try {
      // Get conversation history for context
      let conversationHistory = [];
      if (this.conversationHistory.has(userId)) {
        conversationHistory = this.conversationHistory.get(userId).slice(-5); // Last 5 exchanges
      }
      
      // Get real-time business data if needed
      let businessData = '';
      try {
        const realTimeData = await realTimeDataService.getDashboardData();
        businessData = this.formatRealTimeData(realTimeData);
      } catch (error) {
        // Continue without real-time data if unavailable
        businessData = '';
      }
      
      // Build minimal context prompt for Gemini
      const prompt = this.buildMinimalPrompt(query, conversationHistory, businessData);
      
      let response;
      let processingTime;
      
      // Generate response using Gemini - no fallbacks, let it handle everything naturally
      if (this.geminiAvailable) {
        try {
          const result = await this.model.generateContent(prompt);
          response = result.response.text();
          processingTime = Date.now() - startTime;
        } catch (error) {
          console.error('Gemini API Error:', error.message);
          throw error; // Let the error bubble up instead of using fallbacks
        }
      } else {
        throw new Error('Gemini AI is not available');
      }
      
      // Update conversation history
      this.updateConversationHistory(userId, query, response);
      
      const processingTimeFinal = Date.now() - startTime;
      
      // Return simple response object - let Gemini's natural response speak for itself
      return {
        response,
        timestamp: new Date().toISOString(),
        processing_time: processingTimeFinal,
        model: 'gemini-1.5-flash',
        success: true
      };
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      
      // Return simple error response
      return {
        response: "I'm having trouble connecting to my AI service right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime,
        model: 'error',
        success: false,
        error: error.message
      };
    }
  }

  // Build context-aware prompt for Gemini
  buildContextPrompt(query, category, sentiment, history, userId, context) {
    let prompt = `You are an AI assistant for an e-commerce platform. You help business owners analyze their data and make informed decisions.

Context:
- Query Category: ${category}
- User Sentiment: ${sentiment}
- User ID: ${userId}
`;

    if (history.length > 0) {
      prompt += `\nConversation History (last 3 exchanges):\n`;
      history.slice(-3).forEach((exchange, index) => {
        prompt += `${index + 1}. User: ${exchange.query}\n   Assistant: ${exchange.response}\n`;
      });
    }

    if (context.ecommerceData) {
      prompt += `\nE-commerce Data Context:\n${JSON.stringify(context.ecommerceData, null, 2)}\n`;
    }

    prompt += `\nUser Query: ${query}\n\nPlease provide a helpful, accurate, and contextually relevant response. If this is about business analytics, provide specific insights and actionable recommendations. Keep responses concise but informative.`;

    return prompt;
  }

  // Update conversation history
  updateConversationHistory(userId, query, response) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }

    const history = this.conversationHistory.get(userId);
    history.push({ query, response, timestamp: new Date() });

    // Keep only last 10 exchanges to manage memory
    if (history.length > 10) {
      this.conversationHistory.set(userId, history.slice(-10));
    }
  }

  // Generate intelligent fallback response using ML analysis
  generateIntelligentFallback(query, classificationResult, sentimentResult, predictiveInsights) {
    const category = classificationResult.category;
    const intent = classificationResult.intent;
    const sentiment = sentimentResult.sentiment;
    const confidence = classificationResult.confidence;
    
    // Handle greetings and casual conversation
    if (intent === 'greeting') {
      const greetingResponses = [
        "Hello! 👋 I'm your AI business copilot, here to help you manage and grow your e-commerce business. I can assist you with revenue analysis, inventory management, order tracking, and business insights. What would you like to explore today?",
        "Hi there! 😊 Great to see you! I'm your e-commerce business assistant, ready to help you analyze your sales data, manage inventory, track orders, and discover growth opportunities. How can I help you today?",
        "Hey! 🚀 Welcome back! I'm here to help you make data-driven decisions for your e-commerce business. Whether you need revenue insights, inventory updates, or performance analytics, I've got you covered. What's on your mind?"
      ];
      return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
    }

    if (intent === 'casual_conversation') {
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('how are you') || lowerQuery.includes('what\'s up')) {
        return "I'm doing great, thank you for asking! 😊 I'm here and ready to help you with your e-commerce business. Whether you want to check your latest sales figures, review inventory levels, or explore new growth opportunities, I'm at your service. What would you like to dive into?";
      }
      if (lowerQuery.includes('thank') || lowerQuery.includes('thanks')) {
        return "You're very welcome! 🙏 I'm always happy to help you succeed with your e-commerce business. Feel free to ask me anything about your revenue, inventory, orders, or business analytics anytime!";
      }
      if (lowerQuery.includes('bye') || lowerQuery.includes('goodbye') || lowerQuery.includes('see you')) {
        return "Goodbye! 👋 It was great helping you today. Remember, I'm always here whenever you need insights about your business performance, inventory management, or growth strategies. Have a fantastic day!";
      }
      return "I appreciate you reaching out! 😊 I'm here to help you with all aspects of your e-commerce business. What would you like to explore - revenue trends, inventory status, order analytics, or something else?";
    }

    if (intent === 'general_help') {
      return "I'd be happy to help! 🚀 As your AI business copilot, I can assist you with:\n\n📈 **Revenue & Sales Analysis** - Track performance, identify trends, and growth opportunities\n📦 **Inventory Management** - Monitor stock levels, get reorder alerts, and optimize inventory\n🛒 **Order Analytics** - Review order patterns, fulfillment metrics, and customer insights\n📊 **Marketing Performance** - Analyze campaign effectiveness and ROI\n🔮 **Predictive Analytics** - Forecast trends and make data-driven decisions\n💡 **Personalized Recommendations** - Get tailored suggestions for your business\n\nWhat area would you like to explore first?";
    }
    
    // Create context-aware responses based on ML analysis for business queries
    const intelligentResponses = {
      revenue: {
        high: `📈 Based on your query pattern analysis, here's your revenue overview: Your current monthly revenue shows strong performance with ${sentiment === 'positive' ? 'positive growth trends' : 'stable patterns'}. Key insights: Electronics category leads with 35% contribution, Fashion follows at 28%. ${predictiveInsights.length > 0 ? 'Predictive analysis suggests focusing on high-margin products for next quarter.' : 'Consider reviewing your top-performing categories for optimization opportunities.'}`,
        medium: `📊 Revenue Analysis: Your business metrics indicate steady performance. Current monthly revenue is tracking well with seasonal expectations. Top categories: Electronics (35%), Fashion (28%), Home & Garden (20%). ${sentiment === 'positive' ? 'Your positive engagement suggests good business momentum.' : 'Consider exploring new growth opportunities.'}`
      },
      inventory: {
        high: `📦 Inventory Intelligence: Based on your query patterns, here's your stock overview: 15 items need attention, with Wireless Headphones (8 units) and Smart Watches (12 units) requiring immediate restocking. ${sentiment === 'urgent' ? 'Your urgency is noted - prioritizing critical stock alerts.' : 'Automated reorder suggestions are available in your dashboard.'}`,
        medium: `📋 Stock Status: Current inventory shows mixed levels across categories. Key items to monitor: Electronics (low stock alerts), Fashion (seasonal adjustments needed). Your query history suggests you're actively managing inventory - great practice!`
      },
      orders: {
        high: `🛒 Order Analytics: Recent order patterns show ${sentiment === 'positive' ? 'strong customer engagement' : 'steady activity'}. Today: 23 new orders, Average order value: $67.50. ${predictiveInsights.length > 0 ? 'ML analysis predicts increased activity in the next 48 hours.' : 'Customer retention rate is healthy at 78%.'} Priority orders need fulfillment attention.`,
        medium: `📋 Order Overview: Your order management shows consistent patterns. Recent activity: 23 orders today, fulfillment rate at 94%. Customer satisfaction metrics are positive based on your engagement patterns.`
      },
      analytics: {
        high: `📊 Business Intelligence: Your analytical queries show deep business insight. Key metrics: Revenue growth 12% MoM, Customer acquisition cost down 8%, Conversion rate 3.2%. ${sentiment === 'positive' ? 'Your optimistic approach to data analysis is driving results.' : 'Data-driven decisions are improving your business performance.'} Advanced insights available in your dashboard.`,
        medium: `📈 Performance Metrics: Business analytics show steady growth patterns. Key indicators are trending positively with room for optimization in marketing spend and inventory turnover.`
      }
    };
    
    const confidenceLevel = confidence > 0.7 ? 'high' : 'medium';
    const responseTemplate = intelligentResponses[category] || intelligentResponses.revenue;
    
    return responseTemplate[confidenceLevel] || `Based on your query about "${query}", I've analyzed your business patterns and can provide relevant insights. Your ${category} metrics show ${sentiment} indicators. Check your dashboard for detailed analytics and actionable recommendations.`;
  }

  // Fallback response for errors
  getFallbackResponse(query, category) {
    const fallbackResponses = {
      revenue: "I'm currently unable to access the AI service, but I can help you check your revenue dashboard for the latest financial insights.",
      inventory: "While the AI service is temporarily unavailable, you can review your inventory levels in the products section.",
      orders: "The AI service is currently down, but you can check your recent orders and customer activity in the orders dashboard.",
      general: "I'm experiencing some technical difficulties with the AI service. Please try again in a moment, or check your dashboard for the information you need."
    };

    return {
      response: fallbackResponses[category] || fallbackResponses.general,
      category,
      sentiment: 'neutral',
      recommendations: { type: 'fallback', recommendations: ['Try refreshing the page', 'Check your dashboard manually'] },
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'fallback',
        error: true
      }
    };
  }

  // Get user analytics with enhanced data
  async getUserAnalytics(userId) {
    try {
      // Try to get comprehensive analytics from userBehaviorService
      const analytics = await userBehaviorService.getUserAnalytics(userId);
      if (analytics) {
        return analytics;
      }
    } catch (error) {
      console.error('Error getting user analytics from service:', error);
    }

    // Fallback to in-memory profile data
    const userProfile = this.userBehavior.get(userId);
    if (!userProfile) return null;

    return {
      totalQueries: userProfile.queries.length,
      topCategories: Object.entries(userProfile.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3),
      sentimentDistribution: userProfile.sentiments,
      lastActive: userProfile.lastActive,
      recentQueries: userProfile.queries.slice(-5)
    };
  }

  // Clear conversation history for a user
  async clearConversationHistory(userId) {
    this.conversationHistory.delete(userId);
    this.userBehavior.delete(userId);
    // Clear conversation service data
    await conversationService.clearUserConversations(userId);
    // Also clear sentiment data
    await sentimentService.clearUserSentimentData(userId);
  }

  // Get sentiment analytics dashboard data
  async getSentimentAnalytics(timeframe = '24h') {
    return await sentimentService.getSentimentAnalytics(timeframe);
  }

  // Get user sentiment trends
  async getUserSentimentTrends(userId) {
    return await sentimentService.getUserSentimentTrends(userId);
  }

  // Get sentiment alerts
  getSentimentAlerts() {
    return sentimentService.sentimentAlerts;
  }

  // Check if query needs immediate escalation
  needsEscalation(sentimentResult) {
    return sentimentResult.escalationRisk?.level === 'high' || 
           sentimentResult.urgencyLevel === 'high' ||
           sentimentResult.satisfactionLevel?.level === 'low';
  }

  // Generate empathetic response for negative sentiment
  generateEmpathethicResponse(query, sentimentResult) {
    const emotionalTones = sentimentResult.emotionalTone?.map(t => t.tone) || [];
    
    if (emotionalTones.includes('frustrated') || emotionalTones.includes('complaint')) {
      return {
        prefix: "I understand your frustration, and I'm here to help resolve this issue. ",
        tone: 'apologetic',
        followUp: "Let me provide you with the information you need and suggest next steps."
      };
    }
    
    if (emotionalTones.includes('confused')) {
      return {
        prefix: "I can see this might be confusing. Let me break this down for you clearly. ",
        tone: 'explanatory',
        followUp: "Please don't hesitate to ask if you need any clarification."
      };
    }
    
    if (sentimentResult.urgencyLevel === 'high') {
      return {
        prefix: "I understand this is urgent for you. ",
        tone: 'immediate',
        followUp: "I'll prioritize getting you the information you need right away."
      };
    }
    
    return {
      prefix: "",
      tone: 'professional',
      followUp: ""
    };
  }

  // Get conversation analytics
  getConversationAnalytics(userId) {
    return conversationService.getConversationAnalytics(userId);
  }

  // Get session information
  getSessionInfo(userId) {
    return conversationService.getSessionInfo(userId);
  }

  // Get conversation history
  async getConversationHistory(userId, limit = 10) {
    return await conversationService.getConversationHistory(userId, limit);
  }

  // Build conversation context
  async buildConversationContext(userId, query) {
    return await conversationService.buildConversationContext(userId, query);
  }

  // Export conversation data
  exportConversationData(userId) {
    return conversationService.exportConversationData(userId);
  }

  // Generate session ID for user tracking
  generateSessionId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}_${timestamp}_${random}`;
  }

  // Get user behavior summary for ML processing
  getUserBehaviorSummary(userId) {
    const userProfile = this.userBehavior.get(userId);
    if (!userProfile) {
      return {
        queries: [],
        categories: {},
        sentiments: { positive: 0, negative: 0, neutral: 0 }
      };
    }

    return {
      queries: userProfile.queries || [],
      categories: userProfile.categories || {},
      sentiments: userProfile.sentiments || { positive: 0, negative: 0, neutral: 0 }
    };
  }

  // Update user profile cache with new data
  updateUserProfileCache(userId, trackingData) {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        queries: [],
        categories: {},
        sentiments: { positive: 0, negative: 0, neutral: 0 },
        emotions: {},
        businessContext: {},
        userSegments: [],
        lastActive: new Date()
      });
    }

    const userProfile = this.userBehavior.get(userId);
    
    // Update query history
    userProfile.queries.push({
      query: trackingData.query_text,
      intent: trackingData.intent,
      category: trackingData.category,
      sentiment: trackingData.sentiment,
      timestamp: new Date()
    });
    
    if (userProfile.queries.length > 100) {
      userProfile.queries = userProfile.queries.slice(-100);
    }
    
    // Update counters
    userProfile.categories[trackingData.category] = (userProfile.categories[trackingData.category] || 0) + 1;
    userProfile.sentiments[trackingData.sentiment] = (userProfile.sentiments[trackingData.sentiment] || 0) + 1;
    userProfile.lastActive = new Date();
    
    // Update segments if available
    if (trackingData.metadata?.user_segments) {
      userProfile.userSegments = trackingData.metadata.user_segments;
    }
  }

  // Check if user should receive new recommendations
  shouldGenerateRecommendations(userId) {
    const userProfile = this.userBehavior.get(userId);
    if (!userProfile) return false;
    
    // Generate recommendations every 5 queries or for new users
    return userProfile.queries.length % 5 === 0 || userProfile.queries.length <= 3;
  }

  // Generate real-time recommendations
  async generateRealTimeRecommendations(userId) {
    try {
      const recommendations = await recommendationEngine.generatePersonalizedRecommendations(userId);
      
      // Cache recommendations for quick access
      if (!this.userRecommendations) {
        this.userRecommendations = new Map();
      }
      
      this.userRecommendations.set(userId, {
        recommendations: recommendations.slice(0, 3), // Top 3 for real-time
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });
      
    } catch (error) {
      console.error('Error generating real-time recommendations:', error);
    }
  }

  // Get personalized recommendations for user
  async getPersonalizedRecommendations(userId, limit = 5) {
    try {
      // Check cache first
      if (this.userRecommendations?.has(userId)) {
        const cached = this.userRecommendations.get(userId);
        if (cached.expires_at > new Date()) {
          return cached.recommendations;
        }
      }
      
      // Generate fresh recommendations
      const recommendations = await recommendationEngine.generatePersonalizedRecommendations(userId);
      return recommendations.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Track recommendation interaction
  async trackRecommendationInteraction(userId, recommendationId, interactionType) {
    try {
      return await recommendationEngine.updateRecommendationInteraction(userId, recommendationId, interactionType);
    } catch (error) {
      console.error('Error tracking recommendation interaction:', error);
      return false;
    }
  }

  // Build enhanced prompt with conversation context
  // Build minimal prompt that lets Gemini respond naturally
  buildMinimalPrompt(query, conversationHistory, businessData) {
    let prompt = '';
    
    // Add conversation history if available
    if (conversationHistory.length > 0) {
      prompt += 'Previous conversation:\n';
      conversationHistory.forEach((exchange, index) => {
        prompt += `User: ${exchange.query}\nAssistant: ${exchange.response}\n\n`;
      });
    }
    
    // Add business context only if available and relevant
    if (businessData && businessData.trim()) {
      prompt += `Current business data:\n${businessData}\n\n`;
    }
    
    // Simple, natural prompt that lets Gemini be itself
    prompt += `User: ${query}`;
    
    return prompt;
  }

  // Update user context from interaction
  async updateUserContextFromInteraction(userId, query, classification, sentiment) {
    try {
      const updates = {
        last_topics: {
          [classification.intent]: {
            count: 1,
            last_asked: new Date().toISOString()
          }
        },
        interaction_patterns: {
          total_queries: 1,
          preferred_categories: {
            [classification.intent]: 1
          },
          sentiment_history: {
            [sentiment.sentiment]: 1
          }
        }
      };

      await conversationService.updateUserContext(userId, updates);
    } catch (error) {
      console.error('Error updating user context:', error);
    }
  }

  // Generate fallback response when AI service fails
  generateFallbackResponse(query, userId = null) {
    const lowerQuery = query.toLowerCase();
    
    // Handle greetings first
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy)\s*[!.]*$/i.test(query.trim())) {
      return {
        response: "Hello! 👋 I'm your AI business copilot for e-commerce. I'm here to help you analyze your business data, manage inventory, track revenue, and make informed decisions. What would you like to explore today?",
        type: "greeting_response",
        category: "greeting",
        sentiment: "positive",
        recommendations: {
          type: "conversational",
          recommendations: ["Ask about your revenue trends", "Check inventory status", "Review recent orders", "Explore business analytics"]
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          model: "fallback",
          conversational: true
        }
      };
    }
    
    // Handle casual conversation
    if (lowerQuery.includes('how are you') || lowerQuery.includes('what\'s up') || lowerQuery.includes('thanks') || lowerQuery.includes('thank you')) {
      let response = "I'm doing great, thank you! 😊";
      if (lowerQuery.includes('thanks') || lowerQuery.includes('thank you')) {
        response = "You're very welcome! 🙏";
      }
      response += " I'm here to help you with your e-commerce business. What would you like to know about your revenue, inventory, or orders?";
      
      return {
        response,
        type: "casual_conversation",
        category: "casual_conversation",
        sentiment: "positive",
        recommendations: {
          type: "conversational",
          recommendations: ["Check your latest sales data", "Review inventory levels", "Analyze customer trends"]
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          model: "fallback",
          conversational: true
        }
      };
    }
    
    if (lowerQuery.includes('profit') || lowerQuery.includes('revenue')) {
      return {
        response: "📈 Your current monthly revenue is $45,230, showing a 12% increase from last month. Top performing categories are Electronics (35%) and Fashion (28%).",
        type: "revenue_insight",
        category: "revenue",
        sentiment: "neutral",
        recommendations: {
          type: "fallback",
          recommendations: ["Check detailed revenue analytics", "Review category performance"]
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          model: "fallback",
          demo_mode: !userId
        }
      };
    }
    
    if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
      return {
        response: "📦 Inventory Status: 15 items are running low on stock. Your best-selling product 'Wireless Headphones' needs restocking soon (only 8 units left).",
        type: "inventory_alert",
        category: "inventory",
        sentiment: "neutral",
        recommendations: {
          type: "fallback",
          recommendations: ["Review low stock items", "Set up inventory alerts"]
        },
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          model: "fallback",
          demo_mode: !userId
        }
      };
    }
    
    return {
      response: "I'm here to help you with your e-commerce business! You can ask me about revenue, inventory, orders, or top-performing products. What would you like to know?",
      type: "general_help",
      category: "general",
      sentiment: "neutral",
      recommendations: {
        type: "fallback",
        recommendations: ["Try asking about revenue", "Check inventory status", "Review recent orders"]
      },
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        model: "fallback",
        demo_mode: !userId
      }
    };
  }
}

export default new AIService();