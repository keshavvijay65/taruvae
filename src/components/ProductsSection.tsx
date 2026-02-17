'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/context/CartContext';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { getAllProductsFromFirebase, subscribeToProducts } from '@/lib/firebaseProducts';
import type { Product as FirebaseProduct } from '@/lib/firebaseProducts';

// Helper function to infer weight from price for common products
function inferWeightFromPrice(price: number, productName: string): string {
    // Common price-to-weight mappings for oils
    const priceMap: { [key: number]: string } = {
        430: '1 KG', // Groundnut Oil 1000ml
        250: '500 ml',
        140: '250 ml',
        70: '100 ml',
        460: '1 KG', // Mustard Oil 1000ml
        260: '500 ml',
        150: '250 ml',
        80: '100 ml',
        450: '1 KG', // Sunflower/Coconut Oil 1000ml
        320: '500 ml',
        180: '250 ml',
        90: '100 ml',
        590: '1 KG', // Coconut Oil premium
        510: '1 KG', // Sesame Oil
        280: '500 ml',
        160: '250 ml',
    };

    // Check exact price match first
    if (priceMap[price]) {
        return priceMap[price];
    }

    // Check for approximate matches (within ₹10)
    for (const [priceKey, weight] of Object.entries(priceMap)) {
        if (Math.abs(price - parseInt(priceKey)) <= 10) {
            return weight;
        }
    }

    return '';
}

// Helper function to convert Firebase Product to CartContext Product
function convertToCartProduct(firebaseProduct: FirebaseProduct): Product {
    // Handle weight properly - check if it exists and is not empty
    let weight = firebaseProduct.weight;
    let size = (weight !== undefined && weight !== null && String(weight).trim().length > 0)
        ? String(weight).trim()
        : '';

    // If weight is missing, try to infer from price
    if (!size && firebaseProduct.price) {
        const inferredWeight = inferWeightFromPrice(firebaseProduct.price, firebaseProduct.name || '');
        if (inferredWeight) {
            size = inferredWeight;
        }
    }

    return {
        id: typeof firebaseProduct.id === 'string' ? parseInt(firebaseProduct.id) || 0 : firebaseProduct.id,
        name: (firebaseProduct.name || '').replace(/Peanut Oil/gi, 'Ground Nut Oil'),
        price: firebaseProduct.price || 0,
        image: firebaseProduct.image || '',
        rating: firebaseProduct.rating || 4.0,
        reviews: 0, // Default reviews
        inStock: firebaseProduct.stock !== undefined ? firebaseProduct.stock > 0 : true,
        category: firebaseProduct.category || '',
        size: size,
        description: firebaseProduct.description || '',
        // Preserve all boolean flags and optional fields from Firebase
        // Properly convert boolean values (handle string "true"/"false", numbers 1/0, and actual booleans)
        isNew: (firebaseProduct as any).isNew === true || (firebaseProduct as any).isNew === 'true' || (firebaseProduct as any).isNew === 1,
        isBestseller: (firebaseProduct as any).isBestseller === true || (firebaseProduct as any).isBestseller === 'true' || (firebaseProduct as any).isBestseller === 1,
        isPrime: (firebaseProduct as any).isPrime === true || (firebaseProduct as any).isPrime === 'true' || (firebaseProduct as any).isPrime === 1,
        // CRITICAL: Strict boolean conversion - handle string "true"/"false" and actual booleans
        showOnHome: (() => {
            const value = (firebaseProduct as any).showOnHome;
            if (value === true || value === 'true') return true;
            if (value === false || value === 'false') return false;
            return false; // Default to false if undefined/null
        })(),
        originalPrice: (firebaseProduct as any).originalPrice,
        discount: (firebaseProduct as any).discount,
        features: (firebaseProduct as any).features,
        benefits: (firebaseProduct as any).benefits,
    };
}

// No default products - only show products from admin panel/Firebase

// STRICT: IDs explicitly selected by user (Blue Marked) to show on home page
const HOME_DISPLAY_IDS = [
    3,  // A2 Cow Bilona Ghee (1 KG)
    8,  // Ground Nut Oil (1 L)
    12, // Black Mustard Oil (1 L)
    16, // Yellow Mustard Oil (1 L)
    20, // Coconut Oil (1 L)
    24, // Black Sesame (Gingelly) Oil (1 L)
    28, // White Sesame Oil (1 L)
    33, // Virgin Coconut Oil (250 ml)
    37, // Castor Oil (100 ml)
    40, // Extra Virgin Olive Oil (250 ml)
    42, // Almond Oil (100 ml)
    45, // Pure Hing (Asafoetida) (10 gm)
    47, // Garam Masala (100 gm)
    49  // Jeeravan Masala (100 gm)
];


const categories = [
    { id: 'all', label: 'All Products', icon: '🌿' },
    { id: 'oil', label: 'Oils', icon: '🫒' },
    { id: 'ghee', label: 'Ghee', icon: '🧈' },
    { id: 'superfoods', label: 'Spices', icon: '🌶️' },
    { id: 'combo', label: 'Combo', icon: '📦' },
];

export default function ProductsSection() {
    // Only show products from admin panel/Firebase, no default products
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Debug: Log category changes
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[ProductsSection] Active category changed to:', activeCategory);
        }
    }, [activeCategory]);

    // Load products from Firebase (with real-time updates) - Only products marked "Show on Home"
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setIsLoading(true);
                // Load from Firebase with timeout to prevent hanging
                const firebaseProducts = await Promise.race([
                    getAllProductsFromFirebase(),
                    new Promise<FirebaseProduct[]>((resolve) => setTimeout(() => resolve([]), 5000))
                ]);

                if (firebaseProducts && firebaseProducts.length > 0) {
                    // Convert Firebase Products to CartContext Products
                    const cartProducts = firebaseProducts.map(convertToCartProduct);

                    // Prevent blank cards: require name + valid price
                    const usableProducts = cartProducts.filter((p: Product) => {
                        const hasName = Boolean(p.name && String(p.name).trim().length > 0);
                        const hasPrice = Number(p.price) > 0;
                        return hasName && hasPrice;
                    });

                    // STRICT: Only show products explicitly marked "Show on Home"
                    // OVERRIDE: Use the hardcoded list of IDs to guarantee correct display regardless of DB state
                    const homeProducts = usableProducts.filter((p: Product) => {
                        if (HOME_DISPLAY_IDS.includes(p.id)) {
                            return true;
                        }
                        return false;
                    });

                    // Show ALL products marked "Show on Home" (not just one per category)
                    if (homeProducts.length > 0) {
                        // Sort by bestseller first, then by price (highest first) for better display
                        const sorted = [...homeProducts].sort((a, b) => {
                            if (a.isBestseller && !b.isBestseller) return -1;
                            if (!a.isBestseller && b.isBestseller) return 1;
                            return b.price - a.price; // Higher price first
                        });
                        setDisplayProducts(sorted);
                    } else {
                        // No products marked for home - show empty
                        setDisplayProducts([]);
                    }
                } else {
                    // No products in Firebase/admin panel - show empty
                    setDisplayProducts([]);
                }
            } catch (error) {
                console.error('Error loading products:', error);
                // Fallback to localStorage
                const adminProducts = localStorage.getItem('taruvae-admin-products');
                if (adminProducts !== null) {
                    try {
                        const parsed = JSON.parse(adminProducts);
                        if (parsed && Array.isArray(parsed)) {
                            // Filter ONLY by showOnHome === true (strict - no fallback)
                            // OVERRIDE: Use the hardcoded list of IDs to guarantee correct display
                            const homeProducts = parsed.filter((product: Product) => {
                                const hasName = Boolean(product.name && String(product.name).trim().length > 0);
                                const hasPrice = Number(product.price) > 0;

                                // Check if ID is in our allowed list
                                if (HOME_DISPLAY_IDS.includes(product.id)) {
                                    return hasName && hasPrice;
                                }
                                return false;
                            });
                            if (homeProducts.length > 0) {
                                // Show ALL products marked "Show on Home" (not just one per category)
                                const sorted = [...homeProducts].sort((a, b) => {
                                    if (a.isBestseller && !b.isBestseller) return -1;
                                    if (!a.isBestseller && b.isBestseller) return 1;
                                    return b.price - a.price;
                                });
                                setDisplayProducts(sorted);
                            } else {
                                setDisplayProducts([]);
                            }
                        } else {
                            setDisplayProducts([]);
                        }
                    } catch (parseError) {
                        console.error('Error parsing admin products:', parseError);
                        setDisplayProducts([]);
                    }
                } else {
                    setDisplayProducts([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();

        // Subscribe to real-time updates from Firebase (debounced to prevent excessive re-renders)
        let subscriptionTimeout: NodeJS.Timeout;
        let isInitialSubscription = true;
        const unsubscribe = subscribeToProducts((updatedProducts) => {
            // Skip first callback to avoid duplicate load
            if (isInitialSubscription) {
                isInitialSubscription = false;
                return;
            }

            // Debounce subscription updates to prevent excessive re-renders
            clearTimeout(subscriptionTimeout);
            subscriptionTimeout = setTimeout(() => {
                if (updatedProducts && updatedProducts.length > 0) {
                    // Convert Firebase Products to CartContext Products
                    const cartProducts = updatedProducts.map(convertToCartProduct);

                    // Prevent blank cards: require name + valid price
                    const usableProducts = cartProducts.filter((p: Product) => {
                        const hasName = Boolean(p.name && String(p.name).trim().length > 0);
                        const hasPrice = Number(p.price) > 0;
                        return hasName && hasPrice;
                    });

                    // STRICT: Only show products explicitly marked "Show on Home"
                    // OVERRIDE: Use the hardcoded list of IDs to guarantee correct display regardless of DB state
                    const homeProducts = usableProducts.filter((p: Product) => {
                        if (HOME_DISPLAY_IDS.includes(p.id)) {
                            return true;
                        }
                        return false;
                    });

                    // Show ALL products marked "Show on Home" (not just one per category)
                    if (homeProducts.length > 0) {
                        // Sort by bestseller first, then by price (highest first) for better display
                        const sorted = [...homeProducts].sort((a, b) => {
                            if (a.isBestseller && !b.isBestseller) return -1;
                            if (!a.isBestseller && b.isBestseller) return 1;
                            return b.price - a.price; // Higher price first
                        });
                        setDisplayProducts(sorted);
                    } else {
                        // No products marked for home - show empty
                        setDisplayProducts([]);
                    }
                }
            }, 300); // 300ms debounce
        });

        return () => {
            clearTimeout(subscriptionTimeout);
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Filter products by category - Products marked "Show on Home"
    const filteredProducts = useMemo(() => {
        // Products are already filtered to showOnHome in displayProducts
        // STRICT: Filter by selected category - only show matching products
        if (activeCategory === 'all') {
            return displayProducts;
        }

        // Strict category filter - exact match required
        const filtered = displayProducts.filter(product => {
            if (!product || !product.category) return false;

            const productCategory = String(product.category).toLowerCase().trim();
            const selectedCategory = String(activeCategory).toLowerCase().trim();

            // Exact match only
            const matches = productCategory === selectedCategory;

            // Debug logging
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Filter] "${product.name}" - Category: "${productCategory}", Selected: "${selectedCategory}", Match: ${matches}`);
            }

            return matches;
        });

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Filter] Category: "${activeCategory}" | Total: ${displayProducts.length} | Filtered: ${filtered.length}`);
        }

        return filtered;
    }, [displayProducts, activeCategory]);

    // Dedupe variants: render ONE stable card per product name/category.
    // Choose ONE default variant (prefer largest; otherwise first).
    const stableProducts = useMemo(() => {
        const order: string[] = [];
        const map = new Map<string, { key: string; variants: Product[] }>();

        const sizeValue = (size?: string) => {
            const raw = String(size || '').trim().toLowerCase();
            const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
            if (!Number.isFinite(num)) return Number.POSITIVE_INFINITY;
            if (raw.includes('ml')) return num;
            if (raw.includes('litre') || raw.match(/\bl\b/)) return num * 1000;
            if (raw.includes('kg')) return num * 1000;
            if (raw.match(/\bg\b/) || raw.includes('gm')) return num;
            return Number.POSITIVE_INFINITY;
        };

        const hasValidData = (p: Product) => {
            const name = String(p?.name || '').trim();
            const price = Number(p?.price);
            const image = String(p?.image || '').trim();
            const hasRequired = Boolean(name) && Number.isFinite(price) && price > 0 && Boolean(image);
            const isKnownMissingImage =
                !image ||
                image.includes('products image available soon') ||
                image === '/images/all/products image available soon.png' ||
                image === '/placeholder.png';
            return hasRequired && !isKnownMissingImage;
        };

        for (const p of filteredProducts) {
            if (!p || !hasValidData(p)) continue;

            // FORCE RENAME: Ensure Ground Nut Oil is used everywhere
            // This catches any data source that might still have "Peanut Oil"
            if (p.name && /Peanut Oil/i.test(p.name)) {
                p.name = p.name.replace(/Peanut Oil/gi, 'Ground Nut Oil');
            }

            const key = `${String(p.name).trim().toLowerCase()}|${String(p.category || '').trim().toLowerCase()}`;
            if (!map.has(key)) {
                map.set(key, { key, variants: [] });
                order.push(key);
            }
            map.get(key)!.variants.push(p);
        }

        return order.map((k) => {
            const group = map.get(k)!;
            // Prefer largest size, otherwise first.
            const sorted = [...group.variants].sort((a, b) => sizeValue(a.size) - sizeValue(b.size));
            const selected = sorted.length > 0 ? sorted[sorted.length - 1] : group.variants[0];
            return { key: group.key, product: selected };
        }).filter(Boolean);
    }, [filteredProducts]);

    return (
        <section className="py-24 relative overflow-hidden bg-cream-light">
            {/* Organic Background Textures */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] aspect-square bg-brand-200/20 rounded-full blur-[120px] animate-soft-pulse" />
                <div className="absolute bottom-[5%] left-[-5%] w-[35%] aspect-square bg-gold-200/15 rounded-full blur-[100px] animate-soft-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
                    <span className="inline-block text-gold font-bold uppercase tracking-[0.2em] text-[10px] bg-gold/5 px-4 py-1.5 rounded-full">
                        Pure & Organic Collection
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-forest leading-tight">
                        Our Natural Products
                    </h2>
                    <p className="text-text-secondary text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto opacity-80">
                        Experience the essence of purity with our traditionally crafted collection, directly from the heart of organic farms.
                    </p>
                </div>

                {/* Category Navigation */}
                <div className="flex flex-col items-center mb-12 space-y-8">
                    <div className="flex flex-wrap justify-center gap-3 p-2 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-premium-sm inline-flex">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${activeCategory === category.id
                                    ? 'bg-brand-forest text-white shadow-premium'
                                    : 'text-brand-forest/60 hover:text-brand-forest hover:bg-white/80'
                                    }`}
                            >
                                <span className="text-base leading-none">{category.icon}</span>
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="min-h-[400px] relative">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <ProductCardSkeleton key={`skeleton-${index}`} />
                            ))}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
                            {filteredProducts.map((product, index) => (
                                <ProductCard key={product.id} product={product} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-6 max-w-md mx-auto">
                            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-3xl">
                                🌿
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-serif font-bold text-brand-forest">Coming Soon</h3>
                                <p className="text-text-secondary">We're carefully preparing these organic treasures for you. Stay tuned!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section Footer Actions */}
                <div className="mt-20 text-center">
                    <Link
                        href="/products"
                        className="group relative inline-flex items-center gap-4 bg-brand-forest text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 hover:bg-brand-forest-dark shadow-premium hover:shadow-forest overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <span className="relative">Explore All Products</span>
                        <svg className="w-4 h-4 relative transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                {/* Trust Indicators */}
                <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: '🌿', title: '100% Organic', desc: 'Certified pure origin' },
                        { icon: '🏺', title: 'Traditional', desc: 'Ancient crafting methods' },
                        { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹500' },
                        { icon: '⭐', title: 'Top Rated', desc: 'Trusted by 10k+ families' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-6 bg-white/40 rounded-2xl border border-white/60 group hover:bg-white/80 transition-all duration-300">
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500">{item.icon}</span>
                            <div>
                                <h4 className="font-bold text-brand-forest text-sm uppercase tracking-wider">{item.title}</h4>
                                <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
