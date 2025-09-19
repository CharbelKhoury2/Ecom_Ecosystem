import { supabase, withRetry, testSupabaseConnection, mockAlerts } from '../../lib/supabase-server';
import { alertNotificationIntegration } from '../../services/alertNotificationIntegration';

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

export async function POST(request: Request) {
  try {
    const { workspace_id, force = false } = await request.json();

    if (!workspace_id) {
      return new Response(
        JSON.stringify({ error: 'Missing workspace_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.warn('Database unavailable for inventory check, returning mock response');
      return new Response(
        JSON.stringify({
          alerts: mockAlerts,
          created: 0,
          closed: 0,
          products_checked: 0,
          warning: 'Database unavailable, inventory check skipped',
          summary: {
            new_alerts_created: 0,
            alerts_closed: 0,
            total_open_alerts: mockAlerts.length
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all products for the workspace with retry
    const products = await withRetry(async () => {
      const { data, error } = await supabase
        .from('shopify_products')
        .select('*')
        .eq('workspace_id', workspace_id);

      if (error) {
        throw error;
      }

      return data;
    });

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ alerts: [], message: 'No products found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const alertsToCreate = [];
    const alertsToClose = [];
    const currentTime = new Date().toISOString();
    const actor = `system:inventory_check:${workspace_id}`;

    // Check each product for inventory alerts
    for (const product of products) {
      const stockQuantity = product.inventory_quantity || 0;
      const sku = product.sku || product.product_id;
      const productId = product.product_id;

      // Skip if no SKU or inventory_quantity is missing
      if (!sku) {
        console.warn(`Skipping product without SKU: ${productId}`);
        continue;
      }

      if (product.inventory_quantity === null || product.inventory_quantity === undefined) {
        console.warn(`Skipping product with missing inventory_quantity: ${sku}`);
        continue;
      }

      // Check for existing alerts for this SKU to avoid duplicates
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('id, type, status')
        .eq('workspace_id', workspace_id)
        .eq('sku', sku)
        .eq('status', 'open');

      const hasOpenLowStockAlert = existingAlerts?.some(alert => alert.type === 'Low Stock');
      const hasOpenOutOfStockAlert = existingAlerts?.some(alert => alert.type === 'Out of Stock');

      // Out of Stock Alert (Critical)
      if (stockQuantity <= 0 && !hasOpenOutOfStockAlert) {
        const alertData = {
          workspace_id,
          product_id: productId,
          type: 'Out of Stock',
          sku: sku,
          message: `Product "${product.title || product.name}" is out of stock`,
          severity: 'critical',
          status: 'open',
          created_at: currentTime,
          updated_at: currentTime
        };
        alertsToCreate.push(alertData);

        // Close any existing low stock alerts since this is now out of stock
        if (hasOpenLowStockAlert) {
          const lowStockAlert = existingAlerts?.find(alert => alert.type === 'Low Stock');
          if (lowStockAlert) {
            alertsToClose.push(lowStockAlert.id);
          }
        }
      }
      // Low Stock Alert (Warning)
      else if (stockQuantity > 0 && stockQuantity < 10 && !hasOpenLowStockAlert && !hasOpenOutOfStockAlert) {
        const alertData = {
          workspace_id,
          product_id: productId,
          type: 'Low Stock',
          sku: sku,
          message: `Only ${stockQuantity} units left for "${product.title || product.name}"`,
          severity: 'warning',
          status: 'open',
          created_at: currentTime,
          updated_at: currentTime
        };
        alertsToCreate.push(alertData);
      }
      // Close alerts if stock is back to normal levels (>=10)
      else if (stockQuantity >= 10) {
        if (hasOpenLowStockAlert || hasOpenOutOfStockAlert) {
          const alertsToCloseForProduct = existingAlerts?.filter(alert => 
            (alert.type === 'Low Stock' || alert.type === 'Out of Stock') && alert.status === 'open'
          );
          if (alertsToCloseForProduct) {
            alertsToClose.push(...alertsToCloseForProduct.map(alert => alert.id));
          }
        }
      }
    }

    // Close alerts that should be closed
    let closedAlertsCount = 0;
    if (alertsToClose.length > 0) {
      const { error: closeError } = await supabase
        .from('alerts')
        .update({ status: 'closed', updated_at: currentTime })
        .in('id', alertsToClose);

      if (closeError) {
        console.error('Error closing alerts:', closeError);
      } else {
        closedAlertsCount = alertsToClose.length;
        // Log audit events for closed alerts
        for (const alertId of alertsToClose) {
          await logAuditEvent(actor, 'close', 'alert', alertId, { reason: 'inventory_recovered' });
        }
        
        // Send notifications for resolved alerts
        if (alertsToClose.length > 0) {
          try {
            // Get the closed alerts data for notifications
            const { data: closedAlerts } = await supabase
              .from('alerts')
              .select('*')
              .in('id', alertsToClose);
            
            if (closedAlerts && closedAlerts.length > 0) {
              // Initialize integration if not already done
              await alertNotificationIntegration.initialize();
              
              // Send individual notifications for each resolved alert
              for (const alert of closedAlerts) {
                await alertNotificationIntegration.sendAlertResolvedNotification(alert);
              }
              
              // If multiple alerts resolved, also send a bulk notification
              if (closedAlerts.length > 1) {
                await alertNotificationIntegration.sendBulkAlertNotification(closedAlerts, 'resolved');
              }
            }
          } catch (notificationError) {
            console.error('Error sending alert resolution notifications:', notificationError);
            // Don't fail the API call if notifications fail
          }
        }
      }
    }

    // Insert new alerts if any
    let insertedAlerts = [];
    if (alertsToCreate.length > 0) {
      const { data: newAlerts, error: insertError } = await supabase
        .from('alerts')
        .insert(alertsToCreate)
        .select('*');

      if (insertError) {
        console.error('Error creating alerts:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create alerts' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      insertedAlerts = newAlerts || [];
      
      // Log audit events for created alerts
      for (const alert of insertedAlerts) {
        await logAuditEvent(actor, 'create', 'alert', alert.id, {
          type: alert.type,
          sku: alert.sku,
          severity: alert.severity
        });
      }
      
      // Send notifications for new alerts
      if (insertedAlerts.length > 0) {
        try {
          // Initialize integration if not already done
          await alertNotificationIntegration.initialize();
          
          // Send individual notifications for each alert
          for (const alert of insertedAlerts) {
            await alertNotificationIntegration.sendInventoryAlertNotification(alert);
          }
          
          // If multiple alerts, also send a bulk notification
          if (insertedAlerts.length > 1) {
            await alertNotificationIntegration.sendBulkAlertNotification(insertedAlerts, 'created');
          }
        } catch (notificationError) {
          console.error('Error sending alert notifications:', notificationError);
          // Don't fail the API call if notifications fail
        }
      }
    }

    // Fetch all current open alerts for the response
    const { data: allAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch alerts' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log the inventory check audit event
    await logAuditEvent(actor, 'inventory_check', 'workspace', workspace_id, {
      products_checked: products.length,
      alerts_created: insertedAlerts.length,
      alerts_closed: closedAlertsCount,
      force_check: force
    });

    return new Response(
      JSON.stringify({
        alerts: allAlerts || [],
        created: insertedAlerts.length,
        closed: closedAlertsCount,
        products_checked: products.length,
        summary: {
          new_alerts_created: insertedAlerts.length,
          alerts_closed: closedAlertsCount,
          total_open_alerts: allAlerts?.length || 0
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Inventory alerts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspace_id = url.searchParams.get('workspace_id');
    const status = url.searchParams.get('status') || 'open';
    const type = url.searchParams.get('type');
    const severity = url.searchParams.get('severity');

    if (!workspace_id) {
      return new Response(
        JSON.stringify({ error: 'Missing workspace_id parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.warn('Database unavailable, returning mock data');
      const filteredMockAlerts = mockAlerts.filter(alert => {
        if (status && alert.status !== status) return false;
        if (type && alert.type !== type) return false;
        if (severity && alert.severity !== severity) return false;
        return true;
      });
      
      return new Response(
        JSON.stringify({ 
          alerts: filteredMockAlerts,
          warning: 'Database unavailable, showing mock data'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use retry wrapper for database operations
    const alerts = await withRetry(async () => {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('workspace_id', workspace_id);

      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    });

    return new Response(
      JSON.stringify({ alerts: alerts || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get alerts error:', error);
    
    // Fallback to mock data on error
    console.warn('Falling back to mock data due to error');
    const filteredMockAlerts = mockAlerts.filter(alert => {
      const status = new URL(request.url).searchParams.get('status') || 'open';
      const type = new URL(request.url).searchParams.get('type');
      const severity = new URL(request.url).searchParams.get('severity');
      
      if (status && alert.status !== status) return false;
      if (type && alert.type !== type) return false;
      if (severity && alert.severity !== severity) return false;
      return true;
    });
    
    return new Response(
      JSON.stringify({ 
        alerts: filteredMockAlerts,
        warning: 'Database error, showing mock data',
        error: error.message
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}