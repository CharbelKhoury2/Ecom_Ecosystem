import express from 'express';
import aiService from '../services/aiService.js';
import conversationService from '../services/conversationService.js';

const router = express.Router();

// Pure Gemini response generator - no fallbacks
async function generateEnhancedResponse(query, userId = null, context = {}) {
  // Direct call to AI service - let errors bubble up naturally
  return await aiService.generateEnhancedResponse(query, userId, context);
}

router.post('/query', async (req, res) => {
  try {
    const { query, userId = 'anonymous', context = {} } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate enhanced AI response
    const result = await generateEnhancedResponse(query, userId, context);
    
    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process your query. Please try again.',
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Enhanced endpoint for user analytics
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    const analytics = await aiService.getUserAnalytics(userId);
    
    if (!analytics) {
      return res.status(404).json({ 
        error: 'User analytics not found',
        message: 'No analytics data available for this user'
      });
    }
    
    res.json({
      analytics,
      timeRange,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch user analytics'
    });
  }
});

// New endpoint for clearing conversation history
router.delete('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await aiService.clearConversationHistory(userId);
    
    res.json({
      message: 'Conversation history and sentiment data cleared successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for sentiment analytics dashboard
router.get('/sentiment/analytics', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const analytics = await aiService.getSentimentAnalytics(timeframe);
    
    res.json({
      analytics,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching sentiment analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for user sentiment trends
router.get('/sentiment/trends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const trends = await aiService.getUserSentimentTrends(userId);
    
    if (!trends) {
      return res.status(404).json({ 
        error: 'No sentiment data found for user',
        message: 'User has no interaction history'
      });
    }
    
    res.json({
      trends,
      userId,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching sentiment trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for sentiment alerts
router.get('/sentiment/alerts', (req, res) => {
  try {
    const alerts = aiService.getSentimentAlerts();
    
    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching sentiment alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for escalation check
router.post('/escalation/check', async (req, res) => {
  try {
    const { query, userId = 'anonymous' } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Analyze sentiment for escalation check
    const sentimentResult = await aiService.analyzeSentiment(query, userId);
    const needsEscalation = aiService.needsEscalation(sentimentResult);
    const empathyResponse = aiService.generateEmpathethicResponse(query, sentimentResult);
    
    res.json({
      needsEscalation,
      escalationReason: needsEscalation ? {
        urgencyLevel: sentimentResult.urgencyLevel,
        escalationRisk: sentimentResult.escalationRisk,
        satisfactionLevel: sentimentResult.satisfactionLevel
      } : null,
      sentimentAnalysis: sentimentResult,
      empathyResponse,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error checking escalation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for conversation history
router.get('/conversation/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    const history = await aiService.getConversationHistory(userId, parseInt(limit));
    
    res.json({
      history,
      count: history.length,
      userId,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for session information
router.get('/conversation/session/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const sessionInfo = aiService.getSessionInfo(userId);
    
    if (!sessionInfo) {
      return res.status(404).json({ 
        error: 'No active session found',
        message: 'User has no active conversation session'
      });
    }
    
    res.json({
      sessionInfo,
      userId,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching session info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for conversation analytics
router.get('/conversation/analytics/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const analytics = aiService.getConversationAnalytics(userId);
    
    res.json({
      analytics,
      userId,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for conversation context
router.post('/conversation/context', async (req, res) => {
  try {
    const { userId, query } = req.body;
    
    if (!userId || !query) {
      return res.status(400).json({ error: 'userId and query are required' });
    }
    
    const context = await aiService.buildConversationContext(userId, query);
    
    res.json({
      context,
      userId,
      query,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error building conversation context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for exporting conversation data
router.get('/conversation/export/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const conversationData = aiService.exportConversationData(userId);
    
    res.json({
      data: conversationData,
      userId,
      exportedAt: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error exporting conversation data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user conversations
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    const conversations = await conversationService.getUserConversations(userId, parseInt(limit));
    
    res.json({
      conversations,
      count: conversations.length,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation history
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;
    
    const messages = await conversationService.getConversationHistory(conversationId, parseInt(limit));
    
    res.json({
      messages,
      count: messages.length,
      conversationId,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search conversations
router.get('/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { q: query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await conversationService.searchConversations(userId, query, parseInt(limit));
    
    res.json({
      results,
      query,
      count: results.length,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error searching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive conversation
router.patch('/conversations/:conversationId/archive', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await conversationService.archiveConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({
      message: 'Conversation archived successfully',
      conversation,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation summary
router.get('/conversations/:conversationId/summary', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const summary = await conversationService.generateConversationSummary(conversationId);
    
    res.json({
      summary,
      conversationId,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export conversation data
router.get('/export/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const exportData = await conversationService.exportConversationData(userId);
    
    if (!exportData) {
      return res.status(404).json({ error: 'No conversation data found' });
    }
    
    res.json({
      exportData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error exporting conversation data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user context
router.get('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const context = await conversationService.getUserContext(userId);
    
    res.json({
      context,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching user context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user context
router.patch('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const context = await conversationService.updateUserContext(userId, updates);
    
    if (!context) {
      return res.status(404).json({ error: 'User context not found' });
    }
    
    res.json({
      message: 'User context updated successfully',
      context,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error updating user context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get personalized recommendations for user
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;
    
    const recommendations = await aiService.getPersonalizedRecommendations(userId, parseInt(limit));
    
    res.json({
      recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch personalized recommendations'
    });
  }
});

// Track recommendation interaction (view, click, dismiss)
router.post('/recommendations/:userId/:recommendationId/interact', async (req, res) => {
  try {
    const { userId, recommendationId } = req.params;
    const { interactionType } = req.body;
    
    if (!['viewed', 'clicked', 'dismissed'].includes(interactionType)) {
      return res.status(400).json({ 
        error: 'Invalid interaction type',
        message: 'Interaction type must be: viewed, clicked, or dismissed'
      });
    }
    
    const success = await aiService.trackRecommendationInteraction(userId, recommendationId, interactionType);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Recommendation not found',
        message: 'Could not find recommendation to update'
      });
    }
    
    res.json({
      message: `Recommendation ${interactionType} successfully`,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to track recommendation interaction'
    });
  }
});

// Create or update user session
router.post('/session/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { session_id, device_info, ip_address, user_agent } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ 
        error: 'Session ID required',
        message: 'session_id is required in request body'
      });
    }
    
    // Import userBehaviorService for session management
    const { default: userBehaviorService } = await import('../services/userBehaviorService.js');
    
    const session = await userBehaviorService.createUserSession(userId, {
      session_id,
      device_info: device_info || {},
      ip_address: ip_address || req.ip,
      user_agent: user_agent || req.get('User-Agent')
    });
    
    if (!session) {
      return res.status(500).json({ 
        error: 'Failed to create session',
        message: 'Could not create user session'
      });
    }
    
    res.json({
      session,
      message: 'Session created successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error creating user session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create user session'
    });
  }
});

// End user session
router.put('/session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Import userBehaviorService for session management
    const { default: userBehaviorService } = await import('../services/userBehaviorService.js');
    
    const success = await userBehaviorService.endUserSession(sessionId);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Could not find session to end'
      });
    }
    
    res.json({
      message: 'Session ended successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error ending user session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to end user session'
    });
  }
});

// Track user action within session
router.post('/session/:sessionId/action', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body;
    
    if (!action || !action.type) {
      return res.status(400).json({ 
        error: 'Action required',
        message: 'action object with type is required in request body'
      });
    }
    
    // Import userBehaviorService for action tracking
    const { default: userBehaviorService } = await import('../services/userBehaviorService.js');
    
    const success = await userBehaviorService.trackUserAction(sessionId, action);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Could not find session to track action'
      });
    }
    
    res.json({
      message: 'Action tracked successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error tracking user action:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to track user action'
    });
  }
});

// Get recommendation analytics
router.get('/recommendations/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    // Import recommendationEngine for analytics
    const { default: recommendationEngine } = await import('../services/recommendationEngine.js');
    
    const analytics = await recommendationEngine.getRecommendationAnalytics(userId, timeRange);
    
    res.json({
      analytics,
      timeRange,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching recommendation analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch recommendation analytics'
    });
  }
});

export default router;