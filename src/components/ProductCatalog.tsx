import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  Eye,
  ChevronDown,
  SlidersHorizontal,
  Package,
  Tag,
  TrendingUp,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  sku: string;
  inventory: number;
  attributes: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory?: string;
  brand: string;
  images: string[];
  variants: ProductVariant[];
  basePrice: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  onSale: boolean;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId?: string;
  productCount: number;
}

interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  onSale: boolean;
  featured: boolean;
  tags: string[];
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});

  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    brands: [],
    priceRange: [0, 1000],
    rating: 0,
    inStock: false,
    onSale: false,
    featured: false,
    tags: []
  });

  // Mock data - replace with API calls
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
        shortDescription: 'Premium wireless headphones with noise cancellation',
        category: 'Electronics',
        subcategory: 'Audio',
        brand: 'TechPro',
        images: [
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wireless%20headphones%20black%20modern%20design%20studio%20lighting&image_size=square_hd',
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20headphones%20side%20view%20premium%20quality&image_size=square_hd'
        ],
        variants: [
          {
            id: '1-black',
            name: 'Black',
            price: 299.99,
            comparePrice: 349.99,
            sku: 'WH-001-BLK',
            inventory: 25,
            attributes: { color: 'Black', size: 'Standard' }
          },
          {
            id: '1-white',
            name: 'White',
            price: 299.99,
            sku: 'WH-001-WHT',
            inventory: 18,
            attributes: { color: 'White', size: 'Standard' }
          }
        ],
        basePrice: 299.99,
        rating: 4.8,
        reviewCount: 124,
        tags: ['wireless', 'noise-cancelling', 'premium'],
        featured: true,
        trending: true,
        newArrival: false,
        onSale: true,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      },
      {
        id: '2',
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and smart notifications.',
        shortDescription: 'Advanced fitness tracking with GPS and heart rate monitoring',
        category: 'Electronics',
        subcategory: 'Wearables',
        brand: 'FitTech',
        images: [
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20watch%20black%20sport%20band%20modern%20design&image_size=square_hd'
        ],
        variants: [
          {
            id: '2-black',
            name: 'Black Sport Band',
            price: 199.99,
            sku: 'SW-002-BLK',
            inventory: 32,
            attributes: { color: 'Black', band: 'Sport' }
          },
          {
            id: '2-blue',
            name: 'Blue Sport Band',
            price: 199.99,
            sku: 'SW-002-BLU',
            inventory: 28,
            attributes: { color: 'Blue', band: 'Sport' }
          }
        ],
        basePrice: 199.99,
        rating: 4.6,
        reviewCount: 89,
        tags: ['fitness', 'smart', 'gps', 'health'],
        featured: false,
        trending: true,
        newArrival: true,
        onSale: false,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z'
      },
      {
        id: '3',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt made from sustainable materials with a perfect fit.',
        shortDescription: 'Comfortable organic cotton t-shirt',
        category: 'Clothing',
        subcategory: 'T-Shirts',
        brand: 'EcoWear',
        images: [
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20t-shirt%20white%20minimalist%20design%20flat%20lay&image_size=square_hd'
        ],
        variants: [
          {
            id: '3-white-s',
            name: 'White - Small',
            price: 29.99,
            sku: 'TS-003-WHT-S',
            inventory: 45,
            attributes: { color: 'White', size: 'S' }
          },
          {
            id: '3-white-m',
            name: 'White - Medium',
            price: 29.99,
            sku: 'TS-003-WHT-M',
            inventory: 52,
            attributes: { color: 'White', size: 'M' }
          },
          {
            id: '3-white-l',
            name: 'White - Large',
            price: 29.99,
            sku: 'TS-003-WHT-L',
            inventory: 38,
            attributes: { color: 'White', size: 'L' }
          }
        ],
        basePrice: 29.99,
        rating: 4.4,
        reviewCount: 67,
        tags: ['organic', 'cotton', 'sustainable', 'comfortable'],
        featured: false,
        trending: false,
        newArrival: true,
        onSale: false,
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z'
      }
    ];

    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest electronic devices and gadgets',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=electronics%20category%20modern%20devices%20collection&image_size=landscape_4_3',
        productCount: 156
      },
      {
        id: '2',
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel for all occasions',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=clothing%20fashion%20apparel%20collection%20modern&image_size=landscape_4_3',
        productCount: 234
      },
      {
        id: '3',
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Everything for your home and garden',
        image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=home%20garden%20furniture%20decor%20collection&image_size=landscape_4_3',
        productCount: 89
      }
    ];

    setProducts(mockProducts);
    setCategories(mockCategories);
    setLoading(false);
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Price range filter
      if (product.basePrice < filters.priceRange[0] || product.basePrice > filters.priceRange[1]) {
        return false;
      }

      // Rating filter
      if (filters.rating > 0 && product.rating < filters.rating) {
        return false;
      }

      // Stock filter
      if (filters.inStock) {
        const hasStock = product.variants.some(variant => variant.inventory > 0);
        if (!hasStock) return false;
      }

      // Sale filter
      if (filters.onSale && !product.onSale) {
        return false;
      }

      // Featured filter
      if (filters.featured && !product.featured) {
        return false;
      }

      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.basePrice;
          bValue = b.basePrice;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'newest':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'popularity':
          aValue = a.reviewCount;
          bValue = b.reviewCount;
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
  }, [products, searchQuery, selectedCategory, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddToWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    toast.success(
      wishlist.includes(productId) 
        ? 'Removed from wishlist' 
        : 'Added to wishlist'
    );
  };

  const handleAddToCart = (variantId: string, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [variantId]: (prev[variantId] || 0) + quantity
    }));
    toast.success('Added to cart');
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
    const isInWishlist = wishlist.includes(product.id);
    const hasDiscount = selectedVariant.comparePrice && selectedVariant.comparePrice > selectedVariant.price;
    const discountPercentage = hasDiscount 
      ? Math.round(((selectedVariant.comparePrice! - selectedVariant.price) / selectedVariant.comparePrice!) * 100)
      : 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group ${
          viewMode === 'list' ? 'flex' : ''
        }`}
      >
        <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              viewMode === 'list' ? 'h-48' : 'h-64'
            }`}
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.newArrival && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                New
              </span>
            )}
            {product.featured && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Star className="w-3 h-3" />
                Featured
              </span>
            )}
            {product.trending && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => handleAddToWishlist(product.id)}
              className={`p-2 rounded-full shadow-lg transition-colors duration-200 ${
                isInWishlist 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-white text-gray-600 rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200">
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Stock indicator */}
          {selectedVariant.inventory <= 5 && selectedVariant.inventory > 0 && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Only {selectedVariant.inventory} left
              </span>
            </div>
          )}
          {selectedVariant.inventory === 0 && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className={`p-4 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500">{product.brand}</p>
              </div>
              {viewMode === 'list' && (
                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-gray-600">{product.rating} ({product.reviewCount})</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.shortDescription}
            </p>

            {viewMode === 'grid' && (
              <div className="flex items-center gap-1 mb-3 text-sm text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-gray-600">{product.rating} ({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Variant Selection */}
            {product.variants.length > 1 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-2 py-1 text-xs rounded border transition-colors duration-200 ${
                        selectedVariant.id === variant.id
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {Object.values(variant.attributes).join(' / ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                ${selectedVariant.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ${selectedVariant.comparePrice!.toFixed(2)}
                </span>
              )}
            </div>
            
            <button
              onClick={() => handleAddToCart(selectedVariant.id)}
              disabled={selectedVariant.inventory === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ShoppingCart className="w-4 h-4" />
              {viewMode === 'list' ? 'Add to Cart' : ''}
            </button>
          </div>
        </div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Catalog</h1>
        <p className="text-gray-600">Discover our amazing collection of products</p>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          <button
            onClick={() => setSelectedCategory('')}
            className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
              <span className="ml-2 text-sm opacity-75">({category.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="popularity">Popularity</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* View Mode */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 transition-colors duration-200 ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 transition-colors duration-200 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Results Info */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing {paginatedProducts.length} of {filteredProducts.length} products
          {selectedCategory && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* Products Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${currentPage}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`mb-8 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}
        >
          {paginatedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setFilters({
                categories: [],
                brands: [],
                priceRange: [0, 1000],
                rating: 0,
                inStock: false,
                onSale: false,
                featured: false,
                tags: []
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

export default ProductCatalog;