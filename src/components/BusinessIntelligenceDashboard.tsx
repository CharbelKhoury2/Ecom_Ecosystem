/**
 * Business Intelligence Dashboard
 * Advanced analytics including cohort analysis, RFM analysis, and market basket analysis
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  HeatMap,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  TrendingUp,
  ShoppingCart,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Eye,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import { format, subDays, addMonths, parseISO } from 'date-fns';
import enhancedAIService, {
  CohortAnalysis,
  RFMAnalysis,
  MarketBasketAnalysis
} from '../services/enhancedAIService';

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  avgValue: number;
  color: string;
}

interface CohortHeatmapData {
  cohort: string;
  period: number;
  retentionRate: number;
  customers: number;
}

const BusinessIntelligenceDashboard: React.FC = () => {
  const [cohortData, setCohortData] = useState<CohortAnalysis[]>([]);
  const [rfmData, setRfmData] = useState<RFMAnalysis[]>([]);
  const [marketBasketData, setMarketBasketData] = useState<MarketBasket