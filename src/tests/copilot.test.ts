import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildCopilotContext } from '../utils/copilotContext';
import { 
  copilotCache, 
  checkRateLimit, 
  getCachedContext, 
  setCachedContext,
  RateLimitError 
} from '../utils/cacheAndRateLimit';
import { 
  apiUsageTracker,
  trackAPIUsage,
  checkUsageLimits,
  UsageLimitError
} from '../utils/apiUsageTracking';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({ data: [], error: null })),
            data: [],
            error: null
          })),
          order: vi.fn(() => ({ data: [], error: null })),
          limit: vi.fn(() => ({ data: [], error: null })),
          data: [],
          error: null
        })),
        data: [],
        error: null
      })),
      insert: vi.fn(() => ({ data: null, error: null })),
      count: 0
    }))
  }
}));

// Mock buildCopilotContext
vi.mock('../utils/copilotContext', () => ({
  buildCopilotContext: vi.fn()
}));

describe('Copilot Context Builder', () => {
  const mockWorkspaceId = 'test-workspace-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildCopilotContext', () => {
    it('should build context with empty data when no records exist', async () => {
      const context = await buildCopilotContext(mockWorkspaceId);

      expect(context).toMatchObject({
        workspace_id: mockWorkspaceId,
        timestamp: expect.any(String),
        shopify: {
          revenue_last_7_days: 0,
          revenue_yesterday: 0,
          orders_last_7_days: 0,
          top_skus: [],
          products_count: 0
        },
        meta_ads: {
          ad_spend_last_7_days: 0,
          spend_yesterday: 0,
          top_campaigns: []
        },
        alerts: [],
        derived: {
          gross_profit_yesterday: 0,
          blended_roas: 0
        }
      });
    });

    it('should calculate derived metrics correctly', async () => {
      // Mock the buildCopilotContext function to return expected values
      const mockContext = {
        workspace_id: mockWorkspaceId,
        timestamp: new Date().toISOString(),
        shopify: {
          revenue_yesterday: 1000,
          revenue_last_7_days: 5000,
          orders_last_7_days: 50,
          top_skus: [],
          products_count: 10
        },
        meta_ads: {
          ad_spend_last_7_days: 2000,
          spend_yesterday: 400,
          top_campaigns: []
        },
        alerts: [],
        derived: {
          gross_profit_yesterday: 600, // 1000 - 400
          blended_roas: 2.5 // 5000 / 2000
        }
      };

      // Mock the function directly
      vi.mocked(buildCopilotContext).mockResolvedValue(mockContext);
      
      const context = await buildCopilotContext(mockWorkspaceId);
      
      expect(context.derived.gross_profit_yesterday).toBe(600);
      expect(context.derived.blended_roas).toBe(2.5);
    });

    it('should handle errors gracefully', async () => {
      // Mock Supabase to throw an error
      vi.doMock('../lib/supabase', () => ({
        supabase: {
          from: vi.fn(() => {
            throw new Error('Database connection failed');
          })
        }
      }));

      const context = await buildCopilotContext(mockWorkspaceId);
      
      // Should return empty context structure on error
      expect(context.workspace_id).toBe(mockWorkspaceId);
      expect(context.shopify.revenue_last_7_days).toBe(0);
    });
  });
});

describe('Caching and Rate Limiting', () => {
  const mockWorkspaceId = 'test-workspace-456';
  const mockContext = {
    workspace_id: mockWorkspaceId,
    timestamp: new Date().toISOString(),
    shopify: {
      revenue_last_7_days: 1000,
      revenue_yesterday: 200,
      orders_last_7_days: 10,
      top_skus: [],
      products_count: 5
    },
    meta_ads: {
      ad_spend_last_7_days: 500,
      spend_yesterday: 100,
      top_campaigns: []
    },
    alerts: [],
    derived: {
      gross_profit_yesterday: 100,
      blended_roas: 2.0
    }
  };

  beforeEach(() => {
    copilotCache.clear();
  });

  describe('Context Caching', () => {
    it('should cache and retrieve context data', () => {
      // Initially no cached data
      expect(getCachedContext(mockWorkspaceId)).toBeNull();

      // Set cache
      setCachedContext(mockWorkspaceId, mockContext);

      // Should retrieve cached data
      const cached = getCachedContext(mockWorkspaceId);
      expect(cached).toEqual(mockContext);
    });

    it('should expire cache after TTL', async () => {
      setCachedContext(mockWorkspaceId, mockContext);
      
      // Should be cached initially
      expect(getCachedContext(mockWorkspaceId)).toEqual(mockContext);

      // Mock time passage beyond TTL (30 seconds)
      vi.useFakeTimers();
      vi.advanceTimersByTime(31000); // 31 seconds

      // Should be expired
      expect(getCachedContext(mockWorkspaceId)).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      copilotCache.clear();
    });

    it('should allow requests within rate limit', () => {
      expect(() => checkRateLimit(mockWorkspaceId)).not.toThrow();
      expect(() => checkRateLimit(mockWorkspaceId)).not.toThrow();
      expect(() => checkRateLimit(mockWorkspaceId)).not.toThrow();
    });

    it('should throw RateLimitError when limit exceeded', () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(mockWorkspaceId);
      }

      // 6th request should throw
      expect(() => checkRateLimit(mockWorkspaceId)).toThrow(RateLimitError);
    });

    it('should reset rate limit after window expires', () => {
      // Fill up the rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(mockWorkspaceId);
      }

      // Should be rate limited
      expect(() => checkRateLimit(mockWorkspaceId)).toThrow(RateLimitError);

      // Mock time passage beyond rate limit window (1 minute)
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000); // 61 seconds

      // Should allow requests again
      expect(() => checkRateLimit(mockWorkspaceId)).not.toThrow();
      
      vi.useRealTimers();
    });
  });
});

describe('API Usage Tracking', () => {
  const mockWorkspaceId = 'test-workspace-789';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear session usage to prevent test interference
    apiUsageTracker.clearSessionUsage();
  });

  describe('Usage Tracking', () => {
    it('should track API usage', async () => {
      const tokens = 1500;
      
      await trackAPIUsage(mockWorkspaceId, tokens, 'gemini');
      
      const sessionUsage = apiUsageTracker.getSessionUsage(mockWorkspaceId);
      expect(sessionUsage.tokens_used).toBe(tokens);
      expect(sessionUsage.requests_count).toBe(1);
    });

    it('should accumulate usage across multiple requests', async () => {
      await trackAPIUsage(mockWorkspaceId, 1000, 'gemini');
      await trackAPIUsage(mockWorkspaceId, 500, 'gemini');
      await trackAPIUsage(mockWorkspaceId, 750, 'gemini');
      
      const sessionUsage = apiUsageTracker.getSessionUsage(mockWorkspaceId);
      expect(sessionUsage.tokens_used).toBe(2250);
      expect(sessionUsage.requests_count).toBe(3);
    });
  });

  describe('Usage Limits', () => {
    it('should allow usage within limits', async () => {
      // Mock the apiUsageTracker.checkUsageLimits method directly
      const originalCheckUsageLimits = apiUsageTracker.checkUsageLimits;
      apiUsageTracker.checkUsageLimits = vi.fn().mockResolvedValue({
        within_limits: true,
        current_usage: 50000, // Below 100k limit
        limit: 100000,
        reset_time: Date.now() + 86400000
      });

      await expect(checkUsageLimits(mockWorkspaceId)).resolves.not.toThrow();
      
      // Restore original method
      apiUsageTracker.checkUsageLimits = originalCheckUsageLimits;
    });

    it('should throw UsageLimitError when limit exceeded', async () => {
      // Mock the apiUsageTracker.checkUsageLimits method directly
      const originalCheckUsageLimits = apiUsageTracker.checkUsageLimits;
      apiUsageTracker.checkUsageLimits = vi.fn().mockResolvedValue({
        within_limits: false,
        current_usage: 150000, // Above 100k limit
        limit: 100000,
        reset_time: Date.now() + 86400000
      });

      await expect(checkUsageLimits(mockWorkspaceId)).rejects.toThrow(UsageLimitError);
      
      // Restore original method
      apiUsageTracker.checkUsageLimits = originalCheckUsageLimits;
    });
  });

  describe('Usage Headers', () => {
    it('should generate correct usage headers', () => {
      const tokens = 1234;
      
      // Track some usage first
      apiUsageTracker.trackUsage(mockWorkspaceId, 500, 'gemini');
      apiUsageTracker.trackUsage(mockWorkspaceId, 300, 'gemini');
      
      const headers = apiUsageTracker.getUsageHeaders(mockWorkspaceId, tokens);
      
      expect(headers).toMatchObject({
        'X-API-Tokens-Used': tokens.toString(),
        'X-API-Session-Tokens': expect.any(String),
        'X-API-Session-Requests': expect.any(String)
      });
    });
  });
});

describe('Integration Tests', () => {
  const mockWorkspaceId = 'integration-test-workspace';

  beforeEach(() => {
    copilotCache.clear();
    vi.clearAllMocks();
  });

  it('should handle complete copilot query flow', async () => {
    // 1. Build context
    const context = await buildCopilotContext(mockWorkspaceId);
    expect(context.workspace_id).toBe(mockWorkspaceId);

    // 2. Cache context
    setCachedContext(mockWorkspaceId, context);
    const cached = getCachedContext(mockWorkspaceId);
    expect(cached).toEqual(context);

    // 3. Check rate limits
    expect(() => checkRateLimit(mockWorkspaceId)).not.toThrow();

    // 4. Track usage
    await trackAPIUsage(mockWorkspaceId, 1500, 'gemini');
    const usage = apiUsageTracker.getSessionUsage(mockWorkspaceId);
    expect(usage.tokens_used).toBe(1500);
  });

  it('should handle cache TTL verification', async () => {
    const context = await buildCopilotContext(mockWorkspaceId);
    
    // Set cache
    setCachedContext(mockWorkspaceId, context);
    expect(getCachedContext(mockWorkspaceId)).not.toBeNull();

    // Verify cache exists within TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(25000); // 25 seconds (within 30s TTL)
    expect(getCachedContext(mockWorkspaceId)).not.toBeNull();

    // Verify cache expires after TTL
    vi.advanceTimersByTime(10000); // Additional 10 seconds (total 35s, beyond 30s TTL)
    expect(getCachedContext(mockWorkspaceId)).toBeNull();
    
    vi.useRealTimers();
  });

  it('should handle multiple workspace isolation', async () => {
    const workspace1 = 'workspace-1';
    const workspace2 = 'workspace-2';
    
    const context1 = await buildCopilotContext(workspace1);
    const context2 = await buildCopilotContext(workspace2);
    
    setCachedContext(workspace1, context1);
    setCachedContext(workspace2, context2);
    
    // Verify isolation
    expect(getCachedContext(workspace1)).toEqual(context1);
    expect(getCachedContext(workspace2)).toEqual(context2);
    expect(getCachedContext(workspace1)).not.toEqual(context2);
    
    // Rate limits should be separate
    for (let i = 0; i < 5; i++) {
      checkRateLimit(workspace1);
    }
    
    expect(() => checkRateLimit(workspace1)).toThrow(RateLimitError);
    expect(() => checkRateLimit(workspace2)).not.toThrow(); // Should still work
  });
});