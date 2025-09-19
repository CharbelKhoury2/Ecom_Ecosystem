/**
 * Custom Dashboard Page - Customizable dashboard with widgets
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Save,
  RotateCcw,
  Grid,
  Eye,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import DashboardWidget, { WidgetConfig, WidgetData } from '../components/DashboardWidget';
import WidgetConfigModal from '../components/WidgetConfigModal';
import { useNotificationHelpers } from '../components/NotificationSystem';
import { apiClient } from '../utils/apiClient';

interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  gridCols: number;
  gridRows: number;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

const CustomDashboard: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, WidgetData>>({});
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | undefined>();
  const [dashboardLayouts, setDashboardLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { showSuccess, showError } = useNotificationHelpers();

  // Sample widget configurations
  const defaultWidgets: WidgetConfig[] = [
    {
      id: 'revenue_widget',
      title: 'Total Revenue',
      type: 'kpi',
      size: 'medium',
      dataSource: 'revenue',
      position: { x: 0, y: 0 },
      refreshInterval: 5,
      settings: {
        showTrend: true,
        showPercentage: true,
        colorScheme: 'green',
        dateRange: 'last_30_days'
      }
    },
    {
      id: 'orders_widget',
      title: 'Orders Overview',
      type: 'chart',
      size: 'large',
      dataSource: 'orders',
      chartType: 'bar',
      position: { x: 2, y: 0 },
      refreshInterval: 5,
      settings: {
        colorScheme: 'blue',
        dateRange: 'last_30_days'
      }
    },
    {
      id: 'products_widget',
      title: 'Top Products',
      type: 'table',
      size: 'medium',
      dataSource: 'products',
      position: { x: 0, y: 1 },
      refreshInterval: 15,
      settings: {
        colorScheme: 'purple',
        dateRange: 'last_7_days'
      }
    },
    {
      id: 'alerts_widget',
      title: 'Recent Alerts',
      type: 'kpi',
      size: 'small',
      dataSource: 'alerts',
      position: { x: 2, y: 2 },
      refreshInterval: 1,
      settings: {
        showTrend: false,
        showPercentage: false,
        colorScheme: 'red',
        dateRange: 'last_7_days'
      }
    }
  ];

  useEffect(() => {
    loadDashboardLayouts();
    loadWidgetData();
  }, []);

  useEffect(() => {
    if (widgets.length > 0) {
      loadWidgetData();
    }
  }, [widgets]);

  const loadDashboardLayouts = async () => {
    try {
      // In a real app, this would fetch from API
      const layouts: DashboardLayout[] = [
        {
          id: 'default',
          name: 'Default Dashboard',
          description: 'Standard business overview dashboard',
          widgets: defaultWidgets,
          gridCols: 4,
          gridRows: 3,
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setDashboardLayouts(layouts);
      setCurrentLayout(layouts[0]);
      setWidgets(layouts[0].widgets);
    } catch (error) {
      console.error('Error loading dashboard layouts:', error);
      showError('Load Error', 'Failed to load dashboard layouts');
    }
  };

  const loadWidgetData = async () => {
    setIsLoading(true);
    try {
      const data: Record<string, WidgetData> = {};
      
      // Generate sample data for each widget
      for (const widget of widgets) {
        switch (widget.dataSource) {
          case 'revenue':
            data[widget.id] = {
              value: 125430.50,
              previousValue: 118200.30,
              trend: 'up',
              percentage: 6.1,
              lastUpdated: new Date().toISOString()
            };
            break;
            
          case 'orders':
            data[widget.id] = {
              data: [
                { name: 'Mon', value: 45 },
                { name: 'Tue', value: 52 },
                { name: 'Wed', value: 38 },
                { name: 'Thu', value: 61 },
                { name: 'Fri', value: 73 },
                { name: 'Sat', value: 89 },
                { name: 'Sun', value: 67 }
              ],
              lastUpdated: new Date().toISOString()
            };
            break;
            
          case 'products':
            data[widget.id] = {
              data: [
                { name: 'Product A', sales: 1250, revenue: 25000 },
                { name: 'Product B', sales: 980, revenue: 19600 },
                { name: 'Product C', sales: 750, revenue: 15000 },
                { name: 'Product D', sales: 620, revenue: 12400 },
                { name: 'Product E', sales: 450, revenue: 9000 }
              ],
              lastUpdated: new Date().toISOString()
            };
            break;
            
          case 'alerts':
            data[widget.id] = {
              value: 3,
              trend: 'down',
              percentage: -25,
              lastUpdated: new Date().toISOString()
            };
            break;
            
          case 'customers':
            data[widget.id] = {
              value: 2847,
              previousValue: 2650,
              trend: 'up',
              percentage: 7.4,
              lastUpdated: new Date().toISOString()
            };
            break;
            
          default:
            data[widget.id] = {
              value: 0,
              lastUpdated: new Date().toISOString()
            };
        }
      }
      
      setWidgetData(data);
    } catch (error) {
      console.error('Error loading widget data:', error);
      showError('Data Error', 'Failed to load widget data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWidget = () => {
    setEditingWidget(undefined);
    setIsConfigModalOpen(true);
  };

  const handleEditWidget = (config: WidgetConfig) => {
    setEditingWidget(config);
    setIsConfigModalOpen(true);
  };

  const handleSaveWidget = (config: WidgetConfig) => {
    if (editingWidget) {
      // Update existing widget
      setWidgets(prev => prev.map(w => w.id === config.id ? config : w));
      showSuccess('Widget Updated', 'Widget configuration has been updated');
    } else {
      // Add new widget
      setWidgets(prev => [...prev, config]);
      showSuccess('Widget Added', 'New widget has been added to the dashboard');
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setWidgetData(prev => {
      const newData = { ...prev };
      delete newData[widgetId];
      return newData;
    });
    showSuccess('Widget Deleted', 'Widget has been removed from the dashboard');
  };

  const handleRefreshWidget = async (widgetId: string) => {
    try {
      // In a real app, this would fetch fresh data for the specific widget
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update the lastUpdated timestamp
      setWidgetData(prev => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          lastUpdated: new Date().toISOString()
        }
      }));
      
      showSuccess('Widget Refreshed', 'Widget data has been updated');
    } catch (error) {
      showError('Refresh Error', 'Failed to refresh widget data');
    }
  };

  const handleSaveDashboard = async () => {
    try {
      if (!currentLayout) return;
      
      const updatedLayout: DashboardLayout = {
        ...currentLayout,
        widgets,
        updatedAt: new Date().toISOString()
      };
      
      // In a real app, this would save to API
      setCurrentLayout(updatedLayout);
      setDashboardLayouts(prev => prev.map(layout => 
        layout.id === updatedLayout.id ? updatedLayout : layout
      ));
      
      showSuccess('Dashboard Saved', 'Dashboard layout has been saved successfully');
      setIsEditing(false);
    } catch (error) {
      showError('Save Error', 'Failed to save dashboard layout');
    }
  };

  const handleResetDashboard = () => {
    if (currentLayout) {
      setWidgets(currentLayout.widgets);
      showSuccess('Dashboard Reset', 'Dashboard has been reset to saved state');
      setIsEditing(false);
    }
  };

  const exportDashboard = () => {
    const dashboardConfig = {
      layout: currentLayout,
      widgets,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dashboardConfig, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${currentLayout?.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Dashboard Exported', 'Dashboard configuration has been downloaded');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {currentLayout?.name || 'Custom Dashboard'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentLayout?.description || 'Customize your dashboard with widgets'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Dashboard
                  </button>
                  <button
                    onClick={exportDashboard}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleAddWidget}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </button>
                  <button
                    onClick={handleSaveDashboard}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleResetDashboard}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        {widgets.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Widgets Added
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start building your dashboard by adding widgets
            </p>
            <button
              onClick={handleAddWidget}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 auto-rows-fr">
            {widgets.map(widget => (
              <DashboardWidget
                key={widget.id}
                config={widget}
                data={widgetData[widget.id] || {}}
                isEditing={isEditing}
                onEdit={handleEditWidget}
                onDelete={handleDeleteWidget}
                onRefresh={handleRefreshWidget}
              />
            ))}
            
            {/* Add Widget Placeholder (only in edit mode) */}
            {isEditing && (
              <div className="col-span-1 row-span-1">
                <button
                  onClick={handleAddWidget}
                  className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Add Widget</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">Loading widget data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Widget Configuration Modal */}
      <WidgetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveWidget}
        initialConfig={editingWidget}
      />
    </div>
  );
};

export default CustomDashboard;