// User Behavior Service - Handles user behavior tracking and analytics

class UserBehaviorService {
  constructor() {
    this.userBehaviorCache = new Map();
  }

  // Track user query and behavior
  async trackUserQuery(userId, trackingData) {
    try {
      // Store in memory cache for now
      if (!this.userBehaviorCache.has(userId)) {
        this.userBehaviorCache.set(userId, {
          queries: [],
          totalQueries: 0,
          categories: {},
          sentiments: {},
          lastActive: new Date()
        });
      }

      const userProfile = this.userBehaviorCache.get(userId);
      userProfile.queries.push({
        query: trackingData.query_text,
        intent: trackingData.intent,
        category: trackingData.category,
        sentiment: trackingData.sentiment,
        timestamp: new Date(),
        processingTime: trackingData.processing_time
      });

      userProfile.totalQueries++;
      userProfile.categories[trackingData.category] = (userProfile.categories[trackingData.category] || 0) + 1;
      userProfile.sentiments[trackingData.sentiment] = (userProfile.sentiments[trackingData.sentiment] || 0) + 1;
      userProfile.lastActive = new Date();

      // Keep only last 100 queries
      if (userProfile.queries.length > 100) {
        userProfile.queries = userProfile.queries.slice(-100);
      }

      return true;
    } catch (error) {
      console.error('Error tracking user query:', error);
      return false;
    }
  }

  // Get user analytics
  async getUserAnalytics(userId) {
    try {
      const userProfile = this.userBehaviorCache.get(userId);
      if (!userProfile) {
        return null;
      }

      return {
        userId,
        totalQueries: userProfile.totalQueries,
        topCategories: Object.entries(userProfile.categories)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        sentimentDistribution: userProfile.sentiments,
        lastActive: userProfile.lastActive,
        recentQueries: userProfile.queries.slice(-10),
        averageProcessingTime: userProfile.queries.reduce((sum, q) => sum + (q.processingTime || 0), 0) / userProfile.queries.length,
        engagementLevel: this.calculateEngagementLevel(userProfile)
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  // Calculate user engagement level
  calculateEngagementLevel(userProfile) {
    const recentQueries = userProfile.queries.filter(q => 
      new Date() - new Date(q.timestamp) < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    if (recentQueries > 10) return 'high';
    if (recentQueries > 3) return 'medium';
    return 'low';
  }

  // Get user behavior summary
  async getUserBehaviorSummary(userId) {
    const userProfile = this.userBehaviorCache.get(userId);
    if (!userProfile) {
      return {
        queries: [],
        categories: {},
        sentiments: { positive: 0, negative: 0, neutral: 0 }
      };
    }

    return {
      queries: userProfile.queries,
      categories: userProfile.categories,
      sentiments: userProfile.sentiments
    };
  }

  // Clear user behavior data
  async clearUserBehaviorData(userId) {
    this.userBehaviorCache.delete(userId);
    return true;
  }

  // Get all users analytics
  async getAllUsersAnalytics() {
    const analytics = [];
    for (const [userId, profile] of this.userBehaviorCache.entries()) {
      analytics.push({
        userId,
        totalQueries: profile.totalQueries,
        lastActive: profile.lastActive,
        engagementLevel: this.calculateEngagementLevel(profile)
      });
    }
    return analytics;
  }
}

export default new UserBehaviorService();