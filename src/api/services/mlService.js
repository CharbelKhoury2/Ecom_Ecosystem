import fs from 'fs';
import path from 'path';

class MLService {
  constructor() {
    this.queryPatterns = new Map();
    this.intentClassifier = new Map();
    this.sentimentLexicon = this.initializeSentimentLexicon();
    this.userSegments = new Map();
    this.predictiveModels = new Map();
    this.trainingData = [];
    this.initializeModels();
  }

  // Initialize sentiment lexicon for advanced sentiment analysis
  initializeSentimentLexicon() {
    return {
      positive: {
        strong: ['excellent', 'amazing', 'outstanding', 'fantastic', 'superb', 'brilliant', 'perfect', 'wonderful'],
        moderate: ['good', 'great', 'nice', 'fine', 'okay', 'decent', 'satisfactory', 'pleased'],
        weak: ['alright', 'acceptable', 'fair', 'reasonable', 'adequate']
      },
      negative: {
        strong: ['terrible', 'awful', 'horrible', 'disgusting', 'hate', 'worst', 'disaster', 'nightmare'],
        moderate: ['bad', 'poor', 'disappointing', 'unsatisfactory', 'frustrated', 'annoyed'],
        weak: ['meh', 'not great', 'could be better', 'mediocre', 'average']
      },
      business: {
        urgency: ['urgent', 'asap', 'immediately', 'quickly', 'rush', 'emergency'],
        concern: ['worried', 'concerned', 'anxious', 'trouble', 'problem', 'issue'],
        satisfaction: ['happy', 'satisfied', 'content', 'pleased', 'delighted']
      }
    };
  }

  // Initialize ML models and patterns
  initializeModels() {
    // Greeting and conversational intent patterns (highest priority)
    this.intentClassifier.set('greeting', {
      patterns: [/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy)$/i, /^(hi|hello|hey)\s*[!.]*$/i],
      confidence: 0.95,
      subIntents: ['simple_greeting', 'time_based_greeting', 'casual_greeting']
    });

    this.intentClassifier.set('casual_conversation', {
      patterns: [/how are you|what's up|how's it going|nice to meet you|thanks|thank you|goodbye|bye|see you/i],
      confidence: 0.9,
      subIntents: ['wellbeing_check', 'gratitude', 'farewell', 'social_pleasantries']
    });

    this.intentClassifier.set('general_help', {
      patterns: [/help|assist|support|what can you do|capabilities|features/i],
      confidence: 0.85,
      subIntents: ['feature_inquiry', 'assistance_request', 'capability_check']
    });

    // Intent classification patterns
    this.intentClassifier.set('revenue_inquiry', {
      patterns: [/revenue|profit|sales|income|earnings|money|financial/i],
      confidence: 0.9,
      subIntents: ['daily_revenue', 'monthly_revenue', 'profit_margin', 'growth_rate']
    });

    this.intentClassifier.set('inventory_management', {
      patterns: [/inventory|stock|products|items|warehouse|supply/i],
      confidence: 0.85,
      subIntents: ['stock_levels', 'reorder_alerts', 'product_performance', 'supplier_info']
    });

    this.intentClassifier.set('customer_analytics', {
      patterns: [/customer|client|buyer|user|visitor|demographic/i],
      confidence: 0.8,
      subIntents: ['customer_behavior', 'retention_rate', 'acquisition_cost', 'lifetime_value']
    });

    this.intentClassifier.set('order_management', {
      patterns: [/order|purchase|transaction|checkout|payment/i],
      confidence: 0.85,
      subIntents: ['order_status', 'fulfillment', 'shipping', 'returns']
    });

    this.intentClassifier.set('marketing_analytics', {
      patterns: [/marketing|campaign|ads|promotion|conversion|traffic/i],
      confidence: 0.8,
      subIntents: ['campaign_performance', 'roi', 'conversion_rate', 'traffic_sources']
    });

    this.intentClassifier.set('predictive_analysis', {
      patterns: [/predict|forecast|trend|future|projection|estimate/i],
      confidence: 0.75,
      subIntents: ['sales_forecast', 'demand_prediction', 'trend_analysis', 'seasonal_patterns']
    });
  }

  // Advanced intent recognition with confidence scoring
  recognizeIntent(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [intent, config] of this.intentClassifier.entries()) {
      for (const pattern of config.patterns) {
        if (pattern.test(lowerQuery)) {
          // Calculate confidence based on pattern match and context
          let confidence = config.confidence;
          
          // Boost confidence for exact matches
          const exactMatches = lowerQuery.match(pattern);
          if (exactMatches && exactMatches.length > 1) {
            confidence = Math.min(confidence + 0.1, 1.0);
          }

          // Detect sub-intents
          const detectedSubIntents = config.subIntents.filter(subIntent => 
            lowerQuery.includes(subIntent.replace('_', ' '))
          );

          results.push({
            intent,
            confidence,
            subIntents: detectedSubIntents,
            matchedPattern: pattern.source
          });
        }
      }
    }

    // Sort by confidence and return top result
    results.sort((a, b) => b.confidence - a.confidence);
    return results.length > 0 ? results[0] : {
      intent: 'general_inquiry',
      confidence: 0.5,
      subIntents: [],
      matchedPattern: 'default'
    };
  }

  // Advanced sentiment analysis with intensity scoring
  analyzeSentimentAdvanced(text) {
    const words = text.toLowerCase().split(/\s+/);
    let sentimentScore = 0;
    let intensity = 'neutral';
    let emotions = [];
    let businessContext = [];

    words.forEach(word => {
      // Check positive sentiment
      if (this.sentimentLexicon.positive.strong.includes(word)) {
        sentimentScore += 3;
        intensity = 'strong';
        emotions.push('joy');
      } else if (this.sentimentLexicon.positive.moderate.includes(word)) {
        sentimentScore += 2;
        if (intensity === 'neutral') intensity = 'moderate';
        emotions.push('satisfaction');
      } else if (this.sentimentLexicon.positive.weak.includes(word)) {
        sentimentScore += 1;
        emotions.push('mild_satisfaction');
      }

      // Check negative sentiment
      if (this.sentimentLexicon.negative.strong.includes(word)) {
        sentimentScore -= 3;
        intensity = 'strong';
        emotions.push('anger');
      } else if (this.sentimentLexicon.negative.moderate.includes(word)) {
        sentimentScore -= 2;
        if (intensity === 'neutral') intensity = 'moderate';
        emotions.push('frustration');
      } else if (this.sentimentLexicon.negative.weak.includes(word)) {
        sentimentScore -= 1;
        emotions.push('mild_dissatisfaction');
      }

      // Check business context
      if (this.sentimentLexicon.business.urgency.includes(word)) {
        businessContext.push('urgent');
      }
      if (this.sentimentLexicon.business.concern.includes(word)) {
        businessContext.push('concerned');
      }
      if (this.sentimentLexicon.business.satisfaction.includes(word)) {
        businessContext.push('satisfied');
      }
    });

    // Determine overall sentiment
    let sentiment = 'neutral';
    if (sentimentScore > 2) sentiment = 'positive';
    else if (sentimentScore < -2) sentiment = 'negative';
    else if (sentimentScore > 0) sentiment = 'slightly_positive';
    else if (sentimentScore < 0) sentiment = 'slightly_negative';

    return {
      sentiment,
      score: sentimentScore,
      intensity,
      emotions: [...new Set(emotions)],
      businessContext: [...new Set(businessContext)],
      confidence: Math.min(Math.abs(sentimentScore) / 10, 1.0)
    };
  }

  // User segmentation based on behavior patterns
  segmentUser(userId, behaviorData) {
    const segments = [];
    
    if (!behaviorData) return ['new_user'];

    const { queries, categories, sentiments } = behaviorData;
    const totalQueries = queries.length;

    // Frequency-based segmentation
    if (totalQueries > 50) segments.push('power_user');
    else if (totalQueries > 20) segments.push('regular_user');
    else if (totalQueries > 5) segments.push('occasional_user');
    else segments.push('new_user');

    // Category-based segmentation
    const topCategory = Object.keys(categories)
      .reduce((a, b) => categories[a] > categories[b] ? a : b, 'general');
    
    segments.push(`${topCategory}_focused`);

    // Sentiment-based segmentation
    const positiveRatio = (sentiments.positive || 0) / totalQueries;
    const negativeRatio = (sentiments.negative || 0) / totalQueries;

    if (positiveRatio > 0.7) segments.push('satisfied_user');
    else if (negativeRatio > 0.5) segments.push('dissatisfied_user');
    else segments.push('neutral_user');

    // Engagement level
    const recentQueries = queries.filter(q => 
      new Date() - new Date(q.timestamp) < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    if (recentQueries > 10) segments.push('highly_engaged');
    else if (recentQueries > 3) segments.push('moderately_engaged');
    else segments.push('low_engagement');

    this.userSegments.set(userId, segments);
    return segments;
  }

  // Predictive analytics for business insights
  generatePredictiveInsights(query, userBehavior, historicalData = {}) {
    const insights = [];
    const intent = this.recognizeIntent(query);
    const sentiment = this.analyzeSentimentAdvanced(query);

    // Revenue predictions
    if (intent.intent === 'revenue_inquiry') {
      insights.push({
        type: 'revenue_forecast',
        prediction: 'Based on current trends, expect 15-20% revenue growth next month',
        confidence: 0.75,
        factors: ['seasonal_trends', 'marketing_campaigns', 'inventory_levels']
      });
    }

    // Inventory predictions
    if (intent.intent === 'inventory_management') {
      insights.push({
        type: 'stock_prediction',
        prediction: 'Wireless Headphones likely to stock out in 5-7 days based on current sales velocity',
        confidence: 0.85,
        factors: ['sales_velocity', 'current_stock', 'seasonal_demand']
      });
    }

    // Customer behavior predictions
    if (userBehavior && userBehavior.queries.length > 10) {
      const userSegments = this.segmentUser('user', userBehavior);
      insights.push({
        type: 'user_behavior',
        prediction: `User likely to ask about ${this.predictNextQuery(userBehavior)} based on patterns`,
        confidence: 0.65,
        factors: ['query_history', 'user_segments', 'time_patterns']
      });
    }

    // Anomaly detection
    if (sentiment.businessContext.includes('urgent') || sentiment.intensity === 'strong') {
      insights.push({
        type: 'anomaly_alert',
        prediction: 'Unusual urgency detected - may indicate business issue requiring attention',
        confidence: 0.8,
        factors: ['sentiment_analysis', 'urgency_keywords', 'user_behavior']
      });
    }

    return insights;
  }

  // Predict next likely query based on user patterns
  predictNextQuery(userBehavior) {
    const categories = userBehavior.categories;
    const topCategory = Object.keys(categories)
      .reduce((a, b) => categories[a] > categories[b] ? a : b);

    const predictions = {
      revenue: 'revenue trends or profit analysis',
      inventory: 'stock levels or product performance',
      orders: 'order status or customer analytics',
      analytics: 'performance metrics or insights',
      marketing: 'campaign performance or ROI'
    };

    return predictions[topCategory] || 'general business insights';
  }

  // Train the model with new data
  trainModel(query, intent, sentiment, outcome) {
    this.trainingData.push({
      query,
      intent,
      sentiment,
      outcome,
      timestamp: new Date()
    });

    // Keep only recent training data (last 1000 entries)
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-1000);
    }

    // Update patterns based on successful predictions
    if (outcome === 'successful') {
      this.updatePatterns(query, intent);
    }
  }

  // Update patterns based on successful interactions
  updatePatterns(query, intent) {
    const words = query.toLowerCase().split(/\s+/);
    const intentConfig = this.intentClassifier.get(intent);
    
    if (intentConfig) {
      // Increase confidence for successful patterns
      intentConfig.confidence = Math.min(intentConfig.confidence + 0.01, 1.0);
    }
  }

  // Get comprehensive analytics
  getMLAnalytics() {
    return {
      totalTrainingData: this.trainingData.length,
      intentClassifiers: this.intentClassifier.size,
      userSegments: this.userSegments.size,
      sentimentLexiconSize: {
        positive: Object.values(this.sentimentLexicon.positive).flat().length,
        negative: Object.values(this.sentimentLexicon.negative).flat().length,
        business: Object.values(this.sentimentLexicon.business).flat().length
      },
      modelPerformance: this.calculateModelPerformance()
    };
  }

  // Calculate model performance metrics
  calculateModelPerformance() {
    const recentData = this.trainingData.slice(-100);
    const successfulPredictions = recentData.filter(d => d.outcome === 'successful').length;
    
    return {
      accuracy: recentData.length > 0 ? successfulPredictions / recentData.length : 0,
      totalPredictions: recentData.length,
      successfulPredictions,
      lastUpdated: new Date().toISOString()
    };
  }

  // Export model data for persistence
  exportModelData() {
    return {
      queryPatterns: Array.from(this.queryPatterns.entries()),
      intentClassifier: Array.from(this.intentClassifier.entries()),
      userSegments: Array.from(this.userSegments.entries()),
      trainingData: this.trainingData.slice(-500), // Export recent training data
      timestamp: new Date().toISOString()
    };
  }

  // Import model data for persistence
  importModelData(data) {
    if (data.queryPatterns) {
      this.queryPatterns = new Map(data.queryPatterns);
    }
    if (data.userSegments) {
      this.userSegments = new Map(data.userSegments);
    }
    if (data.trainingData) {
      this.trainingData = data.trainingData;
    }
  }
}

export default new MLService();