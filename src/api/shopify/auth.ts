import { supabase } from '../../lib/supabase';
import { encrypt } from '../../lib/encryption';
import { ShopifyAPI } from '../../lib/shopify';

export async function POST(request: Request) {
  try {
    const { storeUrl, accessToken, userId } = await request.json();

    if (!storeUrl || !accessToken || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test the connection first
    const shopifyAPI = new ShopifyAPI(storeUrl, accessToken);
    const isValid = await shopifyAPI.testConnection();

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid Shopify credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt the access token
    const encryptedToken = encrypt(accessToken);

    // Store credentials in database
    const { error } = await supabase
      .from('shopify_credentials')
      .upsert({
        user_id: userId,
        store_url: storeUrl,
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
      JSON.stringify({ success: true, message: 'Shopify credentials stored successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify auth error:', error);
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
      .from('shopify_credentials')
      .select('store_url, created_at')
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
        storeUrl: credentials.store_url,
        connectedAt: credentials.created_at,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get Shopify auth status error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}