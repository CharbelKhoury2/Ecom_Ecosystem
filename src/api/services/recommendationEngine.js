// Recommendation Engine - Generates personalized recommendations for users

class RecommendationEngine {
  constructor() {
    this.userRecommendations = new Map();
    this.recommendationTemplates = this.initializeTemplates();
  }

  // Initialize recommendation templates
  initializeTemplates() {
    return {
      revenue: [
        'Review your top-performing product categories',
        'Analyze seasonal revenue trends',
        'Check profit margins by product line',
        'Explore upselling opportunities',
        'Monitor conversion rate optimization'
      ],
      inventory: [
        'Set up low-stock alerts for fast-moving items',
        'Review inventory turnover rates',
        'Optimize reorder points for seasonal products',
        'Analyze dead stock and slow-moving inventory',
        'Implement just-in-time inventory management'
      ],
      orders: [
        'Monitor order fulfillment times',
        'Analyze customer order patterns',
        'Review return and refund rates',
        'Optimize shipping and delivery options',
        'Track customer lifetime value'
      ],
      marketing: [
        'Analyze campaign ROI and performance',
        'Review customer acquisition costs',
        'Optimize ad spend allocation',
        'Test new marketing channels',
        'Improve email marketing engagement'
      ],
      general: [
        'Check your daily business dashboard',
        'Review key performance indicators',
        'Analyze customer feedback and reviews',
        'Monitor competitor pricing',
        'Plan for upcoming seasonal trends'
      ]
    };
  }

  // Generate personalized recommendations
  async generatePersonalizedRecommendations(userId, limit = 5) {
    try {
      // Get user behavior to personalize recommendations
      const userProfile = await this.getUserProfile(userId);
      const recommendations = [];

      if (userProfile && userProfile.topCategories.length > 0) {
        // Generate recommendations based on user's top categories
        for (const [category, count] of userProfile.topCategories) {
          const categoryRecommendations = this.recommendationTemplates[category] || this.recommendationTemplates.general;
          recommendations.push(...categoryRecommendations.slice(0, 2));
        }
      } else {
        // Default recommendations for new users
        recommendations.push(...this.recommendationTemplates.general);
      }

      // Add contextual recommendations based on time and business patterns
      const contextualRecommendations = this.getContextualRecommendations();
      recommendations.push(...contextualRecommendations);

      // Remove duplicates and limit results
      const uniqueRecommendations = [...new Set(recommendations)];
      const finalRecommendations = uniqueRecommendations.slice(0, limit).map((rec, index) => ({
        id: `rec_${userId}_${Date.now()}_${index}`,
        text: rec,
        category: this.categorizeRecommendation(rec),
        priority: index < 2 ? 'high' : 'medium',
        timestamp: new Date().toISOString()
      }));

      // Cache recommendations
      this.userRecommendations.set(userId, {
        recommendations: finalRecommendations,
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });

      return finalRecommendations;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return this.getDefaultRecommendations(limit);
    }
  }

  // Get contextual recommendations based on current time/business context
  getContextualRecommendations() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const recommendations = [];

    // Morning recommendations
    if (hour >= 6 && hour < 12) {
      recommendations.push('Review overnight orders and customer inquiries');
      recommendations.push('Check inventory levels for today\'s expected sales');
    }
    // Afternoon recommendations
    else if (hour >= 12 && hour < 18) {
      recommendations.push('Monitor real-time sales performance');
      recommendations.push('Review and respond to customer feedback');
    }
    // Evening recommendations
    else {
      recommendations.push('Analyze today\'s sales performance');
      recommendations.push('Plan tomorrow\'s marketing activities');
    }

    // Weekend recommendations
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      recommendations.push('Review weekly performance metrics');
      recommendations.push('Plan upcoming week\'s inventory needs');
    }

    return recommendations;
  }

  // Categorize recommendation
  categorizeRecommendation(recommendation) {
    const text = recommendation.toLowerCase();
    if (text.includes('revenue') || text.includes('sales') || text.includes('profit')) return 'revenue';
    if (text.includes('inventory') || text.includes('stock')) return 'inventory';
    if (text.includes('order') || text.includes('customer')) return 'orders';
    if (text.includes('marketing') || text.includes('campaign')) return 'marketing';
    return 'general';
  }

  // Get user profile for recommendations
  async getUserProfile(userId) {
    // This would typically fetch from userBehaviorService
    // For now, return a simple mock profile
    return {
      topCategories: [['revenue', 5], ['inventory', 3]],
      totalQueries: 8,
      lastActive: new Date()
    };
  }

  // Get default recommendations
  getDefaultRecommendations(limit = 5) {
    return this.recommendationTemplates.general.slice(0, limit).map((rec, index) => ({
      id: `default_rec_${Date.now()}_${index}`,
      text: rec,
      category: 'general',
      priority: 'medium',
      timestamp: new Date().toISOString()
    }));
  }

  // Update recommendation interaction
  async updateRecommendationInteraction(userId, recommendationId, interactionType) {
    try {
      // Track interaction for future personalization
      console.log(`User ${userId} ${interactionType} recommendation ${recommendationId}`);
      return true;
    } catch (error) {
      console.error('Error updating recommendation interaction:', error);
      return false;
    }
  }

  // Get cached recommendations
  getCachedRecommendations(userId) {
    const cached = this.userRecommendations.get(userId);
    if (cached && cached.expires_at > new Date()) {
      return cached.recommendations;
    }
    return null;
  }

  // Clear user recommendations
  clearUserRecommendations(userId) {
    this.userRecommendations.delete(userId);
    return true;
  }
}

export default new RecommendationEngine();