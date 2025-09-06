/**
 * Advanced filtering and search system
 * Supports complex queries, multiple field search, and real-time filtering
 */

import { useState, useCallback, useMemo } from 'react';
import { performanceMonitor } from './performance';

export type FilterOperator = 
  | 'equals' 
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export type FilterValue = string | number | Date | boolean | null | (string | number)[];

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

export interface AdvancedFilter {
  groups: FilterGroup[];
  globalLogic: 'AND' | 'OR';
}

export interface SearchOptions {
  fields: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
  highlightMatches?: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Evaluate a single filter condition
 */
export function evaluateCondition(
  item: Record<string, unknown>,
  condition: FilterCondition
): boolean {
  const fieldValue = getNestedValue(item, condition.field);
  const { operator, value, dataType } = condition;

  // Handle null checks first
  if (operator === 'is_null') {
    return fieldValue === null || fieldValue === undefined;
  }
  if (operator === 'is_not_null') {
    return fieldValue !== null && fieldValue !== undefined;
  }

  // If field value is null/undefined and we're not checking for null, return false
  if (fieldValue === null || fieldValue === undefined) {
    return false;
  }

  // Convert values based on data type
  const normalizedFieldValue = normalizeValue(fieldValue, dataType);
  const normalizedFilterValue = normalizeValue(value, dataType);

  switch (operator) {
    case 'equals':
      return normalizedFieldValue === normalizedFilterValue;
    
    case 'not_equals':
      return normalizedFieldValue !== normalizedFilterValue;
    
    case 'contains':
      return String(normalizedFieldValue).toLowerCase().includes(String(normalizedFilterValue).toLowerCase());
    
    case 'not_contains':
      return !String(normalizedFieldValue).toLowerCase().includes(String(normalizedFilterValue).toLowerCase());
    
    case 'starts_with':
      return String(normalizedFieldValue).toLowerCase().startsWith(String(normalizedFilterValue).toLowerCase());
    
    case 'ends_with':
      return String(normalizedFieldValue).toLowerCase().endsWith(String(normalizedFilterValue).toLowerCase());
    
    case 'greater_than':
      return Number(normalizedFieldValue) > Number(normalizedFilterValue);
    
    case 'less_than':
      return Number(normalizedFieldValue) < Number(normalizedFilterValue);
    
    case 'greater_than_or_equal':
      return Number(normalizedFieldValue) >= Number(normalizedFilterValue);
    
    case 'less_than_or_equal':
      return Number(normalizedFieldValue) <= Number(normalizedFilterValue);
    
    case 'between':
      if (Array.isArray(normalizedFilterValue) && normalizedFilterValue.length === 2) {
        const [min, max] = normalizedFilterValue.map(Number);
        const numValue = Number(normalizedFieldValue);
        return numValue >= min && numValue <= max;
      }
      return false;
    
    case 'in':
      if (Array.isArray(normalizedFilterValue)) {
        return normalizedFilterValue.includes(normalizedFieldValue);
      }
      return false;
    
    case 'not_in':
      if (Array.isArray(normalizedFilterValue)) {
        return !normalizedFilterValue.includes(normalizedFieldValue);
      }
      return true;
    
    default:
      return false;
  }
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj);
}

/**
 * Normalize value based on data type
 */
function normalizeValue(value: unknown, dataType: string): unknown {
  if (value === null || value === undefined) return value;

  switch (dataType) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'date':
      return value instanceof Date ? value : new Date(value as string);
    case 'boolean':
      return Boolean(value);
    default:
      return value;
  }
}

/**
 * Evaluate a filter group
 */
export function evaluateFilterGroup(
  item: Record<string, unknown>,
  group: FilterGroup
): boolean {
  if (group.conditions.length === 0) return true;

  const results = group.conditions.map(condition => evaluateCondition(item, condition));

  return group.logic === 'AND' 
    ? results.every(result => result)
    : results.some(result => result);
}

/**
 * Apply advanced filter to data
 */
export function applyAdvancedFilter<T extends Record<string, unknown>>(
  data: T[],
  filter: AdvancedFilter
): T[] {
  if (filter.groups.length === 0) return data;

  const startTime = performance.now();

  const filteredData = data.filter(item => {
    const groupResults = filter.groups.map(group => evaluateFilterGroup(item, group));
    
    return filter.globalLogic === 'AND'
      ? groupResults.every(result => result)
      : groupResults.some(result => result);
  });

  const endTime = performance.now();
  performanceMonitor.recordMetric('advanced-filter', endTime - startTime, {
    originalCount: data.length,
    filteredCount: filteredData.length,
    groupCount: filter.groups.length,
  });

  return filteredData;
}

/**
 * Perform text search across multiple fields
 */
export function performTextSearch<T extends Record<string, unknown>>(
  data: T[],
  searchTerm: string,
  options: SearchOptions
): T[] {
  if (!searchTerm.trim()) return data;

  const startTime = performance.now();
  const normalizedSearchTerm = options.caseSensitive 
    ? searchTerm 
    : searchTerm.toLowerCase();

  const searchResults = data.filter(item => {
    return options.fields.some(field => {
      const fieldValue = getNestedValue(item, field);
      if (fieldValue === null || fieldValue === undefined) return false;

      const normalizedFieldValue = options.caseSensitive
        ? String(fieldValue)
        : String(fieldValue).toLowerCase();

      return options.exactMatch
        ? normalizedFieldValue === normalizedSearchTerm
        : normalizedFieldValue.includes(normalizedSearchTerm);
    });
  });

  const endTime = performance.now();
  performanceMonitor.recordMetric('text-search', endTime - startTime, {
    originalCount: data.length,
    resultCount: searchResults.length,
    searchTerm: searchTerm.length,
    fieldCount: options.fields.length,
  });

  return searchResults;
}

/**
 * Sort data by multiple fields
 */
export function sortData<T extends Record<string, unknown>>(
  data: T[],
  sortConfigs: SortConfig[]
): T[] {
  if (sortConfigs.length === 0) return data;

  const startTime = performance.now();

  const sortedData = [...data].sort((a, b) => {
    for (const config of sortConfigs) {
      const aValue = getNestedValue(a, config.field);
      const bValue = getNestedValue(b, config.field);

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) {
        if (bValue === null || bValue === undefined) continue;
        return config.direction === 'asc' ? -1 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return config.direction === 'asc' ? 1 : -1;
      }

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      if (comparison !== 0) {
        return config.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });

  const endTime = performance.now();
  performanceMonitor.recordMetric('data-sort', endTime - startTime, {
    recordCount: data.length,
    sortFieldCount: sortConfigs.length,
  });

  return sortedData;
}

/**
 * React hook for advanced filtering
 */
export function useAdvancedFiltering<T extends Record<string, unknown>>(
  data: T[],
  initialFilter?: AdvancedFilter
) {
  const [filter, setFilter] = useState<AdvancedFilter>(
    initialFilter || { groups: [], globalLogic: 'AND' }
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    fields: [],
    caseSensitive: false,
    exactMatch: false,
  });
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  // Apply all filters and sorting
  const processedData = useMemo(() => {
    let result = data;

    // Apply advanced filter
    if (filter.groups.length > 0) {
      result = applyAdvancedFilter(result, filter);
    }

    // Apply text search
    if (searchTerm && searchOptions.fields.length > 0) {
      result = performTextSearch(result, searchTerm, searchOptions);
    }

    // Apply sorting
    if (sortConfigs.length > 0) {
      result = sortData(result, sortConfigs);
    }

    return result;
  }, [data, filter, searchTerm, searchOptions, sortConfigs]);

  // Filter management functions
  const addFilterGroup = useCallback(() => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      conditions: [],
      logic: 'AND',
    };
    setFilter(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }));
  }, []);

  const removeFilterGroup = useCallback((groupId: string) => {
    setFilter(prev => ({
      ...prev,
      groups: prev.groups.filter(group => group.id !== groupId),
    }));
  }, []);

  const addCondition = useCallback((groupId: string, condition: Omit<FilterCondition, 'id'>) => {
    const newCondition: FilterCondition = {
      ...condition,
      id: `condition-${Date.now()}`,
    };
    
    setFilter(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        group.id === groupId
          ? { ...group, conditions: [...group.conditions, newCondition] }
          : group
      ),
    }));
  }, []);

  const removeCondition = useCallback((groupId: string, conditionId: string) => {
    setFilter(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        group.id === groupId
          ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
          : group
      ),
    }));
  }, []);

  const updateCondition = useCallback((groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    setFilter(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map(condition =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition
              ),
            }
          : group
      ),
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilter({ groups: [], globalLogic: 'AND' });
    setSearchTerm('');
    setSortConfigs([]);
  }, []);

  const addSort = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    setSortConfigs(prev => {
      const existing = prev.find(config => config.field === field);
      if (existing) {
        return prev.map(config => 
          config.field === field ? { ...config, direction } : config
        );
      }
      return [...prev, { field, direction }];
    });
  }, []);

  const removeSort = useCallback((field: string) => {
    setSortConfigs(prev => prev.filter(config => config.field !== field));
  }, []);

  return {
    // Data
    filteredData: processedData,
    originalCount: data.length,
    filteredCount: processedData.length,
    
    // Filter state
    filter,
    searchTerm,
    searchOptions,
    sortConfigs,
    
    // Filter actions
    setFilter,
    setSearchTerm,
    setSearchOptions,
    setSortConfigs,
    
    // Filter management
    addFilterGroup,
    removeFilterGroup,
    addCondition,
    removeCondition,
    updateCondition,
    clearAllFilters,
    
    // Sorting
    addSort,
    removeSort,
  };
}

export default {
  evaluateCondition,
  evaluateFilterGroup,
  applyAdvancedFilter,
  performTextSearch,
  sortData,
  useAdvancedFiltering,
};