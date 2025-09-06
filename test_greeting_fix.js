// Test script to verify greeting functionality in AI Copilot
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testGreetings() {
  console.log('🧪 Testing AI Copilot Greeting Functionality\n');
  
  const testCases = [
    { query: 'hi', expected: 'greeting' },
    { query: 'hello', expected: 'greeting' },
    { query: 'hey', expected: 'greeting' },
    { query: 'good morning', expected: 'greeting' },
    { query: 'how are you', expected: 'casual_conversation' },
    { query: 'thanks', expected: 'casual_conversation' },
    { query: 'what can you do', expected: 'general_help' },
    { query: 'revenue', expected: 'business_query' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📝 Testing: "${testCase.query}"`);
      
      const response = await fetch(`${API_BASE}/api/copilot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: testCase.query,
          userId: 'test_user_123',
          context: { test: true }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log(`✅ Response received:`);
      console.log(`   Intent: ${result.type || 'unknown'}`);
      console.log(`   Category: ${result.category || 'unknown'}`);
      console.log(`   Response: ${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}`);
      
      // Check if the response is appropriate for the query type
      const isAppropriate = checkResponseAppropriate(testCase.query, result);
      console.log(`   ✨ Appropriate Response: ${isAppropriate ? '✅ YES' : '❌ NO'}`);
      
    } catch (error) {
      console.error(`❌ Error testing "${testCase.query}":`, error.message);
    }
  }
  
  console.log('\n🎉 Greeting functionality test completed!');
}

function checkResponseAppropriate(query, result) {
  const lowerQuery = query.toLowerCase();
  const response = result.response.toLowerCase();
  
  // Check for greetings
  if (['hi', 'hello', 'hey', 'good morning'].includes(lowerQuery)) {
    return response.includes('hello') || response.includes('hi') || response.includes('welcome') || response.includes('copilot');
  }
  
  // Check for casual conversation
  if (['how are you', 'thanks', 'thank you'].includes(lowerQuery)) {
    return response.includes('great') || response.includes('welcome') || response.includes('help');
  }
  
  // Check for help requests
  if (lowerQuery.includes('what can you do') || lowerQuery.includes('help')) {
    return response.includes('revenue') || response.includes('inventory') || response.includes('analytics');
  }
  
  // For business queries, should contain business-related content
  if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
    return response.includes('revenue') || response.includes('sales') || response.includes('$') || response.includes('analytics');
  }
  
  return true; // Default to true for other cases
}

// Run the test
testGreetings().catch(console.error);