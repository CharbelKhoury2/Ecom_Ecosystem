import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Heart,
  Gift,
  Truck,
  Shield,
  CreditCard,
  ArrowRight,
  X,
  Tag,
  Percent,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  image: string;
  price: number;
  comparePrice?: number;
  quantity: number;
  maxQuantity: number;
  attributes: Record<string, string>;
  sku: string;
  weight?: number;
}

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  icon: React.ReactNode;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt: string;
  description: string;
}

interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

const ShoppingCartComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);

  // Mock data
  const shippingOptions: ShippingOption[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: 'Free shipping on orders over $50',
      price: 0,
      estimatedDays: '5-7 business days',
      icon: <Truck className="w-5 h-5" />
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: 'Faster delivery',
      price: 9.99,
      estimatedDays: '2-3 business days',
      icon: <Clock className="w-5 h-5" />
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      description: 'Next business day delivery',
      price: 24.99,
      estimatedDays: '1 business day',
      icon: <ArrowRight className="w-5 h-5" />
    }
  ];

  const availableCoupons: Coupon[] = [
    {
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 50,
      description: '10% off orders over $50',
      expiresAt: '2024-12-31'
    },
    {
      code: 'FREESHIP',
      type: 'shipping',
      value: 0,
      description: 'Free shipping on any order',
      expiresAt: '2024-12-31'
    },
    {
      code: 'WELCOME20',
      type: 'fixed',
      value: 20,
      minOrderAmount: 100,
      maxDiscount: 20,
      description: '$20 off orders over $100',
      expiresAt: '2024-12-31'
    }
  ];

  // Initialize with mock cart items
  useEffect(() => {
    const mockCartItems: CartItem[] = [
      {
        id: '1',
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Premium Wireless Headphones',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wireless%20headphones%20black%20modern%20design&image_size=square',
        price: 299.99,
        comparePrice: 349.99,
        quantity: 1,
        maxQuantity: 5,
        attributes: { color: 'Black', size: 'Standard' },
        sku: 'WH-001-BLK',
        weight: 0.8
      },
      {
        id: '2',
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Smart Fitness Watch',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20watch%20black%20sport%20band&image_size=square',
        price: 199.99,
        quantity: 2,
        maxQuantity: 10,
        attributes: { color: 'Black', band: 'Sport' },
        sku: 'SW-002-BLK',
        weight: 0.3
      }
    ];
    setCartItems(mockCartItems);
  }, []);

  // Calculate cart summary
  const cartSummary: CartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let shipping = 0;
    const selectedShippingOption = shippingOptions.find(option => option.id === selectedShipping);
    if (selectedShippingOption && subtotal < 50) {
      shipping = selectedShippingOption.price;
    }
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        discount = (subtotal * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount) {
          discount = Math.min(discount, appliedCoupon.maxDiscount);
        }
      } else if (appliedCoupon.type === 'fixed') {
        discount = appliedCoupon.value;
      } else if (appliedCoupon.type === 'shipping') {
        shipping = 0;
      }
    }
    
    const tax = (subtotal - discount) * 0.08; // 8% tax
    const total = subtotal + shipping + tax - discount;
    
    return {
      subtotal,
      shipping,
      tax,
      discount,
      total: Math.max(0, total)
    };
  }, [cartItems, selectedShipping, appliedCoupon]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const quantity = Math.min(newQuantity, item.maxQuantity);
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const saveForLater = (itemId: string) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      setSavedForLater(prev => [...prev, item]);
      removeItem(itemId);
      toast.success('Item saved for later');
    }
  };

  const moveToCart = (itemId: string) => {
    const item = savedForLater.find(item => item.id === itemId);
    if (item) {
      setCartItems(prev => [...prev, item]);
      setSavedForLater(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item moved to cart');
    }
  };

  const applyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    
    if (!coupon) {
      toast.error('Invalid coupon code');
      return;
    }
    
    if (coupon.minOrderAmount && cartSummary.subtotal < coupon.minOrderAmount) {
      toast.error(`Minimum order amount of $${coupon.minOrderAmount} required`);
      return;
    }
    
    if (new Date(coupon.expiresAt) < new Date()) {
      toast.error('Coupon has expired');
      return;
    }
    
    setAppliedCoupon(coupon);
    setCouponCode('');
    toast.success('Coupon applied successfully!');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Coupon removed');
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    // Simulate checkout process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Redirecting to checkout...');
    setIsCheckingOut(false);
    // Here you would redirect to the actual checkout page
  };

  const CartItem: React.FC<{ item: CartItem; showSaveForLater?: boolean }> = ({ 
    item, 
    showSaveForLater = true 
  }) => {
    const hasDiscount = item.comparePrice && item.comparePrice > item.price;
    const discountPercentage = hasDiscount 
      ? Math.round(((item.comparePrice! - item.price) / item.comparePrice!) * 100)
      : 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          {hasDiscount && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              -{discountPercentage}%
            </span>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
          <div className="text-sm text-gray-500 mb-2">
            {Object.entries(item.attributes).map(([key, value]) => (
              <span key={key} className="mr-3">
                {key}: {value}
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-500 mb-2">SKU: {item.sku}</div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                ${item.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ${item.comparePrice!.toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {showSaveForLater ? (
                <>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                      className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => saveForLater(item.id)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    title="Save for later"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => moveToCart(item.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Move to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg"
      >
        <ShoppingCart className="w-6 h-6" />
        {cartItems.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            
            {/* Cart Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-gray-50 z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Shopping Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cart Content */}
              <div className="flex-1 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-gray-600 mb-6">Add some products to get started</p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {/* Cart Items */}
                    <AnimatePresence>
                      {cartItems.map(item => (
                        <CartItem key={item.id} item={item} />
                      ))}
                    </AnimatePresence>

                    {/* Saved for Later */}
                    {savedForLater.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Saved for Later</h3>
                        <div className="space-y-4">
                          {savedForLater.map(item => (
                            <CartItem key={item.id} item={item} showSaveForLater={false} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping Options */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping Options
                      </h3>
                      <div className="space-y-2">
                        {shippingOptions.map(option => (
                          <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="shipping"
                              value={option.id}
                              checked={selectedShipping === option.id}
                              onChange={(e) => setSelectedShipping(e.target.value)}
                              className="text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {option.icon}
                                  <span className="font-medium">{option.name}</span>
                                </div>
                                <span className="font-medium">
                                  {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              <p className="text-sm text-gray-500">{option.estimatedDays}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Promo Code
                      </h3>
                      
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div>
                            <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                            <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={applyCoupon}
                            disabled={!couponCode.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Trust Badges */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="w-6 h-6 text-green-500" />
                          <span className="text-xs text-gray-600">Secure Checkout</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Truck className="w-6 h-6 text-blue-500" />
                          <span className="text-xs text-gray-600">Free Returns</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Gift className="w-6 h-6 text-purple-500" />
                          <span className="text-xs text-gray-600">Gift Wrapping</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Order Summary & Checkout */}
              {cartItems.length > 0 && (
                <div className="bg-white border-t border-gray-200 p-6">
                  {/* Order Summary */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>
                        {cartSummary.shipping === 0 ? 'Free' : `$${cartSummary.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${cartSummary.tax.toFixed(2)}</span>
                    </div>
                    {cartSummary.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-${cartSummary.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${cartSummary.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isCheckingOut ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Proceed to Checkout
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShoppingCartComponent;