import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  FileText,
  Printer,
  Send,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  sku: string;
  quantity: number;
  price: number;
  attributes: Record<string, string>;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  shippingMethod: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

interface OrderFilters {
  status: string[];
  paymentStatus: string[];
  dateRange: [string, string];
  searchQuery: string;
  customerId?: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    paymentStatus: [],
    dateRange: ['', ''],
    searchQuery: ''
  });

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    processing: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
    shipped: { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
    delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    refunded: { color: 'bg-gray-100 text-gray-800', icon: RefreshCw }
  };

  const paymentStatusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800' },
    paid: { color: 'bg-green-100 text-green-800' },
    failed: { color: 'bg-red-100 text-red-800' },
    refunded: { color: 'bg-gray-100 text-gray-800' }
  };

  // Mock data
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        customerId: 'cust-1',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        status: 'shipped',
        paymentStatus: 'paid',
        items: [
          {
            id: '1',
            productId: 'prod-1',
            name: 'Premium Wireless Headphones',
            image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wireless%20headphones%20black&image_size=square',
            sku: 'WH-001-BLK',
            quantity: 1,
            price: 299.99,
            attributes: { color: 'Black', size: 'Standard' }
          },
          {
            id: '2',
            productId: 'prod-2',
            name: 'Smart Fitness Watch',
            image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20watch%20black&image_size=square',
            sku: 'SW-002-BLK',
            quantity: 1,
            price: 199.99,
            attributes: { color: 'Black', band: 'Sport' }
          }
        ],
        subtotal: 499.98,
        shipping: 0,
        tax: 40.00,
        discount: 0,
        total: 539.98,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          phone: '+1 (555) 123-4567'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US'
        },
        shippingMethod: 'Standard Shipping',
        trackingNumber: 'TRK123456789',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T14:20:00Z',
        estimatedDelivery: '2024-01-20T00:00:00Z'
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        customerId: 'cust-2',
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        status: 'processing',
        paymentStatus: 'paid',
        items: [
          {
            id: '3',
            productId: 'prod-3',
            name: 'Organic Cotton T-Shirt',
            image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20t-shirt%20white&image_size=square',
            sku: 'TS-003-WHT-M',
            quantity: 2,
            price: 29.99,
            attributes: { color: 'White', size: 'M' }
          }
        ],
        subtotal: 59.98,
        shipping: 9.99,
        tax: 5.60,
        discount: 5.99,
        total: 69.58,
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'US',
          phone: '+1 (555) 987-6543'
        },
        billingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'US'
        },
        shippingMethod: 'Express Shipping',
        createdAt: '2024-01-16T09:15:00Z',
        updatedAt: '2024-01-16T09:15:00Z',
        estimatedDelivery: '2024-01-18T00:00:00Z'
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-003',
        customerId: 'cust-3',
        customerName: 'Bob Johnson',
        customerEmail: 'bob.johnson@example.com',
        status: 'pending',
        paymentStatus: 'pending',
        items: [
          {
            id: '4',
            productId: 'prod-1',
            name: 'Premium Wireless Headphones',
            image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wireless%20headphones%20white&image_size=square',
            sku: 'WH-001-WHT',
            quantity: 1,
            price: 299.99,
            attributes: { color: 'White', size: 'Standard' }
          }
        ],
        subtotal: 299.99,
        shipping: 0,
        tax: 24.00,
        discount: 0,
        total: 323.99,
        shippingAddress: {
          firstName: 'Bob',
          lastName: 'Johnson',
          address1: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'US',
          phone: '+1 (555) 456-7890'
        },
        billingAddress: {
          firstName: 'Bob',
          lastName: 'Johnson',
          address1: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'US'
        },
        shippingMethod: 'Standard Shipping',
        createdAt: '2024-01-17T16:45:00Z',
        updatedAt: '2024-01-17T16:45:00Z',
        estimatedDelivery: '2024-01-22T00:00:00Z'
      }
    ];
    
    setOrders(mockOrders);
    setLoading(false);
  }, []);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query) ||
          order.trackingNumber?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(order.status)) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(order.paymentStatus)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange[0] && filters.dateRange[1]) {
        const orderDate = new Date(order.createdAt);
        const startDate = new Date(filters.dateRange[0]);
        const endDate = new Date(filters.dateRange[1]);
        if (orderDate < startDate || orderDate > endDate) {
          return false;
        }
      }

      return true;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'orderNumber':
          aValue = a.orderNumber;
          bValue = b.orderNumber;
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    ));
    toast.success(`Order status updated to ${newStatus}`);
  };

  const addTrackingNumber = (orderId: string, trackingNumber: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, trackingNumber, updatedAt: new Date().toISOString() }
        : order
    ));
    toast.success('Tracking number added');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportOrders = () => {
    // Implement CSV export
    const csvContent = [
      ['Order Number', 'Customer', 'Status', 'Total', 'Date'].join(','),
      ...filteredOrders.map(order => [
        order.orderNumber,
        order.customerName,
        order.status,
        order.total.toFixed(2),
        formatDate(order.createdAt)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Orders exported successfully');
  };

  const OrderDetailsModal: React.FC<{ order: Order }> = ({ order }) => {
    const [newTrackingNumber, setNewTrackingNumber] = useState(order.trackingNumber || '');
    const [orderNotes, setOrderNotes] = useState(order.notes || '');

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowOrderDetails(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h2>
              <p className="text-gray-600">Order placed on {formatDate(order.createdAt)}</p>
            </div>
            <button
              onClick={() => setShowOrderDetails(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].color}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusConfig[order.paymentStatus].color}`}>
                  Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
                
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  <Printer className="w-5 h-5" />
                </button>
                
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {order.customerName}</p>
                  <p><strong>Email:</strong> {order.customerEmail}</p>
                  <p><strong>Customer ID:</strong> {order.customerId}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${order.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      <div className="text-sm text-gray-500">
                        {Object.entries(item.attributes).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600">
                  <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Shipping Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Method:</strong> {order.shippingMethod}</p>
                  {order.estimatedDelivery && (
                    <p><strong>Estimated Delivery:</strong> {formatDate(order.estimatedDelivery)}</p>
                  )}
                  {order.actualDelivery && (
                    <p><strong>Delivered:</strong> {formatDate(order.actualDelivery)}</p>
                  )}
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTrackingNumber}
                        onChange={(e) => setNewTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => addTrackingNumber(order.id, newTrackingNumber)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Order Notes
              </h3>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add notes about this order..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
        <p className="text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search orders, customers, tracking numbers..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">Date</option>
            <option value="orderNumber">Order Number</option>
            <option value="customerName">Customer</option>
            <option value="total">Total</option>
            <option value="status">Status</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing {paginatedOrders.length} of {filteredOrders.length} orders
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {paginatedOrders.map(order => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          {order.trackingNumber && (
                            <div className="text-sm text-gray-500">Tracking: {order.trackingNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[order.paymentStatus].color}`}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{order.items.length} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                        {order.estimatedDelivery && (
                          <div className="text-sm text-gray-500">
                            Est: {formatDate(order.estimatedDelivery)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <OrderDetailsModal order={selectedOrder} />
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setFilters({
                status: [],
                paymentStatus: [],
                dateRange: ['', ''],
                searchQuery: ''
              });
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;