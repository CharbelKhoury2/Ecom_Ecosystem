import { supabase } from '../../lib/supabase-server';

// Mock shipping providers data
const MOCK_PROVIDERS = {
  DHL: {
    name: 'DHL Express',
    trackingUrl: 'https://www.dhl.com/track',
    estimatedDays: '1-3 business days',
    cost: 25.99
  },
  FEDEX: {
    name: 'FedEx Express',
    trackingUrl: 'https://www.fedex.com/track',
    estimatedDays: '1-2 business days', 
    cost: 29.99
  },
  UPS: {
    name: 'UPS Express',
    trackingUrl: 'https://www.ups.com/track',
    estimatedDays: '1-3 business days',
    cost: 27.99
  }
};

const MOCK_STATUSES = [
  'Label Created',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Exception',
  'Returned'
];

interface TrackingInfo {
  trackingNumber: string;
  provider: string;
  status: string;
  estimatedDelivery: string;
  currentLocation: string;
  updates: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
}

function generateMockTrackingInfo(trackingNumber: string, provider: string): TrackingInfo {
  const providerInfo = MOCK_PROVIDERS[provider as keyof typeof MOCK_PROVIDERS];
  const randomStatus = MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)];
  
  // Generate mock delivery date (1-5 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 5) + 1);
  
  const mockLocations = [
    'New York, NY',
    'Los Angeles, CA', 
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA'
  ];
  
  const currentLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
  
  // Generate mock tracking updates
  const updates = [];
  const now = new Date();
  
  for (let i = 0; i < 3; i++) {
    const updateTime = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    updates.push({
      timestamp: updateTime.toISOString(),
      status: MOCK_STATUSES[Math.min(i + 1, MOCK_STATUSES.length - 1)],
      location: mockLocations[Math.floor(Math.random() * mockLocations.length)],
      description: `Package ${MOCK_STATUSES[Math.min(i + 1, MOCK_STATUSES.length - 1)].toLowerCase()} at facility`
    });
  }
  
  return {
    trackingNumber,
    provider: providerInfo?.name || provider,
    status: randomStatus,
    estimatedDelivery: deliveryDate.toISOString().split('T')[0],
    currentLocation,
    updates: updates.reverse()
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const trackingNumber = url.searchParams.get('trackingNumber');
    const provider = url.searchParams.get('provider');
    const userId = url.searchParams.get('userId');

    if (!trackingNumber || !provider || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: trackingNumber, provider, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate provider
    if (!MOCK_PROVIDERS[provider as keyof typeof MOCK_PROVIDERS]) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider. Supported: DHL, FEDEX, UPS' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate mock tracking info
    const trackingInfo = generateMockTrackingInfo(trackingNumber, provider);

    // Log the tracking request for audit
    await supabase
      .from('audit_logs')
      .insert({
        actor: userId,
        action: 'shipping_track',
        target_type: 'shipment',
        target_id: trackingNumber,
        payload: {
          provider,
          trackingNumber,
          status: trackingInfo.status
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        data: trackingInfo
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shipping tracking API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track shipment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { orderId, provider, userId } = await request.json();

    if (!orderId || !provider || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, provider, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate provider
    if (!MOCK_PROVIDERS[provider as keyof typeof MOCK_PROVIDERS]) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider. Supported: DHL, FEDEX, UPS' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate mock tracking number
    const trackingNumber = `${provider}${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const providerInfo = MOCK_PROVIDERS[provider as keyof typeof MOCK_PROVIDERS];

    // Create shipping record
    const { data: shipment, error } = await supabase
      .from('shipments')
      .insert({
        user_id: userId,
        order_id: orderId,
        tracking_number: trackingNumber,
        provider: provider,
        provider_name: providerInfo.name,
        status: 'Label Created',
        cost: providerInfo.cost,
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shipment: ${error.message}`);
    }

    // Log the shipment creation
    await supabase
      .from('audit_logs')
      .insert({
        actor: userId,
        action: 'shipping_create',
        target_type: 'shipment',
        target_id: trackingNumber,
        payload: {
          orderId,
          provider,
          trackingNumber,
          cost: providerInfo.cost
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          trackingNumber,
          provider: providerInfo.name,
          cost: providerInfo.cost,
          estimatedDelivery: shipment.estimated_delivery,
          trackingUrl: `${providerInfo.trackingUrl}?trackingNumber=${trackingNumber}`
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shipping creation API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create shipment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}