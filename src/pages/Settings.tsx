import React, { useState } from 'react';
import { Settings as SettingsIcon, CheckCircle, XCircle, Smartphone, Slack, RefreshCw } from 'lucide-react';
import { useShopifyConnection } from '../hooks/useShopify';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

const Settings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [shopifyForm, setShopifyForm] = useState({
    storeUrl: '',
    accessToken: '',
  });
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const { connection, connect, syncData, refresh } = useShopifyConnection(user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (connection.storeUrl) {
      setShopifyForm(prev => ({ ...prev, storeUrl: connection.storeUrl }));
    }
  }, [connection.storeUrl]);

  const [notifications, setNotifications] = useState({
    whatsappNumber: '',
    slackWebhook: '',
    alertThresholds: {
      roasDropPercent: 20,
      lowStockUnits: 10,
      refundSpikePercent: 5,
    }
  });

  const handleShopifyConnect = async () => {
    if (!shopifyForm.storeUrl || !shopifyForm.accessToken) {
      alert('Please fill in both Store URL and Access Token');
      return;
    }

    setConnecting(true);
    try {
      const result = await connect(shopifyForm.storeUrl, shopifyForm.accessToken);
      if (result.success) {
        alert('Successfully connected to Shopify!');
        setShopifyForm(prev => ({ ...prev, accessToken: '' })); // Clear token for security
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert('Connection failed: Network error');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const result = await syncData(30);
      if (result.success) {
        alert(`Successfully synced ${result.ordersProcessed} orders and ${result.productsProcessed} products!`);
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert('Sync failed: Network error');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Not Connected';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure integrations and notification preferences</p>
      </div>

      {/* API Integrations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">API Integrations</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Shopify Integration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">S</span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">Shopify</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(connection.connected ? 'connected' : 'disconnected')}
                    <span className="text-sm text-gray-600">
                      {getStatusText(connection.connected ? 'connected' : 'disconnected')}
                    </span>
                    {connection.connected && connection.connectedAt && (
                      <span className="text-xs text-gray-500">
                        • Connected {new Date(connection.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {connection.connected && (
                  <button
                    onClick={handleSyncData}
                    disabled={syncing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 inline ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Data'}
                  </button>
                )}
                <button
                  onClick={connection.connected ? refresh : handleShopifyConnect}
                  disabled={connecting || connection.loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                >
                  {connecting ? 'Connecting...' : connection.connected ? 'Test Connection' : 'Connect'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store URL
                </label>
                <input
                  type="text"
                  value={shopifyForm.storeUrl}
                  onChange={(e) => setShopifyForm(prev => ({ ...prev, storeUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mystore.myshopify.com"
                  disabled={connection.connected}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin API Access Token
                </label>
                <input
                  type="password"
                  value={shopifyForm.accessToken}
                  onChange={(e) => setShopifyForm(prev => ({ ...prev, accessToken: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={connection.connected ? "••••••••••••••••" : "Enter your Admin API access token"}
                  disabled={connection.connected}
                />
              </div>
            </div>
            
            {!connection.connected && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">How to get your Shopify credentials:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Go to your Shopify admin → Settings → Apps and sales channels</li>
                  <li>2. Click "Develop apps" → "Create an app"</li>
                  <li>3. Configure Admin API access scopes: read_orders, read_products, read_inventory</li>
                  <li>4. Install the app and copy the Admin API access token</li>
                </ol>
              </div>
            )}
          </div>

          {/* Meta Ads Integration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">M</span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">Meta Ads</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon('disconnected')}
                    <span className="text-sm text-gray-600">
                      {getStatusText('disconnected')}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                disabled={true}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed transition-colors text-sm"
              >
                Coming Soon
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Account ID
                </label>
                <input
                  type="text"
                  value=""
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="act_1234567890"
                  disabled={true}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  value=""
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your access token"
                  disabled={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* WhatsApp */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="h-5 w-5 text-green-500" />
              <h3 className="text-base font-medium text-gray-900">WhatsApp</h3>
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={notifications.whatsappNumber}
                onChange={(e) => setNotifications(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Slack */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Slack className="h-5 w-5 text-purple-500" />
              <h3 className="text-base font-medium text-gray-900">Slack</h3>
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={notifications.slackWebhook}
                onChange={(e) => setNotifications(prev => ({ ...prev, slackWebhook: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Alert Thresholds</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ROAS Drop Threshold (%)
              </label>
              <input
                type="number"
                value={notifications.alertThresholds.roasDropPercent}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  alertThresholds: { ...prev.alertThresholds, roasDropPercent: Number(e.target.value) }
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold (units)
              </label>
              <input
                type="number"
                value={notifications.alertThresholds.lowStockUnits}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  alertThresholds: { ...prev.alertThresholds, lowStockUnits: Number(e.target.value) }
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Spike Threshold (%)
              </label>
              <input
                type="number"
                value={notifications.alertThresholds.refundSpikePercent}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  alertThresholds: { ...prev.alertThresholds, refundSpikePercent: Number(e.target.value) }
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;