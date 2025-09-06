import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, ExternalLink, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Shipment {
  id: string;
  order_id: string;
  tracking_number: string;
  provider: string;
  provider_name: string;
  status: string;
  cost: number;
  estimated_delivery: string;
  current_location?: string;
  created_at: string;
}

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

interface ShippingTrackerProps {
  userId: string;
}

const ShippingTracker: React.FC<ShippingTrackerProps> = ({ userId }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShipment, setNewShipment] = useState({
    orderId: '',
    provider: 'DHL'
  });

  useEffect(() => {
    if (userId) {
      fetchShipments();
    }
  }, [userId]);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackShipment = async (trackingNumber: string, provider: string) => {
    setTrackingLoading(true);
    try {
      const response = await fetch(
        `/src/api/shipping/track?trackingNumber=${trackingNumber}&provider=${provider}&userId=${userId}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setTrackingInfo(result.data);
      } else {
        console.error('Failed to track shipment');
      }
    } catch (error) {
      console.error('Error tracking shipment:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const createShipment = async () => {
    try {
      const response = await fetch('/src/api/shipping/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: newShipment.orderId,
          provider: newShipment.provider,
          userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateForm(false);
        setNewShipment({ orderId: '', provider: 'DHL' });
        fetchShipments();
      } else {
        console.error('Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'out for delivery':
        return 'bg-blue-100 text-blue-800';
      case 'in transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'exception':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Shipping Tracker</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Shipment
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-3">Create New Shipment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID
              </label>
              <input
                type="text"
                value={newShipment.orderId}
                onChange={(e) => setNewShipment({ ...newShipment, orderId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter order ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={newShipment.provider}
                onChange={(e) => setNewShipment({ ...newShipment, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DHL">DHL Express</option>
                <option value="FEDEX">FedEx Express</option>
                <option value="UPS">UPS Express</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createShipment}
              disabled={!newShipment.orderId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Create Shipment
            </button>
          </div>
        </div>
      )}

      {shipments.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No shipments found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first shipment to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{shipment.tracking_number}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {shipment.provider_name} • Order: {shipment.order_id}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => trackShipment(shipment.tracking_number, shipment.provider)}
                  disabled={trackingLoading}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Track
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Est. Delivery: {formatDate(shipment.estimated_delivery)}</span>
                </div>
                {shipment.current_location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{shipment.current_location}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-gray-600">Cost: ${shipment.cost?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {trackingInfo && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-md font-medium text-blue-900 mb-3">Tracking Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {trackingInfo.status}</div>
            <div><strong>Current Location:</strong> {trackingInfo.currentLocation}</div>
            <div><strong>Estimated Delivery:</strong> {formatDate(trackingInfo.estimatedDelivery)}</div>
          </div>
          
          {trackingInfo.updates && trackingInfo.updates.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-blue-900 mb-2">Recent Updates</h5>
              <div className="space-y-2">
                {trackingInfo.updates.map((update, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{update.description}</span>
                    <span className="text-gray-600">{formatDate(update.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={() => setTrackingInfo(null)}
            className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};

export default ShippingTracker;