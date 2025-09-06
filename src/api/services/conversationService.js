// Conversation Service - Handles conversation history and context management

class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.userContexts = new Map();
    this.conversationCounter = 1;
  }

  // Get or create active conversation
  async getOrCreateActiveConversation(userId) {
    const existingConversation = this.getActiveConversation(userId);
    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversationId = `conv_${userId}_${this.conversationCounter++}`;
    const conversation = {
      id: conversationId,
      userId,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      messages: []
    };

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  // Get active conversation for user
  getActiveConversation(userId) {
    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.userId === userId && conversation.status === 'active') {
        return conversation;
      }
    }
    return null;
  }

  // Get conversation history
  async getConversationHistory(conversationId, limit = 10) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    return conversation.messages.slice(-limit).map(msg => ({
      id: msg.id,
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata
    }));
  }

  // Get user context
  async getUserContext(userId) {
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        userId,
        preferences: {},
        topics: {},
        interaction_patterns: {},
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    return this.userContexts.get(userId);
  }

  // Build context for response
  buildContextForResponse(conversationHistory, userContext) {
    const recentTopics = this.extractRecentTopics(conversationHistory);
    const conversationFlow = this.buildConversationFlow(conversationHistory);
    const userPreferences = userContext.preferences || {};

    return {
      recentTopics,
      conversationFlow,
      userPreferences,
      messageCount: conversationHistory.length,
      lastInteraction: conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].timestamp : null
    };
  }

  // Extract recent topics from conversation
  extractRecentTopics(conversationHistory) {
    const topics = [];
    const recentMessages = conversationHistory.slice(-5);
    
    for (const message of recentMessages) {
      if (message.metadata?.classification?.intent) {
        topics.push(message.metadata.classification.intent);
      }
    }
    
    return [...new Set(topics)];
  }

  // Build conversation flow
  buildConversationFlow(conversationHistory) {
    return conversationHistory.map(msg => ({
      type: msg.type,
      content: msg.content.substring(0, 100), // Truncate for context
      timestamp: msg.timestamp,
      intent: msg.metadata?.classification?.intent
    }));
  }

  // Add message to conversation
  async addMessage(conversationId, userId, messageType, content, metadata = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      conversationId,
      userId,
      type: messageType, // 'user_query' or 'ai_response'
      content,
      metadata,
      timestamp: new Date()
    };

    conversation.messages.push(message);
    conversation.updated_at = new Date();

    // Keep only last 50 messages per conversation
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50);
    }

    return message;
  }

  // Update user context
  async updateUserContext(userId, updates) {
    const userContext = await this.getUserContext(userId);
    
    // Merge updates
    if (updates.last_topics) {
      userContext.topics = { ...userContext.topics, ...updates.last_topics };
    }
    
    if (updates.interaction_patterns) {
      userContext.interaction_patterns = { ...userContext.interaction_patterns, ...updates.interaction_patterns };
    }
    
    userContext.updated_at = new Date();
    return userContext;
  }

  // Build conversation context
  async buildConversationContext(userId, query) {
    const userContext = await this.getUserContext(userId);
    const activeConversation = this.getActiveConversation(userId);
    
    let conversationHistory = [];
    if (activeConversation) {
      conversationHistory = await this.getConversationHistory(activeConversation.id, 5);
    }
    
    return this.buildContextForResponse(conversationHistory, userContext);
  }

  // Get conversation analytics
  getConversationAnalytics(userId) {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId);
    
    const totalConversations = userConversations.length;
    const totalMessages = userConversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
    
    return {
      userId,
      totalConversations,
      totalMessages,
      averageMessagesPerConversation,
      lastConversation: userConversations.length > 0 ? userConversations[userConversations.length - 1].updated_at : null
    };
  }

  // Get session info
  getSessionInfo(userId) {
    const activeConversation = this.getActiveConversation(userId);
    return {
      userId,
      hasActiveConversation: !!activeConversation,
      conversationId: activeConversation?.id,
      messageCount: activeConversation?.messages.length || 0,
      lastActivity: activeConversation?.updated_at
    };
  }

  // Export conversation data
  exportConversationData(userId) {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId);
    
    const userContext = this.userContexts.get(userId);
    
    return {
      userId,
      conversations: userConversations,
      context: userContext,
      exported_at: new Date()
    };
  }

  // Clear user conversations
  async clearUserConversations(userId) {
    // Mark conversations as inactive
    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.userId === userId) {
        conversation.status = 'inactive';
      }
    }
    
    // Clear user context
    this.userContexts.delete(userId);
    
    return true;
  }
}

export default new ConversationService();