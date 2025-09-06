import { supabase } from '../../lib/supabase';

// Exponential backoff utility
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`, error);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

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

// Function to run inventory check for a workspace
async function runInventoryCheckForWorkspace(workspace_id: string) {
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alerts/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspace_id, force: false })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    });
    
    return {
      workspace_id,
      success: true,
      result: response
    };
  } catch (error) {
    console.error(`Failed to run inventory check for workspace ${workspace_id}:`, error);
    return {
      workspace_id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get all active workspaces
async function getActiveWorkspaces() {
  try {
    // For now, we'll use a default workspace. In a real implementation,
    // you would fetch from a workspaces table
    const { data: products, error } = await supabase
      .from('shopify_products')
      .select('workspace_id')
      .not('workspace_id', 'is', null);
    
    if (error) {
      throw error;
    }
    
    // Get unique workspace IDs
    const workspaceIds = [...new Set(products?.map(p => p.workspace_id) || ['default_workspace'])];
    return workspaceIds;
  } catch (error) {
    console.error('Failed to get active workspaces:', error);
    return ['default_workspace']; // Fallback to default workspace
  }
}

export async function POST(request: Request) {
  try {
    const { manual = false, workspace_id = null } = await request.json();
    const actor = manual ? 'user:manual_trigger' : 'system:scheduler';
    const startTime = new Date();
    
    console.log(`Starting ${manual ? 'manual' : 'scheduled'} inventory check at ${startTime.toISOString()}`);
    
    let workspacesToCheck: string[];
    
    if (workspace_id) {
      // Check specific workspace
      workspacesToCheck = [workspace_id];
    } else {
      // Check all active workspaces
      workspacesToCheck = await getActiveWorkspaces();
    }
    
    if (workspacesToCheck.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active workspaces found',
          results: []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Checking inventory for ${workspacesToCheck.length} workspace(s):`, workspacesToCheck);
    
    // Run inventory checks for all workspaces
    const results = await Promise.allSettled(
      workspacesToCheck.map(ws => runInventoryCheckForWorkspace(ws))
    );
    
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          workspace_id: workspacesToCheck[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const successCount = processedResults.filter(r => r.success).length;
    const failureCount = processedResults.filter(r => !r.success).length;
    
    // Log the scheduler run audit event
    await logAuditEvent(actor, 'scheduler_run', 'system', 'inventory_scheduler', {
      manual,
      workspaces_checked: workspacesToCheck.length,
      successful_checks: successCount,
      failed_checks: failureCount,
      duration_ms: duration,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      results: processedResults
    });
    
    console.log(`Inventory check completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Inventory check completed for ${workspacesToCheck.length} workspace(s)`,
        summary: {
          workspaces_checked: workspacesToCheck.length,
          successful_checks: successCount,
          failed_checks: failureCount,
          duration_ms: duration
        },
        results: processedResults
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduler error:', error);
    
    // Log the error
    await logAuditEvent('system:scheduler', 'scheduler_error', 'system', 'inventory_scheduler', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Scheduler failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET endpoint to check scheduler status and configuration
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'status') {
      // Get recent scheduler runs from audit logs
      const { data: recentRuns, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'scheduler_run')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        throw error;
      }
      
      const workspaces = await getActiveWorkspaces();
      
      return new Response(
        JSON.stringify({
          scheduler_status: 'active',
          active_workspaces: workspaces,
          recent_runs: recentRuns || [],
          configuration: {
            check_interval_minutes: 30,
            retry_attempts: 3,
            base_delay_ms: 1000
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduler status error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get scheduler status' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}