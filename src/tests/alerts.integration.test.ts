import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { supabase } from '../lib/supabase';

// Integration tests for the complete inventory alerts workflow
describe('Inventory Alerts Integration Tests', () => {
  const testWorkspaceId = 'test-workspace-integration';
  const testUserId = 'test-user-integration';
  let testProductId: string;
  let testAlertId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Create test product with low stock
    const { data: product, error } = await supabase
      .from('shopify_products')
      .insert({
        workspace_id: testWorkspaceId,
        user_id: testUserId,
        product_id: 'test-product-123',
        sku: 'TEST-SKU-001',
        title: 'Test Product for Integration',
        inventory_quantity: 5, // Low stock to trigger alert
        price: 29.99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test product: ${error.message}`);
    }

    testProductId = product.id;
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  async function cleanupTestData() {
    // Delete test alerts
    await supabase
      .from('alerts')
      .delete()
      .eq('workspace_id', testWorkspaceId);

    // Delete test products
    await supabase
      .from('shopify_products')
      .delete()
      .eq('workspace_id', testWorkspaceId);

    // Delete test audit logs
    await supabase
      .from('audit_logs')
      .delete()
      .like('target_id', `%${testWorkspaceId}%`);
  }

  describe('Full Workflow: Product → Alert → Acknowledge → Restock → Close', () => {
    it('should complete the full inventory alert lifecycle', async () => {
      // Step 1: Run inventory check to generate alert
      const inventoryResponse = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      expect(inventoryResponse.ok).toBe(true);
      const inventoryResult = await inventoryResponse.json();
      expect(inventoryResult.created).toBe(1);
      expect(inventoryResult.alerts).toHaveLength(1);
      expect(inventoryResult.alerts[0].type).toBe('Low Stock');
      expect(inventoryResult.alerts[0].severity).toBe('warning');
      expect(inventoryResult.alerts[0].sku).toBe('TEST-SKU-001');

      testAlertId = inventoryResult.alerts[0].id;

      // Step 2: Verify alert was created in database
      const { data: dbAlert, error: alertError } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', testAlertId)
        .single();

      expect(alertError).toBeNull();
      expect(dbAlert).toBeTruthy();
      expect(dbAlert.status).toBe('open');
      expect(dbAlert.acknowledged_by).toBeNull();

      // Step 3: Verify audit log was created
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('target_id', testAlertId)
        .eq('action', 'create');

      expect(auditError).toBeNull();
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('create');
      expect(auditLogs[0].target_type).toBe('alert');

      // Step 4: Acknowledge the alert
      const acknowledgeResponse = await fetch(`/api/alerts/${testAlertId}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 'test@example.com' })
      });

      expect(acknowledgeResponse.ok).toBe(true);
      const acknowledgeResult = await acknowledgeResponse.json();
      expect(acknowledgeResult.success).toBe(true);
      expect(acknowledgeResult.alert.acknowledged_by).toBe('test@example.com');
      expect(acknowledgeResult.alert.acknowledged_at).toBeTruthy();

      // Step 5: Verify acknowledgment in database
      const { data: acknowledgedAlert, error: ackError } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', testAlertId)
        .single();

      expect(ackError).toBeNull();
      expect(acknowledgedAlert.acknowledged_by).toBe('test@example.com');
      expect(acknowledgedAlert.acknowledged_at).toBeTruthy();
      expect(acknowledgedAlert.status).toBe('open'); // Still open, just acknowledged

      // Step 6: Perform mock restock (development only)
      if (process.env.NODE_ENV !== 'production') {
        const restockResponse = await fetch(`/api/alerts/${testAlertId}/mock_restock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qty: 20, actor: 'test@example.com' })
        });

        expect(restockResponse.ok).toBe(true);
        const restockResult = await restockResponse.json();
        expect(restockResult.success).toBe(true);
        expect(restockResult.product.quantity_added).toBe(20);
        expect(restockResult.product.new_inventory).toBe(25); // 5 + 20

        // Step 7: Verify product inventory was updated
        const { data: updatedProduct, error: productError } = await supabase
          .from('shopify_products')
          .select('*')
          .eq('id', testProductId)
          .single();

        expect(productError).toBeNull();
        expect(updatedProduct.inventory_quantity).toBe(25);

        // Step 8: Run inventory check again to auto-close alert
        const secondCheckResponse = await fetch('/api/alerts/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
        });

        expect(secondCheckResponse.ok).toBe(true);
        const secondCheckResult = await secondCheckResponse.json();
        expect(secondCheckResult.closed).toBe(1); // Alert should be closed

        // Step 9: Verify alert was closed in database
        const { data: closedAlert, error: closedError } = await supabase
          .from('alerts')
          .select('*')
          .eq('id', testAlertId)
          .single();

        expect(closedError).toBeNull();
        expect(closedAlert.status).toBe('closed');

        // Step 10: Verify close audit log was created
        const { data: closeAuditLogs, error: closeAuditError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('target_id', testAlertId)
          .eq('action', 'close');

        expect(closeAuditError).toBeNull();
        expect(closeAuditLogs).toHaveLength(1);
        expect(closeAuditLogs[0].action).toBe('close');
      }
    });
  });

  describe('Out of Stock Workflow', () => {
    it('should handle out of stock scenario', async () => {
      // Update product to out of stock
      await supabase
        .from('shopify_products')
        .update({ inventory_quantity: 0 })
        .eq('id', testProductId);

      // Run inventory check
      const response = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.created).toBe(1);
      expect(result.alerts[0].type).toBe('Out of Stock');
      expect(result.alerts[0].severity).toBe('critical');
    });
  });

  describe('Duplicate Alert Prevention', () => {
    it('should not create duplicate alerts for same SKU', async () => {
      // First inventory check
      const firstResponse = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      const firstResult = await firstResponse.json();
      expect(firstResult.created).toBe(1);

      // Second inventory check (should not create duplicate)
      const secondResponse = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      const secondResult = await secondResponse.json();
      expect(secondResult.created).toBe(0); // No new alerts
      expect(secondResult.alerts).toHaveLength(1); // Still only one alert
    });
  });

  describe('Scheduler Integration', () => {
    it('should run scheduler for specific workspace', async () => {
      const response = await fetch('/api/alerts/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true, workspace_id: testWorkspaceId })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.summary.workspaces_checked).toBe(1);
      expect(result.summary.successful_checks).toBe(1);
    });

    it('should get scheduler status', async () => {
      const response = await fetch('/api/alerts/scheduler?action=status');

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.scheduler_status).toBe('active');
      expect(result.configuration).toBeTruthy();
      expect(result.configuration.check_interval_minutes).toBe(30);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing product gracefully', async () => {
      // Delete the test product
      await supabase
        .from('shopify_products')
        .delete()
        .eq('id', testProductId);

      // Run inventory check
      const response = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.products_checked).toBe(0);
      expect(result.created).toBe(0);
    });

    it('should handle invalid alert ID for acknowledgment', async () => {
      const response = await fetch('/api/alerts/invalid-id/acknowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 'test@example.com' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBe('Alert not found');
    });

    it('should handle invalid quantity for mock restock', async () => {
      // First create an alert
      const inventoryResponse = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      const inventoryResult = await inventoryResponse.json();
      const alertId = inventoryResult.alerts[0].id;

      // Try mock restock with invalid quantity
      const response = await fetch(`/api/alerts/${alertId}/mock_restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: -5, actor: 'test@example.com' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBe('Invalid quantity. Must be a positive number');
    });
  });

  describe('Audit Trail Verification', () => {
    it('should create complete audit trail for alert lifecycle', async () => {
      // Create alert
      const inventoryResponse = await fetch('/api/alerts/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: testWorkspaceId, force: true })
      });

      const inventoryResult = await inventoryResponse.json();
      const alertId = inventoryResult.alerts[0].id;

      // Acknowledge alert
      await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 'test@example.com' })
      });

      // Check audit logs
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('target_id', alertId)
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      expect(auditLogs).toHaveLength(2); // create + acknowledge
      expect(auditLogs[0].action).toBe('create');
      expect(auditLogs[1].action).toBe('acknowledge');
      expect(auditLogs[0].target_type).toBe('alert');
      expect(auditLogs[1].target_type).toBe('alert');
    });
  });
});