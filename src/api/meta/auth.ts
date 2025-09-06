import { supabase } from '../../lib/supabase';
import { encrypt } from '../../lib/encryption';
import { MetaAdsAPI } from '../../lib/meta';

export async function POST(request: Request) {
  try {
    const { adAccountId, accessToken, userId } = await request.json();

    if (!adAccountId || !accessToken || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test the connection first
    const metaAPI = new MetaAdsAPI(accessToken, adAccountId);
    const isValid = await metaAPI.testConnection();

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid Meta Ads credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt the access token
    const encryptedToken = encrypt(accessToken);

    // Store credentials in database
    const { error } = await supabase
      .from('meta_credentials')
      .upsert({
        user_id: userId,
        ad_account_id: adAccountId,
        encrypted_access_token: encryptedToken,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Meta Ads credentials stored successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Meta auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: credentials, error } = await supabase
      .from('meta_credentials')
      .select('ad_account_id, created_at')
      .eq('user_id', userId)
      .single();

    if (error || !credentials) {
      return new Response(
        JSON.stringify({ connected: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        connected: true,
        adAccountId: credentials.ad_account_id,
        connectedAt: credentials.created_at,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get Meta auth status error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}