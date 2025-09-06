// Test script for inventory alerts functionality
// This script tests the inventory alerts API endpoints

const testUserId = 'test-user-123';
const baseUrl = 'http://localhost:5173';

// Test function to run inventory check
async function testInventoryCheck() {
  console.log('Testing inventory check API...');
  
  try {
    const response = await fetch(`${baseUrl}/src/api/alerts/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: testUserId }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Inventory check successful:', data);
      return data;
    } else {
      console.error('❌ Inventory check failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
    }
  } catch (error) {
    console.error('❌ Network error during inventory check:', error);
  }
}

// Test function to get alerts
async function testGetAlerts() {
  console.log('Testing get alerts API...');
  
  try {
    const response = await fetch(`${baseUrl}/src/api/alerts/inventory?userId=${testUserId}`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Get alerts successful:', data);
      return data;
    } else {
      console.error('❌ Get alerts failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Network error during get alerts:', error);
  }
}

// Test function to manage alerts
async function testManageAlert(alertId, action) {
  console.log(`Testing manage alert API (${action})...`);
  
  try {
    const response = await fetch(`${baseUrl}/src/api/alerts/manage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        alertId, 
        action, 
        userId: testUserId 
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Manage alert (${action}) successful:`, data);
      return data;
    } else {
      console.error(`❌ Manage alert (${action}) failed:`, response.status, response.statusText);
    }
  } catch (error) {
    console.error(`❌ Network error during manage alert (${action}):`, error);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting inventory alerts tests...');
  console.log('Note: These tests require a valid user session and Shopify products in the database.');
  
  // Test 1: Run inventory check
  const inventoryResult = await testInventoryCheck();
  
  // Test 2: Get alerts
  const alertsResult = await testGetAlerts();
  
  // Test 3: If there are alerts, test managing one
  if (alertsResult && alertsResult.alerts && alertsResult.alerts.length > 0) {
    const firstAlert = alertsResult.alerts[0];
    console.log('Testing alert management with alert:', firstAlert.id);
    
    // Test acknowledge
    await testManageAlert(firstAlert.id, 'acknowledge');
  } else {
    console.log('ℹ️ No alerts found to test management functionality');
  }
  
  console.log('✅ All tests completed!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testInventoryAlerts = {
    runTests,
    testInventoryCheck,
    testGetAlerts,
    testManageAlert
  };
  console.log('📋 Test functions available as window.testInventoryAlerts');
}

// Run tests if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  runTests();
}