/**
 * Enhanced AI Copilot with improved context awareness and response quality
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Copy, Trash2, Clock, Lightbulb, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useErrorHandler, DataError } from '../utils/errorHandling';
import { apiClient } from '../utils/apiClient';
import { useNotificationHelpers } from './NotificationSystem';

interface CopilotContext {
  recentMetrics?: {
    revenue: number;
    orders: number;
    topProducts: string[];
    alerts: number;
  };
  timeframe?: string;
  lastSync?: string;
}

interface CopilotSuggestion {
  id: string;
  text: string;
  category: 'analysis' | 'action' | 'insight';
  priority: 'low' | 'medium' | 'high';
}

interface EnhancedCopilotProps {
  userId?: string;
  context?: CopilotContext;
  onActionRequested?: (action: string, params?: any) => void;
}

const EnhancedCopilot: React.FC<EnhancedCopilotProps> = ({ 
  userId, 
  context, 
  onActionRequested 
}) => {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { handleError } = useErrorHandler();
  const { showSuccess, showError } = useNotificationHelpers();

  // Enhanced quick actions with context awareness
  const getContextualQuickActions = useCallback(() => {
    const baseActions = [
      "What was my profit yesterday?",
      "Which SKU is running out of stock?",
      "Show me my best performing products",
      "How many orders did I get this week?"
    ];

    const contextualActions = [];
    
    if (context?.recentMetrics?.alerts && context.recentMetrics.alerts > 0) {
      contextualActions.push(`I have ${context.recentMetrics.alerts} alerts - what should I do?`);
    }
    
    if (context?.recentMetrics?.revenue) {
      contextualActions.push("Analyze my revenue trends and suggest improvements");
    }
    
    if (context?.lastSync) {
      const syncDate = new Date(context.lastSync);
      const hoursSinceSync = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync > 24) {
        contextualActions.push("My data seems outdated - should I sync?");
      }
    }

    return [...contextualActions, ...baseActions].slice(0, 6);
  }, [context]);

  const [quickActions, setQuickActions] = useState<string[]>([]);

  useEffect(() => {
    setQuickActions(getContextualQuickActions());
  }, [getContextualQuickActions]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate contextual suggestions based on conversation
  const generateSuggestions = useCallback((lastMessage: string, response: string) => {
    const newSuggestions: CopilotSuggestion[] = [];
    
    // Analyze response for actionable insights
    if (response.includes('low stock') || response.includes('out of stock')) {
      newSuggestions.push({
        id: 'restock',
        text: 'Set up automatic restock alerts',
        category: 'action',
        priority: 'high'
      });
    }
    
    if (response.includes('underperforming') || response.includes('low ROAS')) {
      newSuggestions.push({
        id: 'optimize',
        text: 'Optimize underperforming campaigns',
        category: 'action',
        priority: 'medium'
      });
    }
    
    if (response.includes('profit') || response.includes('revenue')) {
      newSuggestions.push({
        id: 'analyze',
        text: 'Deep dive into profit margins',
        category: 'analysis',
        priority: 'medium'
      });
    }
    
    // Add general suggestions
    newSuggestions.push({
      id: 'export',
      text: 'Export this data for further analysis',
      category: 'action',
      priority: 'low'
    });
    
    setSuggestions(newSuggestions.slice(0, 3));
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading || !user?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Enhanced query with context
      const queryPayload = {
        workspace_id: userId || user.id,
        user_query: message,
        conversation_context: {
          previous_messages: messages.slice(-5), // Last 5 messages for context
          current_context: context,
          user_preferences: conversationContext
        },
        enhanced_features: {
          include_suggestions: true,
          include_actions: true,
          context_aware: true
        }
      };

      const response = await apiClient.post('/api/copilot/query', queryPayload, {
        timeout: 45000, // Longer timeout for AI responses
        retries: 2,
        validateResponse: (data: any) => data && typeof data.llm_response === 'string'
      });
      
      if (!response.data.llm_response) {
        throw new DataError('Invalid response from AI service');
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.data.llm_response,
        timestamp: new Date(),
        metadata: {
          tokens_used: response.data.tokens_used,
          context_used: response.data.context,
          suggestions: response.data.recommendations
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation context
      setConversationContext(prev => ({
        ...prev,
        last_query_type: response.data.context?.query_type,
        user_interests: [...(prev.user_interests || []), message.toLowerCase()]
      }));
      
      // Generate contextual suggestions
      generateSuggestions(message, response.data.llm_response);
      
      // Show success for complex queries
      if (response.data.tokens_used > 1000) {
        showSuccess('Analysis Complete', 'Generated detailed insights from your data');
      }
      
    } catch (error) {
      await handleError(error as Error, {
        component: 'EnhancedCopilot',
        action: 'sendMessage',
        userId: user.id,
        metadata: { message: message.substring(0, 100) }
      }, {
        retry: () => handleSendMessage(message),
        fallback: () => {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: 'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or check your connection.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: CopilotSuggestion) => {
    if (suggestion.category === 'action' && onActionRequested) {
      onActionRequested(suggestion.id, { suggestion });
    } else {
      handleSendMessage(`Help me ${suggestion.text.toLowerCase()}`);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    showSuccess('Copied', 'Message copied to clipboard');
  };

  const clearHistory = () => {
    setMessages([]);
    setSuggestions([]);
    setConversationContext({});
    showSuccess('Cleared', 'Conversation history cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="h-6 w-6 text-blue-600" />
              {isTyping && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Copilot</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {context?.lastSync ? `Last sync: ${format(new Date(context.lastSync), 'MMM d, h:mm a')}` : 'Ready to help'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {context?.recentMetrics?.alerts && context.recentMetrics.alerts > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{context.recentMetrics.alerts} alerts</span>
              </div>
            )}
            
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ask me anything about your store performance
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              I can analyze your revenue, inventory, sales trends, and provide actionable insights based on your data
            </p>
            
            {/* Contextual Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(action)}
                  className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div className="flex items-start space-x-3">
                {message.type === 'ai' && (
                  <div className="flex-shrink-0">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div
                    className={`rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {message.metadata?.tokens_used && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Analysis depth: {message.metadata.tokens_used > 1000 ? 'Deep' : 'Standard'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(message.timestamp, 'h:mm a')}
                    </div>
                    
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center transition-colors"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Suggestions</span>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion.text}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {suggestion.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <Bot className="h-6 w-6 text-blue-600" />
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your store performance, inventory, or get business insights..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {context?.recentMetrics && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Context: {context.recentMetrics.revenue ? `$${context.recentMetrics.revenue.toLocaleString()} revenue` : ''}
            {context.recentMetrics.orders ? ` • ${context.recentMetrics.orders} orders` : ''}
            {context.recentMetrics.alerts ? ` • ${context.recentMetrics.alerts} alerts` : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCopilot;