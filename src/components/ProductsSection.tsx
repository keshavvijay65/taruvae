'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/context/CartContext';
import ProductCard from './ProductCard';
import { getAllProductsFromFirebase, subscribeToProducts } from '@/lib/firebaseProducts';

// Featured products for homepage - showing best sellers
const products: Product[] = [
    {
        id: 1,
        name: 'Cold Pressed Peanut Oil',
        price: 430,
        image: '/images/products/groundnut oi.jpg',
        rating: 4.5,
        reviews: 128,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
        isNew: true,
    },
    {
        id: 2,
        name: 'Premium Desi Cow Bilona Ghee',
        price: 1450,
        image: '/images/products/ghee.jpg',
        rating: 4.8,
        reviews: 256,
        inStock: true,
        category: 'ghee',
        size: '1 KG',
        isNew: true,
        isBestseller: true,
    },
    {
        id: 3,
        name: 'Cold Pressed Coconut Oil',
        price: 590,
        image: '/images/products/coconut-oil.jpg',
        rating: 4.6,
        reviews: 189,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
        isNew: true,
    },
    {
        id: 4,
        name: 'Virgin Coconut Oil',
        price: 1290,
        image: '/images/products/coconut-oil.jpg',
        rating: 4.8,
        reviews: 203,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
        isNew: true,
    },
    {
        id: 5,
        name: 'Cold Pressed Sunflower Oil',
        price: 450,
        image: '/images/products/sunflower-oil.jpg',
        rating: 4.4,
        reviews: 167,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
    },
    {
        id: 6,
        name: 'Cold Pressed Mustard Oil',
        price: 460,
        image: '/images/products/mustard oil.jpg',
        rating: 4.6,
        reviews: 145,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
    },
    {
        id: 7,
        name: 'Cold Pressed Sesame Oil',
        price: 510,
        image: '/images/products/seasame oil.jpg',
        rating: 4.7,
        reviews: 178,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
    },
    {
        id: 8,
        name: 'Cold Pressed Olive Oil',
        price: 1810,
        image: '/images/products/olive-oil.jpg',
        rating: 4.5,
        reviews: 156,
        inStock: true,
        category: 'oil',
        size: '1000 ml',
    },
];

const categories = [
    { id: 'all', label: 'All Products', icon: '🌿' },
    { id: 'oil', label: 'Oils', icon: '🫒' },
    { id: 'ghee', label: 'Ghee', icon: '🧈' },
    { id: 'superfoods', label: 'Spices', icon: '🌶️' },
];

export default function ProductsSection() {
    const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Load products from Firebase (with real-time updates) - Only Bestsellers
    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Load from Firebase
                const firebaseProducts = await getAllProductsFromFirebase();
                
                if (firebaseProducts && firebaseProducts.length > 0) {
                    // Filter only bestseller products
                    const bestsellerProducts = firebaseProducts.filter((product: Product) => product.isBestseller === true);
                    setDisplayProducts(bestsellerProducts);
                } else {
                    // If no products in Firebase, use default bestsellers
                    const bestsellerProducts = products.filter(product => product.isBestseller === true);
                    setDisplayProducts(bestsellerProducts);
                }
            } catch (error) {
                console.error('Error loading products:', error);
                // Fallback to localStorage
                const adminProducts = localStorage.getItem('taruvae-admin-products');
                if (adminProducts !== null) {
                    try {
                        const parsed = JSON.parse(adminProducts);
                        if (parsed && Array.isArray(parsed)) {
                            const bestsellerProducts = parsed.filter((product: Product) => product.isBestseller === true);
                            setDisplayProducts(bestsellerProducts);
                            return;
                        }
                    } catch (parseError) {
                        console.error('Error parsing admin products:', parseError);
                    }
                }
                // Final fallback to default bestsellers
                const bestsellerProducts = products.filter(product => product.isBestseller === true);
                setDisplayProducts(bestsellerProducts);
            }
        };

        loadProducts();

        // Subscribe to real-time updates from Firebase
        const unsubscribe = subscribeToProducts((updatedProducts) => {
            if (updatedProducts && updatedProducts.length > 0) {
                // Filter only bestseller products
                const bestsellerProducts = updatedProducts.filter((product: Product) => product.isBestseller === true);
                setDisplayProducts(bestsellerProducts);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Filter products by category - Only Bestsellers
    const filteredProducts = useMemo(() => {
        // First filter only bestsellers
        const bestsellerProducts = displayProducts.filter(product => product.isBestseller === true);
        
        if (activeCategory === 'all') {
            return bestsellerProducts;
        }
        return bestsellerProducts.filter(product => product.category === activeCategory);
    }, [displayProducts, activeCategory]);

    return (
        <section className="py-16 md:py-20 lg:py-24 bg-white relative w-full max-w-full">
            {/* Subtle Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full opacity-3 pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#2D5016] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-10 w-full">
                {/* Clean Section Header */}
                <div className="text-center mb-10 sm:mb-12 md:mb-14">
                    <div className="inline-block mb-2 sm:mb-3">
                        <span className="text-[#D4AF37] text-xs sm:text-sm font-medium uppercase tracking-wider">
                            Premium Collection
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D5016] mb-3 sm:mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        Featured Products
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mb-6">
                        Premium organic products crafted with care and tradition
                    </p>
                    
                    {/* Trust Badges - Clean Design */}
                    <div className="flex items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <span className="text-yellow-400 text-base">⭐</span>
                            <span className="font-medium">4.5+ Rating</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base">🚚</span>
                            <span className="font-medium">Free Delivery</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base">✅</span>
                            <span className="font-medium">100% Pure</span>
                        </div>
                    </div>
                </div>

                {/* Category Tabs - Clean Modern Design */}
                <div className="mb-8 sm:mb-10 md:mb-12">
                    {/* Mobile: Horizontal Scroll */}
                    <div className="block sm:hidden -mx-4 px-4">
                        <div 
                            className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2" 
                            style={{ 
                                scrollbarWidth: 'none', 
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            <div className="inline-flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-md border border-gray-200 min-w-max">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveCategory(category.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 snap-start flex-shrink-0 ${
                                            activeCategory === category.id
                                                ? 'bg-[#2D5016] text-white shadow-sm'
                                                : 'text-gray-600 hover:text-[#2D5016] hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-base">{category.icon}</span>
                                        <span>{category.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Desktop: Centered Layout */}
                    <div className="hidden sm:flex justify-center">
                        <div className="inline-flex items-center gap-1.5 bg-white rounded-2xl p-1.5 shadow-md border border-gray-200">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                                        activeCategory === category.id
                                            ? 'bg-[#2D5016] text-white shadow-sm'
                                            : 'text-gray-600 hover:text-[#2D5016] hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-base">{category.icon}</span>
                                    <span>{category.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Products Grid - Same as Products Page */}
                <div className="relative w-full">
                    {/* Products Grid - All products visible, no horizontal scroll */}
                    <div className="w-full">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 w-full">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product, index) => (
                                    <div key={product.id} className="w-full min-w-0">
                                        <ProductCard product={product} index={index} />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <div className="mb-4">
                                        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 text-lg font-medium">No products found in this category.</p>
                                    <p className="text-gray-400 text-sm mt-2">Try selecting a different category</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced View All Button */}
                <div className="text-center mt-10 sm:mt-12 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
                    </div>
                    <Link
                        href="/products"
                        className="relative inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#2D5016] to-[#1F4F2B] hover:from-[#D4AF37] hover:to-[#B8941F] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
                    >
                        <span>View All Products</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>


                {/* Trust Badges - Enhanced */}
                <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">✅</div>
                        <p className="text-xs sm:text-sm font-semibold text-[#2D5016]">100% Pure</p>
                        <p className="text-[10px] text-gray-500 mt-1">Certified Organic</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">🚚</div>
                        <p className="text-xs sm:text-sm font-semibold text-[#2D5016]">Free Shipping</p>
                        <p className="text-[10px] text-gray-500 mt-1">Above ₹500</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">⭐</div>
                        <p className="text-xs sm:text-sm font-semibold text-[#2D5016]">Premium Quality</p>
                        <p className="text-[10px] text-gray-500 mt-1">4.5+ Rating</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">🌾</div>
                        <p className="text-xs sm:text-sm font-semibold text-[#2D5016]">Farm Fresh</p>
                        <p className="text-[10px] text-gray-500 mt-1">Direct from Farmers</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
