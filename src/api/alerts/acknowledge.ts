import { supabase } from '../../lib/supabase';
import { logAuditEvent } from '../../utils/auditLogger';
import { alertNotificationIntegration } from '../../services/alertNotificationIntegration';



export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const alertId = url.pathname.split('/').slice(-2, -1)[0]; // Extract alert ID from path
    const { acknowledged_by } = await request.json();

    if (!alertId) {
      return new Response(
        JSON.stringify({ error: 'Missing alert ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!acknowledged_by) {
      return new Response(
        JSON.stringify({ error: 'Missing acknowledged_by field' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, fetch the alert to ensure it exists and get current state
    const { data: existingAlert, error: fetchError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (fetchError || !existingAlert) {
      return new Response(
        JSON.stringify({ error: 'Alert not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingAlert.status === 'closed') {
      return new Response(
        JSON.stringify({ error: 'Cannot acknowledge a closed alert' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingAlert.acknowledged_by) {
      return new Response(
        JSON.stringify({ 
          error: 'Alert already acknowledged',
          acknowledged_by: existingAlert.acknowledged_by,
          acknowledged_at: existingAlert.acknowledged_at
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the alert with acknowledgment information
    const currentTime = new Date().toISOString();
    const { data: updatedAlert, error: updateError } = await supabase
      .from('alerts')
      .update({
        acknowledged_by,
        acknowledged_at: currentTime,
        updated_at: currentTime
      })
      .eq('id', alertId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error acknowledging alert:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to acknowledge alert' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log the acknowledgment
    await logAuditEvent(acknowledged_by, 'acknowledge', 'alert', alertId, {
      previous_status: existingAlert.status
    });
    
    // Send notification for alert acknowledgment
    try {
      await alertNotificationIntegration.initialize();
      await alertNotificationIntegration.sendAlertAcknowledgedNotification(updatedAlert, acknowledged_by);
    } catch (notificationError) {
      console.error('Error sending alert acknowledgment notification:', notificationError);
      // Don't fail the API call if notifications fail
    }

    return new Response(
      JSON.stringify({
        success: true,
        alert: updatedAlert,
        message: 'Alert acknowledged successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}