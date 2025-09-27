import { supabase } from '../../lib/supabase-server';

// Audit logging function
async function logAuditEvent(actor: string, action: string, targetType: string, targetId: string, payload?: any) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        actor,
        action,
        target_type: targetType,
        target_id: targetId,
        payload: payload || null
      });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Function to trigger inventory check after restock
async function triggerInventoryCheck(workspace_id: string) {
  try {
    // Call the inventory check API internally
    const response = await fetch(`${process.env.VITE_APP_URL || 'http://localhost:3001'}/api/alerts/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspace_id, force: true })
    });
    
    if (!response.ok) {
      console.error('Failed to trigger inventory check after restock');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error triggering inventory check:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return new Response(
        JSON.stringify({ error: 'Mock restock is only available in development mode' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const alertId = url.pathname.split('/').slice(-2, -1)[0]; // Extract alert ID from path
    const { qty = 20, actor = 'system:mock_restock' } = await request.json();

    if (!alertId) {
      return new Response(
        JSON.stringify({ error: 'Missing alert ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid quantity. Must be a positive number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, fetch the alert to get product information
    const { data: alert, error: fetchError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (fetchError || !alert) {
      return new Response(
        JSON.stringify({ error: 'Alert not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (alert.status === 'closed') {
      return new Response(
        JSON.stringify({ error: 'Cannot restock for a closed alert' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the product to update
    const { data: product, error: productError } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('workspace_id', alert.workspace_id)
      .eq('sku', alert.sku)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found for this alert' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the product inventory
    const currentInventory = product.inventory_quantity || 0;
    const newInventory = currentInventory + qty;
    const currentTime = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('shopify_products')
      .update({
        inventory_quantity: newInventory,
        updated_at: currentTime
      })
      .eq('id', product.id);

    if (updateError) {
      console.error('Error updating product inventory:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update product inventory' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log the mock restock audit event
    await logAuditEvent(actor, 'mock_restock', 'alert', alertId, {
      alert_type: alert.type,
      sku: alert.sku,
      product_id: alert.product_id,
      quantity_added: qty,
      previous_inventory: currentInventory,
      new_inventory: newInventory
    });

    // Also log the product update
    await logAuditEvent(actor, 'mock_restock', 'product', product.id, {
      sku: alert.sku,
      quantity_added: qty,
      previous_inventory: currentInventory,
      new_inventory: newInventory
    });

    // Trigger inventory check to auto-close alerts if needed
    const inventoryCheckResult = await triggerInventoryCheck(alert.workspace_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Mock restock completed. Added ${qty} units to ${alert.sku}`,
        product: {
          sku: alert.sku,
          previous_inventory: currentInventory,
          new_inventory: newInventory,
          quantity_added: qty
        },
        alert: {
          id: alert.id,
          type: alert.type,
          sku: alert.sku,
          status: alert.status
        },
        inventory_check: inventoryCheckResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Mock restock error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}