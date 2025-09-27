import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Truck,
  Calendar,
  Shield,
  AlertCircle,
  Gift,
  Edit,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Address {
  id?: string;
  type: 'shipping' | 'billing';
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
  isDefault?: boolean;
}

interface PaymentMethod {
  id?: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  isDefault?: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
}

interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  estimatedDelivery: string;
}

const CheckoutFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Form states
  const [shippingAddress, setShippingAddress] = useState<Address>({
    type: 'shipping',
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  const [billingAddress, setBillingAddress] = useState<Address>({
    type: 'billing',
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [giftMessage, setGiftMessage] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);

  const steps: CheckoutStep[] = [
    {
      id: 'shipping',
      title: 'Shipping Information',
      description: 'Where should we send your order?',
      icon: <Truck className="w-5 h-5" />
    },
    {
      id: 'payment',
      title: 'Payment Method',
      description: 'How would you like to pay?',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'review',
      title: 'Review Order',
      description: 'Please review your order before placing it',
      icon: <CheckCircle className="w-5 h-5" />
    }
  ];

  // Mock order data
  const orderSummary: OrderSummary = {
    items: [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wireless%20headphones%20black&image_size=square',
        price: 299.99,
        quantity: 1,
        attributes: { color: 'Black', size: 'Standard' }
      },
      {
        id: '2',
        name: 'Smart Fitness Watch',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20watch%20black&image_size=square',
        price: 199.99,
        quantity: 2,
        attributes: { color: 'Black', band: 'Sport' }
      }
    ],
    subtotal: 699.97,
    shipping: 0,
    tax: 55.99,
    discount: 0,
    total: 755.96,
    estimatedDelivery: 'March 15-17, 2024'
  };

  useEffect(() => {
    // Load saved addresses and payment methods
    const mockSavedAddresses: Address[] = [
      {
        id: '1',
        type: 'shipping',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
        phone: '+1 (555) 123-4567',
        isDefault: true
      }
    ];
    
    const mockSavedPaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        type: 'card',
        cardNumber: '****-****-****-1234',
        cardholderName: 'John Doe',
        isDefault: true
      }
    ];
    
    setSavedAddresses(mockSavedAddresses);
    setSavedPaymentMethods(mockSavedPaymentMethods);
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Shipping
        return (
          shippingAddress.firstName.trim() !== '' &&
          shippingAddress.lastName.trim() !== '' &&
          shippingAddress.address1.trim() !== '' &&
          shippingAddress.city.trim() !== '' &&
          shippingAddress.state.trim() !== '' &&
          shippingAddress.zipCode.trim() !== ''
        );
      case 1: // Payment
        if (paymentMethod.type === 'card') {
          return (
            paymentMethod.cardNumber?.replace(/\s/g, '').length === 16 &&
            paymentMethod.expiryMonth !== '' &&
            paymentMethod.expiryYear !== '' &&
            paymentMethod.cvv?.length === 3 &&
            paymentMethod.cardholderName?.trim() !== ''
          );
        }
        return true;
      case 2: // Review
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentMethod(prev => ({ ...prev, cardNumber: formatted }));
  };

  const placeOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate order ID
      const newOrderId = `ORD-${Date.now()}`;
      setOrderId(newOrderId);
      setOrderComplete(true);
      
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const AddressForm: React.FC<{
    address: Address;
    onChange: (address: Address) => void;
    title: string;
  }> = ({ address, onChange, title }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={address.firstName}
            onChange={(e) => onChange({ ...address, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={address.lastName}
            onChange={(e) => onChange({ ...address, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company (Optional)
        </label>
        <input
          type="text"
          value={address.company || ''}
          onChange={(e) => onChange({ ...address, company: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address *
        </label>
        <input
          type="text"
          value={address.address1}
          onChange={(e) => onChange({ ...address, address1: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apartment, suite, etc. (Optional)
        </label>
        <input
          type="text"
          value={address.address2 || ''}
          onChange={(e) => onChange({ ...address, address2: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => onChange({ ...address, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            value={address.state}
            onChange={(e) => onChange({ ...address, state: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select State</option>
            <option value="CA">California</option>
            <option value="NY">New York</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            {/* Add more states */}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code *
          </label>
          <input
            type="text"
            value={address.zipCode}
            onChange={(e) => onChange({ ...address, zipCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone (Optional)
        </label>
        <input
          type="tel"
          value={address.phone || ''}
          onChange={(e) => onChange({ ...address, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed and will be shipped soon.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Order Number</span>
              <span className="font-mono text-lg font-semibold">{orderId}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Total Amount</span>
              <span className="text-lg font-semibold">${orderSummary.total.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Estimated Delivery</span>
              <span className="text-sm font-medium">{orderSummary.estimatedDelivery}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Track Your Order
            </button>
            
            <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Continue Shopping
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200 ${
                index <= currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-full h-0.5 mx-4 transition-colors duration-200 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {steps[currentStep]?.title || ''}
          </h2>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              {/* Step 1: Shipping Information */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <AddressForm
                    address={shippingAddress}
                    onChange={setShippingAddress}
                    title="Shipping Address"
                  />
                  
                  {/* Billing Address */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="sameAsShipping" className="text-sm font-medium text-gray-700">
                        Billing address is the same as shipping address
                      </label>
                    </div>
                    
                    {!sameAsShipping && (
                      <AddressForm
                        address={billingAddress}
                        onChange={setBillingAddress}
                        title="Billing Address"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
                  
                  {/* Payment Type Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: 'card', label: 'Credit Card', icon: <CreditCard className="w-5 h-5" /> },
                      { type: 'paypal', label: 'PayPal', icon: <div className="w-5 h-5 bg-blue-600 rounded" /> },
                      { type: 'apple_pay', label: 'Apple Pay', icon: <div className="w-5 h-5 bg-black rounded" /> },
                      { type: 'google_pay', label: 'Google Pay', icon: <div className="w-5 h-5 bg-green-600 rounded" /> }
                    ].map((method) => (
                      <button
                        key={method.type}
                        onClick={() => setPaymentMethod(prev => ({ ...prev, type: method.type as any }))}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors duration-200 ${
                          paymentMethod.type === method.type
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {method.icon}
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Credit Card Form */}
                  {paymentMethod.type === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          value={paymentMethod.cardholderName || ''}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          value={paymentMethod.cardNumber || ''}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Month *
                          </label>
                          <select
                            value={paymentMethod.expiryMonth || ''}
                            onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                {String(i + 1).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year *
                          </label>
                          <select
                            value={paymentMethod.expiryYear || ''}
                            onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">YYYY</option>
                            {Array.from({ length: 10 }, (_, i) => {
                              const year = new Date().getFullYear() + i;
                              return (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVV *
                          </label>
                          <input
                            type="text"
                            value={paymentMethod.cvv || ''}
                            onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                            placeholder="123"
                            maxLength={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Gift Options */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="isGift"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="isGift" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        This is a gift
                      </label>
                    </div>
                    
                    {isGift && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gift Message (Optional)
                        </label>
                        <textarea
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your gift message here..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Review Your Order</h3>
                  
                  {/* Order Items */}
                  <div className="space-y-4">
                    {orderSummary.items.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
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
                  
                  {/* Shipping & Billing Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Shipping Address
                      </h4>
                      <div className="text-sm text-gray-600">
                        <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                        <p>{shippingAddress.address1}</p>
                        {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                        {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payment Method
                      </h4>
                      <div className="text-sm text-gray-600">
                        {paymentMethod.type === 'card' && (
                          <>
                            <p>Credit Card</p>
                            <p>****-****-****-{paymentMethod.cardNumber?.slice(-4)}</p>
                            <p>{paymentMethod.cardholderName}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Marketing Opt-in */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="marketingOptIn"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="marketingOptIn" className="text-sm text-gray-700">
                      I would like to receive marketing emails about new products and special offers
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={placeOrder}
                disabled={isProcessing || !validateStep(currentStep)}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Place Order
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${orderSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{orderSummary.shipping === 0 ? 'Free' : `$${orderSummary.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${orderSummary.tax.toFixed(2)}</span>
              </div>
              {orderSummary.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${orderSummary.discount.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${orderSummary.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Estimated delivery: {orderSummary.estimatedDelivery}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure checkout with SSL encryption</span>
              </div>
            </div>
            
            {currentStep < 2 && (
              <div className="text-xs text-gray-500">
                <p>* Final total will be calculated at checkout</p>
                <p>* Free shipping on orders over $50</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFlow;