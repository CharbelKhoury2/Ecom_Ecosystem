import { supabase } from '../../lib/supabase';

export async function PATCH(request: Request) {
  try {
    const { alertId, action, userId } = await request.json();

    if (!alertId || !action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: alertId, action, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['acknowledge', 'restock'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "acknowledge" or "restock"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentTime = new Date().toISOString();

    if (action === 'acknowledge') {
      // Close the alert
      const { data, error } = await supabase
        .from('alerts')
        .update({ 
          status: 'closed',
          updated_at: currentTime
        })
        .eq('id', alertId)
        .eq('user_id', userId)
        .select('*');

      if (error) {
        console.error('Error acknowledging alert:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to acknowledge alert' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Alert not found or unauthorized' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alert acknowledged successfully',
          alert: data[0]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'restock') {
      // For now, this is a mock action that just closes the alert
      // In a real implementation, this would integrate with inventory management
      const { data, error } = await supabase
        .from('alerts')
        .update({ 
          status: 'closed',
          updated_at: currentTime
        })
        .eq('id', alertId)
        .eq('user_id', userId)
        .select('*');

      if (error) {
        console.error('Error processing restock:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to process restock action' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Alert not found or unauthorized' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Restock action initiated (mock implementation)',
          alert: data[0]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Alert management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}