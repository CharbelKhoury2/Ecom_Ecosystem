import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SentimentDatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Store user sentiment analysis in database
  async storeSentimentAnalysis(userId, query, sentimentResult) {
    try {
      const { data, error } = await this.supabase
        .from('user_sentiment_history')
        .insert({
          user_id: userId,
          query_text: query,
          overall_sentiment: sentimentResult.overall,
          sentiment_confidence: sentimentResult.confidence,
          sentiment_intensity: sentimentResult.intensity,
          emotional_tones: sentimentResult.emotionalTone || [],
          business_context: sentimentResult.businessContext || [],
          urgency_level: sentimentResult.urgencyLevel,
          escalation_risk: sentimentResult.escalationRisk,
          satisfaction_level: sentimentResult.satisfactionLevel,
          gemini_insights: sentimentResult.geminiInsights
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing sentiment analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error storing sentiment:', error);
      return null;
    }
  }

  // Store sentiment alert in database
  async storeSentimentAlert(alert) {
    try {
      const { data, error } = await this.supabase
        .from('sentiment_alerts')
        .insert({
          user_id: alert.userId,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          alert_data: {
            triggers: alert.triggers || [],
            satisfactionScore: alert.satisfactionScore,
            ...alert
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing sentiment alert:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error storing alert:', error);
      return null;
    }
  }

  // Store user behavior tracking data
  async storeUserBehavior(userId, sessionId, query, intentData, sentimentData) {
    try {
      const { data, error } = await this.supabase
        .from('user_behavior_tracking')
        .insert({
          user_id: userId,
          session_id: sessionId,
          query_text: query,
          intent_category: intentData?.intent || intentData?.category,
          intent_confidence: intentData?.confidence,
          response_satisfaction: sentimentData?.satisfactionLevel?.score,
          user_segments: intentData?.segments || [],
          business_context: sentimentData?.businessContext || []
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing user behavior:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error storing behavior:', error);
      return null;
    }
  }

  // Store conversation history with sentiment context
  async storeConversationHistory(userId, sessionId, query, response, sentimentData, mlInsights, metadata) {
    try {
      const { data, error } = await this.supabase
        .from('conversation_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          query_text: query,
          response_text: response,
          sentiment_data: sentimentData,
          ml_insights: mlInsights,
          response_metadata: metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing conversation history:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error storing conversation:', error);
      return null;
    }
  }

  // Get user sentiment history from database
  async getUserSentimentHistory(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('user_sentiment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sentiment history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error fetching sentiment history:', error);
      return [];
    }
  }

  // Get sentiment analytics from database
  async getSentimentAnalytics(timeframe = '24h') {
    try {
      let timeFilter;
      const now = new Date();
      
      switch (timeframe) {
        case '1h':
          timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { data, error } = await this.supabase
        .from('user_sentiment_history')
        .select('*')
        .gte('created_at', timeFilter.toISOString());

      if (error) {
        console.error('Error fetching sentiment analytics:', error);
        return this.getEmptyAnalytics(timeframe);
      }

      return this.processAnalyticsData(data || [], timeframe);
    } catch (error) {
      console.error('Database error fetching analytics:', error);
      return this.getEmptyAnalytics(timeframe);
    }
  }

  // Process analytics data
  processAnalyticsData(data, timeframe) {
    if (data.length === 0) {
      return this.getEmptyAnalytics(timeframe);
    }

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const emotionCounts = {};
    const contextCounts = {};
    let totalSatisfaction = 0;
    let urgentCount = 0;
    let escalationCount = 0;

    data.forEach(record => {
      // Count sentiments
      sentimentCounts[record.overall_sentiment]++;
      
      // Sum satisfaction scores
      if (record.satisfaction_level?.score) {
        totalSatisfaction += parseFloat(record.satisfaction_level.score);
      }
      
      // Count urgent queries
      if (record.urgency_level === 'high') urgentCount++;
      
      // Count escalation risks
      if (record.escalation_risk?.level === 'high') escalationCount++;
      
      // Count emotions
      if (record.emotional_tones && Array.isArray(record.emotional_tones)) {
        record.emotional_tones.forEach(emotion => {
          const tone = emotion.tone || emotion;
          emotionCounts[tone] = (emotionCounts[tone] || 0) + 1;
        });
      }
      
      // Count business contexts
      if (record.business_context && Array.isArray(record.business_context)) {
        record.business_context.forEach(context => {
          const contextName = context.context || context;
          contextCounts[contextName] = (contextCounts[contextName] || 0) + 1;
        });
      }
    });

    return {
      totalQueries: data.length,
      sentimentDistribution: sentimentCounts,
      averageSatisfaction: data.length > 0 ? totalSatisfaction / data.length : 0,
      urgentQueries: urgentCount,
      escalationRisks: escalationCount,
      topEmotions: Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([emotion, count]) => ({ emotion, count })),
      businessContexts: Object.entries(contextCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([context, count]) => ({ context, count })),
      timeframe
    };
  }

  // Get empty analytics structure
  getEmptyAnalytics(timeframe) {
    return {
      totalQueries: 0,
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
      averageSatisfaction: 0,
      urgentQueries: 0,
      escalationRisks: 0,
      topEmotions: [],
      businessContexts: [],
      timeframe
    };
  }

  // Get user sentiment trends using database function
  async getUserSentimentTrends(userId, days = 7) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_sentiment_summary', {
          p_user_id: userId,
          p_days: days
        });

      if (error) {
        console.error('Error fetching sentiment trends:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      return {
        totalInteractions: result.total_interactions,
        recentSentimentDistribution: result.sentiment_distribution,
        averageSatisfaction: parseFloat(result.avg_satisfaction || 0),
        trendDirection: result.trend_direction,
        lastInteraction: result.last_interaction
      };
    } catch (error) {
      console.error('Database error fetching trends:', error);
      return null;
    }
  }

  // Get recent sentiment alerts
  async getSentimentAlerts(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('sentiment_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sentiment alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error fetching alerts:', error);
      return [];
    }
  }

  // Mark alert as resolved
  async resolveAlert(alertId) {
    try {
      const { data, error } = await this.supabase
        .from('sentiment_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        console.error('Error resolving alert:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error resolving alert:', error);
      return null;
    }
  }

  // Clear user data from database
  async clearUserData(userId) {
    try {
      // Clear sentiment history
      await this.supabase
        .from('user_sentiment_history')
        .delete()
        .eq('user_id', userId);

      // Clear behavior tracking
      await this.supabase
        .from('user_behavior_tracking')
        .delete()
        .eq('user_id', userId);

      // Clear conversation history
      await this.supabase
        .from('conversation_history')
        .delete()
        .eq('user_id', userId);

      // Mark user alerts as resolved
      await this.supabase
        .from('sentiment_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_resolved', false);

      return true;
    } catch (error) {
      console.error('Database error clearing user data:', error);
      return false;
    }
  }

  // Get sentiment dashboard data
  async getSentimentDashboard() {
    try {
      const { data, error } = await this.supabase
        .from('sentiment_dashboard')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching sentiment dashboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error fetching dashboard:', error);
      return [];
    }
  }

  // Update sentiment analytics aggregations
  async updateSentimentAnalytics(timeframe = '24h') {
    try {
      const analytics = await this.getSentimentAnalytics(timeframe);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from('sentiment_analytics')
        .upsert({
          date_period: today,
          timeframe: timeframe,
          total_queries: analytics.totalQueries,
          positive_sentiment_count: analytics.sentimentDistribution.positive,
          negative_sentiment_count: analytics.sentimentDistribution.negative,
          neutral_sentiment_count: analytics.sentimentDistribution.neutral,
          average_satisfaction: analytics.averageSatisfaction,
          urgent_queries_count: analytics.urgentQueries,
          escalation_risks_count: analytics.escalationRisks,
          top_emotions: analytics.topEmotions,
          business_contexts: analytics.businessContexts
        }, {
          onConflict: 'date_period,timeframe'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating sentiment analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error updating analytics:', error);
      return null;
    }
  }

  // Health check for database connection
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('user_sentiment_history')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export default new SentimentDatabaseService();