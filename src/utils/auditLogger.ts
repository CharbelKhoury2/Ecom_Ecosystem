import { supabase } from '../lib/supabase-server';

/**
 * Centralized audit logging utility for the application
 * Logs events to the audit_logs table in Supabase
 */

/**
 * Log an audit event to the database
 * @param actor The user or system component that performed the action
 * @param action The action that was performed
 * @param targetType The type of entity that was affected
 * @param targetId The ID of the entity that was affected
 * @param payload Additional data related to the event
 */
export async function logAuditEvent(
  actor: string, 
  action: string, 
  targetType: string, 
  targetId: string, 
  payload?: any
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        actor,
        action,
        target_type: targetType,
        target_id: targetId,
        payload: payload || null,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get audit logs with optional filtering
 * @param limit Maximum number of logs to return
 * @param filters Optional filters for the query
 */
export async function getAuditLogs(
  limit: number = 100,
  filters?: {
    actor?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<any[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (filters) {
      if (filters.actor) {
        query = query.eq('actor', filters.actor);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.targetType) {
        query = query.eq('target_type', filters.targetType);
      }
      
      if (filters.targetId) {
        query = query.eq('target_id', filters.targetId);
      }
      
      if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate.toISOString());
      }
      
      if (filters.toDate) {
        query = query.lte('created_at', filters.toDate.toISOString());
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

/**
 * Clear all audit logs (for testing purposes only)
 */
export async function clearAuditLogs(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('Cannot clear audit logs in production environment');
    return;
  }
  
  try {
    await supabase.from('audit_logs').delete().neq('id', '0');
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
  }
}

export default {
  logAuditEvent,
  getAuditLogs,
  clearAuditLogs
};