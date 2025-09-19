/**
 * Reports Page - Main reporting dashboard and navigation
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Plus,
  Clock,
  Share2,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { useNotificationHelpers } from '../components/NotificationSystem';
import { apiClient } from '../utils/apiClient';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'inventory' | 'marketing' | 'alerts';
  icon: React.ComponentType<any>;
  dataSource: string;
  defaultFilters: any[];
  chartType: string;
  lastGenerated?: string;
  isCustom?: boolean;
}

interface SavedReport {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  lastAccessed: string;
  size: string;
  format: 'csv' | 'excel' | 'pdf';
}

const Reports: React.FC = () => {
  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: 'sales_summary',
      name: 'Sales Summary',
      description: 'Overview of sales performance, revenue, and order metrics',
      category: 'sales',
      icon: TrendingUp,
      dataSource: 'orders',
      defaultFilters: [],
      chartType: 'bar'
    },
    {
      id: 'inventory_report',
      name: 'Inventory Report',
      description: 'Stock levels, low inventory alerts, and product performance',
      category: 'inventory',
      icon: Package,
      dataSource: 'products',
      defaultFilters: [],
      chartType: 'table'
    },
    {
      id: 'campaign_performance',
      name: 'Campaign Performance',
      description: 'Meta Ads campaign metrics, ROAS, and spending analysis',
      category: 'marketing',
      icon: BarChart3,
      dataSource: 'campaigns',
      defaultFilters: [],
      chartType: 'line'
    },
    {
      id: 'order_analysis',
      name: 'Order Analysis',
      description: 'Detailed order breakdown, customer insights, and trends',
      category: 'sales',
      icon: ShoppingCart,
      dataSource: 'orders',
      defaultFilters: [],
      chartType: 'pie'
    },
    {
      id: 'alert_summary',
      name: 'Alert Summary',
      description: 'System alerts, inventory warnings, and notification history',
      category: 'alerts',
      icon: AlertTriangle,
      dataSource: 'alerts',
      defaultFilters: [],
      chartType: 'table'
    }
  ]);

  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    {
      id: '1',
      name: 'Q4 Sales Report',
      template: 'sales_summary',
      createdAt: '2024-01-15',
      lastAccessed: '2024-01-20',
      size: '2.3 MB',
      format: 'excel'
    },
    {
      id: '2',
      name: 'Low Stock Alert',
      template: 'inventory_report',
      createdAt: '2024-01-18',
      lastAccessed: '2024-01-19',
      size: '1.1 MB',
      format: 'pdf'
    },
    {
      id: '3',
      name: 'Campaign ROI Analysis',
      template: 'campaign_performance',
      createdAt: '2024-01-20',
      lastAccessed: '2024-01-20',
      size: '856 KB',
      format: 'csv'
    }
  ]);

  const [quickStats, setQuickStats] = useState({
    totalReports: 0,
    reportsThisMonth: 0,
    lastGenerated: '',
    popularTemplate: ''
  });

  const { showSuccess, showError } = useNotificationHelpers();

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      // In a real app, this would fetch from an API
      setQuickStats({
        totalReports: savedReports.length,
        reportsThisMonth: savedReports.filter(report => 
          new Date(report.createdAt) >= subDays(new Date(), 30)
        ).length,
        lastGenerated: savedReports.length > 0 ? savedReports[0].createdAt : '',
        popularTemplate: 'Sales Summary'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const generateQuickReport = async (template: ReportTemplate) => {
    try {
      showSuccess('Generating Report', `Creating ${template.name} report...`);
      // In a real app, this would trigger report generation
      setTimeout(() => {
        showSuccess('Report Ready', `${template.name} has been generated successfully`);
      }, 2000);
    } catch (error) {
      showError('Generation Failed', 'Failed to generate report. Please try again.');
    }
  };

  const deleteReport = (reportId: string) => {
    setSavedReports(prev => prev.filter(report => report.id !== reportId));
    showSuccess('Report Deleted', 'Report has been removed successfully');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inventory': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'marketing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'alerts': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel': return '📊';
      case 'pdf': return '📄';
      case 'csv': return '📋';
      default: return '📁';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reports & Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate insights, export data, and track business performance
              </p>
            </div>
            <Link
              to="/report-builder"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Custom Report
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.totalReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.reportsThisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Generated</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {quickStats.lastGenerated ? format(new Date(quickStats.lastGenerated), 'MMM d, yyyy') : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Most Popular</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{quickStats.popularTemplate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report Templates
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Pre-built reports for common business insights
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reportTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => generateQuickReport(template)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Generate
                        </button>
                        <Link
                          to={`/report-builder?template=${template.id}`}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Customize
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Saved Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Reports
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your generated and saved reports
              </p>
            </div>
            <div className="p-6">
              {savedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Reports Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Generate your first report to see it here
                  </p>
                  <Link
                    to="/report-builder"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedReports.map(report => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getFormatIcon(report.format)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.name}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>Created: {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                            <span>Size: {report.size}</span>
                            <span className="capitalize">{report.format}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="View Report"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="Download Report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="Share Report"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/report-builder"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Custom Report Builder
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create advanced custom reports
                  </p>
                </div>
              </Link>

              <button
                onClick={() => showSuccess('Feature Coming Soon', 'Scheduled reports will be available soon')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Clock className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Schedule Reports
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automate report generation
                  </p>
                </div>
              </button>

              <button
                onClick={() => showSuccess('Feature Coming Soon', 'Report sharing will be available soon')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-8 w-8 text-purple-600 mr-4" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Share & Collaborate
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share reports with team members
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;