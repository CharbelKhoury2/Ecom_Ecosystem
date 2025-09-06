/**
 * Export utility for reports and data
 * Supports CSV, JSON, and Excel formats
 */

import { performanceMonitor } from './performance';

export type ExportFormat = 'csv' | 'json' | 'excel';

export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportableData {
  [key: string]: string | number | Date | boolean | null | undefined;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: ExportableData[], options: ExportOptions): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent: string[] = [];

  // Add headers if requested
  if (options.includeHeaders !== false) {
    csvContent.push(headers.map(header => `"${header}"`).join(','));
  }

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      if (value instanceof Date) return `"${value.toISOString()}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    });
    csvContent.push(values.join(','));
  });

  return csvContent.join('\n');
}

/**
 * Convert data to JSON format
 */
export function convertToJSON(data: ExportableData[], options: ExportOptions): string {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      format: 'json',
      recordCount: data.length,
      dateRange: options.dateRange,
    },
    data,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download file to user's device
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(baseName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${baseName}_${timestamp}.${format}`;
}

/**
 * Main export function
 */
export async function exportData(
  data: ExportableData[],
  options: ExportOptions
): Promise<void> {
  const startTime = performance.now();
  
  try {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    switch (options.format) {
      case 'csv':
        content = convertToCSV(data, options);
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
        break;
      
      case 'json':
        content = convertToJSON(data, options);
        mimeType = 'application/json;charset=utf-8;';
        fileExtension = 'json';
        break;
      
      case 'excel':
        // For Excel, we'll use CSV format with Excel-compatible encoding
        content = '\uFEFF' + convertToCSV(data, options); // BOM for Excel
        mimeType = 'application/vnd.ms-excel;charset=utf-8;';
        fileExtension = 'csv';
        break;
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    const filename = options.filename || generateFilename('export', fileExtension as ExportFormat);
    downloadFile(content, filename, mimeType);

    // Track export performance
    const endTime = performance.now();
    performanceMonitor.recordMetric('export-data', endTime - startTime, {
      format: options.format,
      recordCount: data.length,
      fileSize: content.length,
    });

    // Track user interaction
    performanceMonitor.trackInteraction('data-export', {
      format: options.format,
      recordCount: data.length,
    });

  } catch (error) {
    const endTime = performance.now();
    performanceMonitor.recordMetric('export-data', endTime - startTime, {
      format: options.format,
      recordCount: data.length,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Export dashboard data
 */
export async function exportDashboardData(
  orders: ExportableData[],
  campaigns: ExportableData[],
  products: ExportableData[],
  format: ExportFormat = 'csv'
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  // Export each dataset separately
  await Promise.all([
    exportData(orders, {
      format,
      filename: `orders_${timestamp}.${format}`,
      includeHeaders: true,
    }),
    exportData(campaigns, {
      format,
      filename: `campaigns_${timestamp}.${format}`,
      includeHeaders: true,
    }),
    exportData(products, {
      format,
      filename: `products_${timestamp}.${format}`,
      includeHeaders: true,
    }),
  ]);
}

/**
 * Export filtered data based on date range
 */
export async function exportFilteredData(
  data: ExportableData[],
  dateField: string,
  startDate: Date,
  endDate: Date,
  options: Omit<ExportOptions, 'dateRange'>
): Promise<void> {
  const filteredData = data.filter(item => {
    const itemDate = item[dateField];
    if (!itemDate || !(itemDate instanceof Date)) return false;
    return itemDate >= startDate && itemDate <= endDate;
  });

  await exportData(filteredData, {
    ...options,
    dateRange: { start: startDate, end: endDate },
  });
}

/**
 * React hook for export functionality
 */
import { useState, useCallback } from 'react';
import { useNotification } from '../components/NotificationSystem';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { addNotification } = useNotification();

  const exportDataWithNotification = useCallback(async (
    data: ExportableData[],
    options: ExportOptions
  ) => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      await exportData(data, options);
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: `Successfully exported ${data.length} records as ${options.format.toUpperCase()}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export data: ${(error as Error).message}`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, addNotification]);

  const exportDashboard = useCallback(async (format: ExportFormat = 'csv') => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      // This would typically get data from your state management or API
      // For now, we'll use placeholder data
      const orders: ExportableData[] = [];
      const campaigns: ExportableData[] = [];
      const products: ExportableData[] = [];
      
      await exportDashboardData(orders, campaigns, products, format);
      addNotification({
        type: 'success',
        title: 'Dashboard Export Successful',
        message: `Successfully exported dashboard data as ${format.toUpperCase()}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Dashboard Export Failed',
        message: `Failed to export dashboard: ${(error as Error).message}`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, addNotification]);

  return {
    isExporting,
    exportData: exportDataWithNotification,
    exportDashboard,
  };
}

export default {
  exportData,
  exportDashboardData,
  exportFilteredData,
  convertToCSV,
  convertToJSON,
  generateFilename,
  useExport,
};