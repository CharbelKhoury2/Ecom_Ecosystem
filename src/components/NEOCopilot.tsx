/**
 * Enhanced NEO AI Copilot with Proactive Insights
 * Provides intelligent business assistance with automated reports and natural language processing
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  FileText,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Download,
  Calendar,
  Brain,
  Zap,
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import enhancedAIService, {
  AIInsight,
  ProactiveAlert,
  AutomatedReport
} from '../services/enhancedAIService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  data?: any;
  insights?: AIInsight[];
  reports?: AutomatedReport[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'analytics' | 'reports' | 'insights' | 'recommendations';
}

const NEOCopilot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [reports, setReports] = useState<AutomatedReport[]>([]);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'insights' | 'alerts' | 'reports'>('chat');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initializeNEO();
    setupSpeechRecognition();
    
    // Load proactive insights every 5 minutes
    const interval = setInterval(loadProactiveInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeNEO = async () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: 'Hello! I\'m NEO, your AI-powered business copilot. I can help you with analytics, generate reports, provide insights, and answer questions about your business. How can I assist you today?',
      timestamp: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
    await loadProactiveInsights();
  };

  const loadProactiveInsights = async () => {
    try {
      // Mock data - replace with actual data fetching
      const mockData = generateMockBusinessData();
      const aiResults = await enhancedAIService.generateAIInsights(mockData);
      
      setInsights(aiResults.insights);
      setAlerts(aiResults.alerts);
      
      // Generate proactive message if there are critical alerts
      const criticalAlerts = aiResults.alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        const proactiveMessage: ChatMessage = {
          id: `proactive-${Date.now()}`,
          type: 'system',
          content: `🚨 I've detected ${criticalAlerts.length} critical alert(s) that need your immediate attention. Would you like me to provide details and recommendations?`,
          timestamp: new Date().toISOString(),
          data: criticalAlerts
        };
        
        setMessages(prev => [...prev, proactiveMessage]);
      }
    } catch (error) {
      console.error('Error loading proactive insights:', error);
    }
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  };

  const generateMockBusinessData = () => {
    // Mock data generation - replace with actual data
    const salesData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      salesData.push({
        date: date.toISOString().split('T')[0],
        revenue: 5000 + Math.random() * 3000,
        orders: 40 + Math.random() * 20
      });
    }
    
    return {
      salesData,
      productData: [
        { sku: 'PROD001', name: 'Premium Widget', revenue: 25000, margin: 0.45, sales: 150, cost: 50, currentStock: 25, historicalSales: [{ date: '2024-01-01', quantity: 10 }] },
        { sku: 'PROD002', name: 'Standard Widget', revenue: 18000, margin: 0.35, sales: 200, cost: 40, currentStock: 15, historicalSales: [{ date: '2024-01-01', quantity: 15 }] }
      ],
      customerData: [
        { customerId: 'CUST001', totalSpent: 5000, orderCount: 12, lastOrder: '2024-01-15' },
        { customerId: 'CUST002', totalSpent: 3200, orderCount: 8, lastOrder: '2024-01-14' }
      ],
      marketingData: [
        { id: 'CAMP001', name: 'Google Ads', spend: 5000, revenue: 15000, clicks: 1000, impressions: 10000, conversions: 100, isActive: true }
      ],
      orderData: [
        { orderId: 'ORD001', customerId: 'CUST001', items: [{ sku: 'PROD001', name: 'Premium Widget', quantity: 2 }] }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await processNaturalLanguageQuery(inputValue);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        data: response.data,
        insights: response.insights,
        reports: response.reports
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processNaturalLanguageQuery = async (query: string): Promise<{
    content: string;
    data?: any;
    insights?: AIInsight[];
    reports?: AutomatedReport[];
  }> => {
    const lowerQuery = query.toLowerCase();
    const mockData = generateMockBusinessData();
    
    // Sales-related queries
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      const totalRevenue = mockData.salesData.reduce((sum, d) => sum + d.revenue, 0);
      const totalOrders = mockData.salesData.reduce((sum, d) => sum + d.orders, 0);
      const avgOrderValue = totalRevenue / totalOrders;
      
      return {
        content: `Here's your sales overview: Total revenue: $${totalRevenue.toLocaleString()}, Total orders: ${totalOrders.toLocaleString()}, Average order value: $${avgOrderValue.toFixed(2)}. Based on AI analysis, I predict a ${Math.random() > 0.5 ? 'positive' : 'negative'} trend for the next week.`,
        data: mockData.salesData
      };
    }
    
    // Inventory-related queries
    if (lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
      const lowStockProducts = mockData.productData.filter(p => p.currentStock < 20);
      return {
        content: `Inventory status: ${lowStockProducts.length} products have low stock levels. ${lowStockProducts.map(p => p.name).join(', ')} need immediate attention. I recommend placing orders within the next 3-5 days to avoid stockouts.`,
        data: lowStockProducts
      };
    }
    
    // Report generation queries
    if (lowerQuery.includes('report') || lowerQuery.includes('generate')) {
      const reportType = lowerQuery.includes('daily') ? 'daily' : lowerQuery.includes('weekly') ? 'weekly' : 'monthly';
      const report = await enhancedAIService.generateAutomatedReport(reportType as any, mockData);
      
      return {
        content: `I've generated a comprehensive ${reportType} business report for you. The report includes sales performance, key insights, and actionable recommendations. Key findings: ${report.keyFindings.join(', ')}.`,
        reports: [report]
      };
    }
    
    // Insights and recommendations
    if (lowerQuery.includes('insight') || lowerQuery.includes('recommend')) {
      const aiResults = await enhancedAIService.generateAIInsights(mockData);
      const topInsights = aiResults.insights.slice(0, 3);
      
      return {
        content: `Based on AI analysis, here are the top insights: ${topInsights.map(i => i.title).join(', ')}. I've identified ${aiResults.recommendations.restock.length} restocking opportunities and ${aiResults.recommendations.marketing.length} marketing optimizations.`,
        insights: topInsights
      };
    }
    
    // Customer analysis
    if (lowerQuery.includes('customer') || lowerQuery.includes('clv')) {
      const totalCustomers = mockData.customerData.length;
      const avgSpent = mockData.customerData.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers;
      
      return {
        content: `Customer analysis: ${totalCustomers} total customers with an average lifetime value of $${avgSpent.toFixed(2)}. AI predicts ${Math.floor(totalCustomers * 0.15)} customers are at risk of churning and need retention campaigns.`,
        data: mockData.customerData
      };
    }
    
    // Default response with general insights
    const aiResults = await enhancedAIService.generateAIInsights(mockData);
    return {
      content: `I can help you with various business insights. Currently, I've detected ${aiResults.insights.length} actionable insights and ${aiResults.alerts.length} alerts. You can ask me about sales performance, inventory management, customer analysis, or request automated reports. What would you like to explore?`,
      insights: aiResults.insights.slice(0, 2)
    };
  };

  const generateAutomatedReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    setIsLoading(true);
    try {
      const mockData = generateMockBusinessData();
      const report = await enhancedAIService.generateAutomatedReport(type, mockData);
      setReports(prev => [report, ...prev]);
      
      const reportMessage: ChatMessage = {
        id: `report-${Date.now()}`,
        type: 'assistant',
        content: `I've generated your ${type} business report. The report includes comprehensive analytics, key findings, and actionable recommendations.`,
        timestamp: new Date().toISOString(),
        reports: [report]
      };
      
      setMessages(prev => [...prev, reportMessage]);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const quickActions: QuickAction[] = [
    {
      id: 'sales-analysis',
      label: 'Sales Analysis',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => setInputValue('Show me sales analysis'),
      category: 'analytics'
    },
    {
      id: 'inventory-check',
      label: 'Inventory Status',
      icon: <Package className="w-4 h-4" />,
      action: () => setInputValue('Check inventory levels'),
      category: 'analytics'
    },
    {
      id: 'daily-report',
      label: 'Daily Report',
      icon: <FileText className="w-4 h-4" />,
      action: () => generateAutomatedReport('daily'),
      category: 'reports'
    },
    {
      id: 'customer-insights',
      label: 'Customer Insights',
      icon: <Users className="w-4 h-4" />,
      action: () => setInputValue('Analyze customer behavior'),
      category: 'insights'
    }
  ];

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'predictive': return <Brain className="w-5 h-5 text-purple-500" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'opportunity': return <Target className="w-5 h-5 text-green-500" />;
      default: return <BarChart3 className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
      isExpanded ? 'w-96 h-[600px]' : 'w-80 h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">NEO AI Copilot</h3>
            <p className="text-xs opacity-90">Your Business Intelligence Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'chat', label: 'Chat', icon: <Bot className="w-4 h-4" /> },
          { id: 'insights', label: 'Insights', icon: <Lightbulb className="w-4 h-4" />, count: insights.length },
          { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" />, count: alerts.length },
          { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" />, count: reports.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm font-medium transition-colors ${
              selectedTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.insights.map(insight => (
                          <div key={insight.id} className="text-xs bg-white/20 rounded p-2">
                            <div className="flex items-center space-x-1">
                              {getInsightIcon(insight.type)}
                              <span className="font-medium">{insight.title}</span>
                            </div>
                            <p className="mt-1">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.reports && message.reports.length > 0 && (
                      <div className="mt-2">
                        {message.reports.map(report => (
                          <div key={report.id} className="text-xs bg-white/20 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{report.title}</span>
                              <Download className="w-3 h-3" />
                            </div>
                            <p className="mt-1">Generated: {format(new Date(report.generatedAt), 'MMM dd, HH:mm')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-2 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-1">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-center space-x-1 p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your business..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'insights' && (
          <div className="p-4 space-y-3 h-full overflow-y-auto">
            {insights.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No insights available</p>
              </div>
            ) : (
              insights.map(insight => (
                <div key={insight.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start space-x-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {insight.impact} impact
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className="p-4 space-y-3 h-full overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No alerts at this time</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`rounded-lg p-3 border ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{alert.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Suggested Actions:</p>
                          <ul className="text-xs text-gray-600 mt-1 space-y-1">
                            {alert.suggestedActions.slice(0, 2).map((action, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'reports' && (
          <div className="p-4 space-y-3 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Automated Reports</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => generateAutomatedReport('daily')}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Daily
                </button>
                <button
                  onClick={() => generateAutomatedReport('weekly')}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                >
                  Weekly
                </button>
                <button
                  onClick={() => generateAutomatedReport('monthly')}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                >
                  Monthly
                </button>
              </div>
            </div>
            
            {reports.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-xs mt-1">Click the buttons above to generate reports</p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{report.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Generated: {format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Key Findings:</p>
                        <ul className="text-xs text-gray-600 mt-1 space-y-1">
                          {report.keyFindings.slice(0, 2).map((finding, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-1">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NEOCopilot;