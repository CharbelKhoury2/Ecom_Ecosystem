import { supabase } from '../lib/supabase-server';

// In-memory usage tracking for current session
interface UsageEntry {
  tokens_used: number;
  requests_count: number;
  last_request: number;
}

class APIUsageTracker {
  private sessionUsage = new Map<string, UsageEntry>();
  private readonly USAGE_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Track API usage for a workspace
   */
  async trackUsage(
    workspace_id: string, 
    tokens_used: number, 
    provider: 'gemini' | 'openai' = 'gemini'
  ): Promise<void> {
    const now = Date.now();
    
    // Update session tracking
    const sessionEntry = this.sessionUsage.get(workspace_id) || {
      tokens_used: 0,
      requests_count: 0,
      last_request: now
    };
    
    sessionEntry.tokens_used += tokens_used;
    sessionEntry.requests_count += 1;
    sessionEntry.last_request = now;
    
    this.sessionUsage.set(workspace_id, sessionEntry);

    // Store in database for persistent tracking
    try {
      await this.persistUsageToDatabase(workspace_id, tokens_used, provider);
    } catch (error) {
      console.error('Failed to persist API usage:', error);
      // Continue execution even if DB write fails
    }
  }

  /**
   * Get current session usage for workspace
   */
  getSessionUsage(workspace_id: string): UsageEntry {
    return this.sessionUsage.get(workspace_id) || {
      tokens_used: 0,
      requests_count: 0,
      last_request: 0
    };
  }

  /**
   * Get usage statistics for workspace from database
   */
  async getUsageStats(workspace_id: string, days: number = 7): Promise<{
    total_tokens: number;
    total_requests: number;
    daily_breakdown: Array<{
      date: string;
      tokens: number;
      requests: number;
    }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: usageData, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('workspace_id', workspace_id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching usage stats:', error);
        return {
          total_tokens: 0,
          total_requests: 0,
          daily_breakdown: []
        };
      }

      const total_tokens = usageData?.reduce((sum, entry) => sum + (entry.tokens_used || 0), 0) || 0;
      const total_requests = usageData?.length || 0;

      // Group by date for daily breakdown
      const dailyMap = new Map<string, { tokens: number; requests: number }>();
      
      usageData?.forEach(entry => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { tokens: 0, requests: 0 };
        existing.tokens += entry.tokens_used || 0;
        existing.requests += 1;
        dailyMap.set(date, existing);
      });

      const daily_breakdown = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        tokens: stats.tokens,
        requests: stats.requests
      }));

      return {
        total_tokens,
        total_requests,
        daily_breakdown
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        total_tokens: 0,
        total_requests: 0,
        daily_breakdown: []
      };
    }
  }

  /**
   * Check if workspace is within usage limits
   */
  async checkUsageLimits(workspace_id: string): Promise<{
    within_limits: boolean;
    current_usage: number;
    limit: number;
    reset_time: number;
  }> {
    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    try {
      const { data: todayUsage, error } = await supabase
        .from('api_usage_logs')
        .select('tokens_used')
        .eq('workspace_id', workspace_id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) {
        console.error('Error checking usage limits:', error);
        return {
          within_limits: true, // Allow on error
          current_usage: 0,
          limit: 100000, // Default daily limit
          reset_time: tomorrow.getTime()
        };
      }

      const current_usage = todayUsage?.reduce((sum, entry) => sum + (entry.tokens_used || 0), 0) || 0;
      const limit = 100000; // 100k tokens per day per workspace

      return {
        within_limits: current_usage < limit,
        current_usage,
        limit,
        reset_time: tomorrow.getTime()
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return {
        within_limits: true,
        current_usage: 0,
        limit: 100000,
        reset_time: tomorrow.getTime()
      };
    }
  }

  /**
   * Persist usage data to database
   */
  private async persistUsageToDatabase(
    workspace_id: string, 
    tokens_used: number, 
    provider: string
  ): Promise<void> {
    const { error } = await supabase
      .from('api_usage_logs')
      .insert({
        workspace_id,
        provider,
        tokens_used,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Clean up old session data
   */
  cleanupOldSessions(): void {
    const now = Date.now();
    for (const [workspace_id, entry] of this.sessionUsage.entries()) {
      if (now - entry.last_request > this.USAGE_RESET_INTERVAL) {
        this.sessionUsage.delete(workspace_id);
      }
    }
  }

  /**
   * Get usage headers for HTTP responses
   */
  getUsageHeaders(workspace_id: string, tokens_used: number): Record<string, string> {
    const sessionUsage = this.getSessionUsage(workspace_id);
    
    return {
      'X-API-Tokens-Used': tokens_used.toString(),
      'X-API-Session-Tokens': sessionUsage.tokens_used.toString(),
      'X-API-Session-Requests': sessionUsage.requests_count.toString()
    };
  }
}

// Singleton instance
export const apiUsageTracker = new APIUsageTracker();

/**
 * Usage limit error class
 */
export class UsageLimitError extends Error {
  constructor(
    public current_usage: number,
    public limit: number,
    public reset_time: number
  ) {
    super('Daily usage limit exceeded');
    this.name = 'UsageLimitError';
  }
}

/**
 * Track API usage for a request
 */
export async function trackAPIUsage(
  workspace_id: string, 
  tokens_used: number, 
  provider: 'gemini' | 'openai' = 'gemini'
): Promise<void> {
  await apiUsageTracker.trackUsage(workspace_id, tokens_used, provider);
}

/**
 * Check if workspace is within usage limits
 */
export async function checkUsageLimits(workspace_id: string): Promise<void> {
  const result = await apiUsageTracker.checkUsageLimits(workspace_id);
  
  if (!result.within_limits) {
    throw new UsageLimitError(
      result.current_usage,
      result.limit,
      result.reset_time
    );
  }
}

/**
 * Get usage statistics for workspace
 */
export async function getUsageStats(workspace_id: string, days: number = 7) {
  return apiUsageTracker.getUsageStats(workspace_id, days);
}

/**
 * Get usage headers for HTTP responses
 */
export function getUsageHeaders(workspace_id: string, tokens_used: number): Record<string, string> {
  return apiUsageTracker.getUsageHeaders(workspace_id, tokens_used);
}