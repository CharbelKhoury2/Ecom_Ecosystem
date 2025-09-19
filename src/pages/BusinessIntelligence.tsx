/**
 * Business Intelligence Page
 * Comprehensive analytics dashboard with cohort analysis, RFM analysis, and market insights
 */

import React from 'react';
import BusinessIntelligenceWidgets from '../components/BusinessIntelligenceWidgets';
import AdvancedAnalyticsDashboard from '../components/AdvancedAnalyticsDashboard';
import { Brain, TrendingUp, Users, Target } from 'lucide-react';

const BusinessIntelligence: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
              <p className="text-gray-600 mt-1">
                Advanced analytics, customer insights, and predictive modeling for data-driven decisions
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Predictive Accuracy</p>
                  <p className="text-lg font-semibold text-gray-900">87.3%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Customer Segments</p>
                  <p className="text-lg font-semibold text-gray-900">11</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">ML Models Active</p>
                  <p className="text-lg font-semibold text-gray-900">8</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Brain className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">AI Insights</p>
                  <p className="text-lg font-semibold text-gray-900">24</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
                Customer Analytics
              </button>
              <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Predictive Models
              </button>
              <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Market Analysis
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Business Intelligence Widgets */}
          <BusinessIntelligenceWidgets />
          
          {/* Advanced Analytics Dashboard */}
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics &amp; ML Insights</h2>
              <p className="text-gray-600 mt-1">
                Machine learning powered analytics with anomaly detection and forecasting
              </p>
            </div>
            <AdvancedAnalyticsDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;