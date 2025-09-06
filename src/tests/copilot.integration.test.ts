import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../api/copilot/query';

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({ data: [], error: null })),
            order: vi.fn(() => ({ data: [], error: null })),
            limit: vi.fn(() => ({ data: [], error: null })),
            data: [],
            error: null
          })),
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

// Mock fetch for Gemini API
global.fetch = vi.fn();

describe('Copilot API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful Gemini API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: 'Based on your data, here are some insights...'
            }]
          }
        }]
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/copilot/query', () => {
    it('should handle valid copilot query request', async () => {
      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: 'test-workspace',
          user_query: 'What are my top performing products?'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('context');
      expect(data).toHaveProperty('llm_response');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('tokens_used');
      
      expect(data.context).toHaveProperty('workspace_id', 'test-workspace');
      expect(data.context).toHaveProperty('timestamp');
      expect(data.context).toHaveProperty('shopify');
      expect(data.context).toHaveProperty('meta_ads');
      expect(data.context).toHaveProperty('derived');
    });

    it('should return 400 for missing workspace_id', async () => {
      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_query: 'What are my sales?'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing workspace_id or user_query');
    });

    it('should return 400 for missing user_query', async () => {
      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: 'test-workspace'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing workspace_id or user_query');
    });

    it('should include rate limit headers in response', async () => {
      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: 'test-workspace',
          user_query: 'Show me my revenue'
        })
      });

      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should include usage tracking headers in response', async () => {
      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: 'test-workspace',
          user_query: 'Analyze my campaigns'
        })
      });

      const response = await POST(request);

      expect(response.headers.get('X-API-Tokens-Used')).toBeTruthy();
      expect(response.headers.get('X-API-Session-Tokens')).toBeTruthy();
      expect(response.headers.get('X-API-Session-Requests')).toBeTruthy();
    });

    it('should handle rate limiting', async () => {
      const workspace_id = 'rate-limit-test-workspace';
      
      // Make 5 requests (the rate limit)
      for (let i = 0; i < 5; i++) {
        const request = new Request('http://localhost/api/copilot/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workspace_id,
            user_query: `Query ${i + 1}`
          })
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }

      // 6th request should be rate limited
      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id,
          user_query: 'Rate limited query'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded. Please try again later.');
      expect(data).toHaveProperty('resetTime');
    });

    it('should handle Gemini API errors gracefully', async () => {
      // Mock Gemini API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: 'test-workspace',
          user_query: 'What are my sales?'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Should still return 200 with fallback
      expect(data).toHaveProperty('llm_response');
      expect(data.llm_response).toContain('analyze your store performance'); // Fallback response
    });

    it('should use cached context on subsequent requests', async () => {
      const workspace_id = 'cache-test-workspace';
      
      // First request
      const request1 = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id,
          user_query: 'First query'
        })
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();
      
      expect(response1.status).toBe(200);
      const firstTimestamp = data1.context.timestamp;

      // Second request (should use cached context)
      const request2 = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id,
          user_query: 'Second query'
        })
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();
      
      expect(response2.status).toBe(200);
      expect(data2.context.timestamp).toBe(firstTimestamp); // Should be same (cached)
    });

    it('should handle function calling with recommendations', async () => {
      // Mock Gemini API response with recommendations
      const mockResponse: Record<string, unknown> = {
        candidates: [{
          content: {
            parts: [{
              text: 'Based on your data, I recommend optimizing your ad campaigns for better ROAS.'
            }]
          }
        }],
        usageMetadata: {
          totalTokenCount: 150
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request = new Request('http://localhost/api/copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_id: 'test-workspace',
          user_query: 'Give me recommendations for my business'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('recommendations');
      expect(Array.isArray(data.recommendations)).toBe(true);
    });
  });
});