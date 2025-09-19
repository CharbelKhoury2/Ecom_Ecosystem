/**
 * Report Builder Page - Advanced reporting interface
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table,
  Calendar,
  Filter,
  Settings,
  Play,
  Save,
  Share2,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV, exportToExcel, exportToPDF, ExportData, generateSummary, formatDataForExport } from '../utils/exportUtils';
import { apiClient } from '../utils/apiClient';
import { useNotificationHelpers } from '../components/NotificationSystem';
import DataVisualization from '../components/DataVisualization';

interface DataSource {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  columns: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'percentage';
    filterable?: boolean;
    sortable?: boolean;
  }[];
}

interface ReportConfig {
  title: string;
  dataSource: string;
  dateRange: {
    start: string;
    end: string;
    preset?: string;
  };
  filters: {
    column: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: any;
  }[];
  groupBy?: string;
  sortBy?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  chartType: 'table' | 'bar' | 'line' | 'pie' | 'area';
  includeCharts: boolean;
  includeSummary: boolean;
}

const ReportBuilder: React.FC = () => {
  const [dataSources] = useState<DataSource[]>([
    {
      id: 'orders',
      name: 'Orders',
      description: 'Sales orders and transactions',
      endpoint: '/api/shopify/orders',
      columns: [
        { key: 'id', label: 'Order ID', type: 'text', filterable: true },
        { key: 'date_created', label: 'Date', type: 'date', filterable: true, sortable: true },
        { key: 'total_price', label: 'Total', type: 'currency', filterable: true, sortable: true },
        { key: 'quantity', label: 'Items', type: 'number', filterable: true, sortable: true },
        { key: 'sku', label: 'SKU', type: 'text', filterable: true },
        { key: 'revenue', label: 'Revenue', type: 'currency', sortable: true }
      ]
    },
    {
      id: 'products',
      name: 'Products',
      description: 'Product inventory and performance',
      endpoint: '/api/shopify/products',
      columns: [
        { key: 'product_id', label: 'Product ID', type: 'text', filterable: true },
        { key: 'name', label: 'Product Name', type: 'text', filterable: true },
        { key: 'sku', label: 'SKU', type: 'text', filterable: true },
        { key: 'price', label: 'Price', type: 'currency', filterable: true, sortable: true },
        { key: 'stock_quantity', label: 'Stock', type: 'number', filterable: true, sortable: true },
        { key: 'cost_per_item', label: 'Cost', type: 'currency', sortable: true }
      ]
    },
    {
      id: 'campaigns',
      name: 'Marketing Campaigns',
      description: 'Meta Ads campaign performance',
      endpoint: '/api/meta/campaigns',
      columns: [
        { key: 'campaign_id', label: 'Campaign ID', type: 'text', filterable: true },
        { key: 'name', label: 'Campaign Name', type: 'text', filterable: true },
        { key: 'total_spend', label: 'Spend', type: 'currency', filterable: true, sortable: true },
        { key: 'revenue', label: 'Revenue', type: 'currency', sortable: true },
        { key: 'roas', label: 'ROAS', type: 'number', sortable: true },
        { key: 'impressions', label: 'Impressions', type: 'number', sortable: true },
        { key: 'clicks', label: 'Clicks', type: 'number', sortable: true },
        { key: 'ctr', label: 'CTR', type: 'percentage', sortable: true }
      ]
    },
    {
      id: 'alerts',
      name: 'Alerts',
      description: 'System alerts and notifications',
      endpoint: '/api/alerts/inventory',
      columns: [
        { key: 'id', label: 'Alert ID', type: 'text' },
        { key: 'type', label: 'Type', type: 'text', filterable: true },
        { key: 'severity', label: 'Severity', type: 'text', filterable: true },
        { key: 'message', label: 'Message', type: 'text', filterable: true },
        { key: 'created_at', label: 'Created', type: 'date', filterable: true, sortable: true },
        { key: 'status', label: 'Status', type: 'text', filterable: true }
      ]
    }
  ]);

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    title: 'New Report',
    dataSource: 'orders',
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
      preset: 'last_30_days'
    },
    filters: [],
    chartType: 'table',
    includeCharts: false,
    includeSummary: true
  });

  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { showSuccess, showError } = useNotificationHelpers();

  const datePresets = [
    { id: 'today', label: 'Today', start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
    { id: 'yesterday', label: 'Yesterday', start: format(subDays(new Date(), 1), 'yyyy-MM-dd'), end: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
    { id: 'last_7_days', label: 'Last 7 Days', start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
    { id: 'last_30_days', label: 'Last 30 Days', start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
    { id: 'this_month', label: 'This Month', start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
    { id: 'last_month', label: 'Last Month', start: format(startOfMonth(subDays(new Date(), 30)), 'yyyy-MM-dd'), end: format(endOfMonth(subDays(new Date(), 30)), 'yyyy-MM-dd') }
  ];

  const currentDataSource = dataSources.find(ds => ds.id === reportConfig.dataSource);

  const generateReport = async () => {
    if (!currentDataSource) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: reportConfig.dateRange.start,
        end_date: reportConfig.dateRange.end,
        workspace_id: 'test_workspace' // This should come from user context
      });

      // Add filters to params
      reportConfig.filters.forEach((filter, index) => {
        params.append(`filter_${index}`, JSON.stringify(filter));
      });

      const response = await apiClient.get(`${currentDataSource.endpoint}?${params.toString()}`);
      let data = response.data.data || response.data.orders || response.data.products || response.data.campaigns || response.data.alerts || [];

      // Apply client-side sorting if specified
      if (reportConfig.sortBy) {
        data.sort((a: any, b: any) => {
          const aVal = a[reportConfig.sortBy!.column];
          const bVal = b[reportConfig.sortBy!.column];
          const direction = reportConfig.sortBy!.direction === 'asc' ? 1 : -1;
          
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * direction;
          }
          return String(aVal).localeCompare(String(bVal)) * direction;
        });
      }

      setReportData(data);
      setShowPreview(true);
      showSuccess('Report Generated', 'Report data has been loaded successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Report Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!currentDataSource || !reportData.length) {
      showError('Export Error', 'No data to export. Please generate a report first.');
      return;
    }

    const formattedData = formatDataForExport(reportData, currentDataSource.columns);
    const summary = reportConfig.includeSummary ? generateSummary(reportData, currentDataSource.columns) : undefined;
    
    const exportData: ExportData = {
      title: reportConfig.title,
      data: formattedData,
      columns: currentDataSource.columns.map(col => ({ key: col.key, label: col.label })),
      summary,
      metadata: {
        generatedBy: 'Ecom Ecosystem Report Builder',
        dateRange: `${reportConfig.dateRange.start} to ${reportConfig.dateRange.end}`,
        filters: reportConfig.filters.map(f => `${f.column} ${f.operator} ${f.value}`)
      }
    };

    try {
      switch (format) {
        case 'csv':
          exportToCSV(exportData);
          break;
        case 'excel':
          exportToExcel(exportData);
          break;
        case 'pdf':
          exportToPDF(exportData);
          break;
      }
      showSuccess('Export Complete', `Report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Export Error', `Failed to export report as ${format.toUpperCase()}`);
    }
  };

  const addFilter = () => {
    if (!currentDataSource) return;
    
    const filterableColumns = currentDataSource.columns.filter(col => col.filterable);
    if (filterableColumns.length === 0) return;

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, {
        column: filterableColumns[0].key,
        operator: 'equals',
        value: ''
      }]
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const updateFilter = (index: number, field: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Report Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create custom reports and export data in multiple formats
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Report Configuration
              </h2>

              {/* Report Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportConfig.title}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter report title"
                />
              </div>

              {/* Data Source */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Source
                </label>
                <select
                  value={reportConfig.dataSource}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, dataSource: e.target.value, filters: [] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {dataSources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
                {currentDataSource && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentDataSource.description}
                  </p>
                )}
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {datePresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { start: preset.start, end: preset.end, preset: preset.id }
                      }))}
                      className={`px-3 py-2 text-xs rounded-md border ${
                        reportConfig.dateRange.preset === preset.id
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={reportConfig.dateRange.start}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value, preset: undefined }
                    }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={reportConfig.dateRange.end}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value, preset: undefined }
                    }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filters
                  </label>
                  <button
                    onClick={addFilter}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    + Add Filter
                  </button>
                </div>
                {reportConfig.filters.map((filter, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <select
                        value={filter.column}
                        onChange={(e) => updateFilter(index, 'column', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      >
                        {currentDataSource?.columns.filter(col => col.filterable).map(col => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Value"
                      />
                    </div>
                    <button
                      onClick={() => removeFilter(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                    >
                      Remove Filter
                    </button>
                  </div>
                ))}
              </div>

              {/* Chart Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visualization
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'table', label: 'Table', icon: Table },
                    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
                    { id: 'line', label: 'Line Chart', icon: LineChart },
                    { id: 'pie', label: 'Pie Chart', icon: PieChart }
                  ].map(chart => {
                    const Icon = chart.icon;
                    return (
                      <button
                        key={chart.id}
                        onClick={() => setReportConfig(prev => ({ ...prev, chartType: chart.id as any }))}
                        className={`flex items-center justify-center px-3 py-2 text-sm rounded-md border ${
                          reportConfig.chartType === chart.id
                            ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {chart.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeSummary}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, includeSummary: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Summary</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeCharts}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Charts in Export</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={generateReport}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Generate Report
                </button>

                {showPreview && reportData.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {showPreview ? reportConfig.title : 'Report Preview'}
                </h2>
                {showPreview && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {reportData.length} records
                  </div>
                )}
              </div>

              {!showPreview ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Report Generated
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Configure your report settings and click "Generate Report" to see the preview
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Data Visualization */}
                  {reportConfig.chartType !== 'table' && reportData.length > 0 && currentDataSource && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <DataVisualization
                        data={reportData}
                        type={reportConfig.chartType}
                        title={reportConfig.title}
                        xKey={currentDataSource.columns.find(col => col.type === 'date')?.key || currentDataSource.columns[0].key}
                        yKey={currentDataSource.columns.find(col => col.type === 'currency' || col.type === 'number')?.key || currentDataSource.columns[1].key}
                      />
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {currentDataSource?.columns.slice(0, 6).map(column => (
                            <th
                              key={column.key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {reportData.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            {currentDataSource?.columns.slice(0, 6).map(column => (
                              <td
                                key={column.key}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                              >
                                {column.type === 'currency' && typeof row[column.key] === 'number'
                                  ? `$${row[column.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                  : column.type === 'date' && row[column.key]
                                  ? format(new Date(row[column.key]), 'MMM d, yyyy')
                                  : row[column.key] || '-'
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.length > 10 && (
                      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                        Showing first 10 of {reportData.length} records. Export to see all data.
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {reportConfig.includeSummary && currentDataSource && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {generateSummary(reportData, currentDataSource.columns).map((item, index) => (
                          <div key={index} className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {item.value}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;