'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useCart, Product } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllProductsFromFirebase, subscribeToProducts, getAllCategoriesFromFirebase, subscribeToCategories, Category } from '@/lib/firebaseProducts';
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
        name: firebaseProduct.name || '',
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
        includedProducts: (firebaseProduct as any).includedProducts,
    };
}



type QuickFilter = {
    id: string;
    label: string;
    icon: ReactNode;
};

const filterMeta: Record<string, { title: string; description: string }> = {
    all: {
        title: 'All Products',
        description: 'Discover our complete range of premium organic products',
    },
    new: {
        title: 'New Arrivals',
        description: 'Freshly added batches sourced from our trusted farmers',
    },
    ghee: {
        title: 'Artisanal Desi Ghee',
        description: 'Slow-crafted ghee made from A2 milk using the Bilona method',
    },
    oil: {
        title: 'Cold-Pressed Oils',
        description: 'Pure, chemical-free oils packed with natural nutrients',
    },
    deals: {
        title: 'Best Deals',
        description: 'High-value picks with exciting savings and offers',
    },
    superfoods: {
        title: 'Superfoods & Spices',
        description: 'Immunity-boosting blends and wholesome pantry heroes',
    },
    combo: {
        title: 'Combo Packs',
        description: 'Curated bundles for everyday cooking and gifting',
    },
    'under-499': {
        title: 'Under ₹499',
        description: 'Budget-friendly choices without compromising purity',
    },
    'under-999': {
        title: 'Under ₹999',
        description: 'Premium essentials under ₹999',
    },
};

const quickFilterConfig: QuickFilter[] = [
    {
        id: 'new',
        label: 'New',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 2l2.39 4.85 5.35.78-3.87 3.77.91 5.32L12 14.77l-4.78 2.51.91-5.32L4.26 7.63l5.35-.78L12 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'ghee',
        label: 'Ghee',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 8h12l-1 10H7L6 8z" />
                <path d="M9 8a3 3 0 116 0" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'oil',
        label: 'Oil',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l4 5a4.5 4.5 0 11-8 0l4-5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'deals',
        label: 'Deals',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 13l4 8h8l4-8-4-8H8z" />
                <path d="M9 13h6" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'superfoods',
        label: 'Superfoods',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 4c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" />
                <path d="M8 10c0 2.2 1.8 4 4 4s4-1.8 4-4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'combo',
        label: 'Combo',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="5" y="7" width="14" height="10" rx="2" />
                <path d="M9 7v10M15 7v10" />
            </svg>
        ),
    },
    {
        id: 'under-499',
        label: 'Under ₹499',
        icon: (
            <span className="text-xs font-semibold">₹499</span>
        ),
    },
    {
        id: 'under-999',
        label: 'Under ₹999',
        icon: (
            <span className="text-xs font-semibold">₹999</span>
        ),
    },
    {
        id: 'all',
        label: 'All',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="8" />
                <path d="M8 12h8" strokeLinecap="round" />
            </svg>
        ),
    },
];

function AllProductsContent() {
    const { addToCart, cart } = useCart();
    // Only show products from admin panel/Firebase, no default products
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load products from Firebase/admin panel only
    useEffect(() => {
        // Load Firebase data (admin panel products only)
        const loadProducts = async () => {
            try {
                setIsLoading(true);
                // Load from Firebase with timeout protection
                let firebaseProducts: any[] = [];
                try {
                    firebaseProducts = await Promise.race([
                        getAllProductsFromFirebase(),
                        new Promise<any[]>((_, reject) =>
                            setTimeout(() => reject(new Error('Products load timeout')), 5000)
                        )
                    ]);
                } catch (firebaseError) {
                    console.warn('Firebase load failed or timed out:', firebaseError);
                }

                if (firebaseProducts && Array.isArray(firebaseProducts) && firebaseProducts.length > 0) {
                    // Convert Firebase Products to CartContext Products
                    const firebaseProductsList = firebaseProducts.map(convertToCartProduct);

                    // Show ALL products from Firebase (removed image filter)
                    setProducts(firebaseProductsList);
                } else {
                    // No products in Firebase, check localStorage as fallback
                    if (typeof window !== 'undefined') {
                        const adminProducts = localStorage.getItem('taruvae-admin-products');
                        if (adminProducts !== null) {
                            try {
                                const parsed = JSON.parse(adminProducts);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    const convertedProducts = parsed.map(convertToCartProduct);
                                    // Show ALL products (removed image filter)
                                    setProducts(convertedProducts);
                                } else {
                                    setProducts([]);
                                }
                            } catch (parseError) {
                                console.error('Error parsing admin products:', parseError);
                                setProducts([]);
                            }
                        } else {
                            setProducts([]);
                        }
                    } else {
                        setProducts([]);
                    }
                }
            } catch (error) {
                console.error('Error loading products:', error);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Load products from admin panel
        loadProducts();

        // Subscribe to real-time updates from Firebase (debounced to avoid excessive updates)
        // Skip initial callback to prevent duplicate load
        let isInitialSubscription = true;
        let updateTimeout: NodeJS.Timeout;
        const unsubscribe = subscribeToProducts((updatedProducts) => {
            // Skip the first callback since we already loaded products above
            if (isInitialSubscription) {
                isInitialSubscription = false;
                return;
            }

            // Debounce updates to prevent excessive re-renders
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                // Only show products from Firebase/admin panel, no default products
                if (updatedProducts && Array.isArray(updatedProducts) && updatedProducts.length > 0) {
                    const firebaseProductsList = updatedProducts.map(convertToCartProduct);

                    // Show ALL products from Firebase (removed image filter)
                    // Products with placeholder images will still be visible to users
                    setProducts(firebaseProductsList);
                    setIsLoading(false);
                } else {
                    setProducts([]);
                    setIsLoading(false);
                }
            }, 300);
        });

        return () => {
            if (updateTimeout) clearTimeout(updateTimeout);
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Load categories from Firebase (non-blocking with timeout)
    useEffect(() => {
        // Load categories in background with timeout protection
        const loadCategories = async () => {
            try {
                let loadedCategories: Category[] = [];
                try {
                    loadedCategories = await Promise.race([
                        getAllCategoriesFromFirebase(),
                        new Promise<Category[]>((_, reject) =>
                            setTimeout(() => reject(new Error('Categories timeout')), 5000)
                        )
                    ]);
                } catch (firebaseError) {
                    console.warn('Categories load failed or timed out:', firebaseError);
                }

                if (loadedCategories && Array.isArray(loadedCategories) && loadedCategories.length > 0) {
                    setCategories(loadedCategories);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();

        // Subscribe to real-time category updates (debounced, skip initial callback)
        let isInitialSubscription = true;
        let updateTimeout: NodeJS.Timeout;
        const unsubscribe = subscribeToCategories((updatedCategories) => {
            // Skip first callback to prevent duplicate load
            if (isInitialSubscription) {
                isInitialSubscription = false;
                return;
            }

            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                if (Array.isArray(updatedCategories)) {
                    setCategories(updatedCategories);
                }
            }, 300);
        });

        return () => {
            if (updateTimeout) clearTimeout(updateTimeout);
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Note: Removed fallback to defaults - if no products marked for home, show empty
    // User needs to mark products with showOnHome === true in admin panel

    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('default');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [inlineSearchTerm, setInlineSearchTerm] = useState('');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    // Build dynamic filter metadata from categories
    const dynamicFilterMeta = useMemo(() => {
        const baseMeta = { ...filterMeta };

        // Add metadata for dynamic categories
        categories.forEach(cat => {
            if (!baseMeta[cat.value]) {
                baseMeta[cat.value] = {
                    title: cat.label,
                    description: `Explore our premium ${cat.label.toLowerCase()} collection`,
                };
            }
        });

        return baseMeta;
    }, [categories]);

    // Build dynamic quick filters from categories
    const quickFilters = useMemo(() => {
        const staticFilters = [
            {
                id: 'new',
                label: 'New',
                icon: (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 2l2.39 4.85 5.35.78-3.87 3.77.91 5.32L12 14.77l-4.78 2.51.91-5.32L4.26 7.63l5.35-.78L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },
            {
                id: 'deals',
                label: 'Deals',
                icon: (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4 13l4 8h8l4-8-4-8H8z" />
                        <path d="M9 13h6" strokeLinecap="round" />
                    </svg>
                ),
            },
        ];

        // Get unique category values from products
        const usedCategoryValues = new Set(products.map(p => p.category).filter(Boolean));

        // Filter categories to only include those that have products
        const usedCategories = categories.filter(cat => usedCategoryValues.has(cat.value));

        // Map categories to filter format with icons
        const categoryFilters = usedCategories.map((cat) => {
            // Default icon for categories
            let icon = (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" strokeLinecap="round" />
                </svg>
            );

            // Custom icons for known categories
            if (cat.value === 'oil') {
                icon = (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 3l4 5a4.5 4.5 0 11-8 0l4-5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            } else if (cat.value === 'ghee') {
                icon = (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M6 8h12l-1 10H7L6 8z" />
                        <path d="M9 8a3 3 0 116 0" strokeLinecap="round" />
                    </svg>
                );
            } else if (cat.value === 'superfoods') {
                icon = (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 4c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" />
                        <path d="M8 10c0 2.2 1.8 4 4 4s4-1.8 4-4" strokeLinecap="round" />
                    </svg>
                );
            } else if (cat.value === 'combo') {
                icon = (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <rect x="5" y="7" width="14" height="10" rx="2" />
                        <path d="M9 7v10M15 7v10" />
                    </svg>
                );
            }

            return {
                id: cat.value,
                label: cat.label,
                icon,
            };
        });

        const priceFilters = [
            {
                id: 'under-499',
                label: 'Under ₹499',
                icon: <span className="text-xs font-semibold">₹499</span>,
            },
            {
                id: 'under-999',
                label: 'Under ₹999',
                icon: <span className="text-xs font-semibold">₹999</span>,
            },
        ];

        const allFilter = {
            id: 'all',
            label: 'All',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M8 12h8" strokeLinecap="round" />
                </svg>
            ),
        };

        return [...staticFilters, ...categoryFilters, ...priceFilters, allFilter];
    }, [categories, products]);
    const activeFilterContent = dynamicFilterMeta[activeFilter] ?? dynamicFilterMeta.all;
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const filterParam = searchParams.get('filter');
        // Support known category filters from header navigation
        const knownFilters = ['all', 'new', 'deals', 'under-499', 'under-999', 'oil', 'ghee', 'superfoods', 'combo'];
        if (filterParam && (knownFilters.includes(filterParam) || dynamicFilterMeta[filterParam])) {
            setActiveFilter(filterParam);
        } else {
            // Default to 'all' if no filter param or invalid filter
            setActiveFilter('all');
        }

        const searchParam = searchParams.get('search') || '';
        setSearchKeyword(searchParam);
        setInlineSearchTerm(searchParam);
    }, [searchParams, dynamicFilterMeta]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Quick filter logic
        if (activeFilter === 'new') {
            filtered = filtered.filter(p => p.isNew);
        } else if (activeFilter === 'deals') {
            // Filter products with discount >= 15%
            // Calculate discount from originalPrice if discount field is not present
            filtered = filtered.filter(p => {
                let discountValue = p.discount ?? 0;
                // If discount not set but originalPrice is set, calculate it
                if (!discountValue && p.originalPrice && p.originalPrice > p.price) {
                    discountValue = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                }
                return discountValue >= 15;
            });
        } else if (activeFilter === 'under-499') {
            filtered = filtered.filter(p => p.price <= 499);
        } else if (activeFilter === 'under-999') {
            filtered = filtered.filter(p => p.price <= 999);
        } else if (activeFilter === 'all') {
            // Show all products - no filtering needed
            filtered = products;
        } else {
            // STRICT: Category filter - filter by product.category directly
            // Support known category filters: oil, ghee, superfoods, combo
            const knownCategories = ['oil', 'ghee', 'superfoods', 'combo'];
            if (knownCategories.includes(activeFilter)) {
                // Strict filtering - only show products matching the selected category
                filtered = filtered.filter(p => {
                    const productCategory = String(p.category || '').toLowerCase().trim();
                    const selectedCategory = String(activeFilter).toLowerCase().trim();
                    return productCategory === selectedCategory;
                });
            } else {
                // Unknown filter - show empty (not all products)
                filtered = [];
            }
        }

        if (searchKeyword.trim()) {
            const q = searchKeyword.trim().toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
        }

        // Sort
        switch (sortBy) {
            case 'price-low':
                filtered = [...filtered].sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered = [...filtered].sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name':
                filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }

        return filtered;
    }, [activeFilter, sortBy, searchKeyword, products, categories]);

    // Dedupe variants: render ONE stable card per product name/category.
    // Choose ONE default variant (prefer largest; otherwise first).
    const stableProducts = useMemo(() => {
        const order: string[] = [];
        const map = new Map<string, { key: string; variants: any[] }>();

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

        const hasValidData = (p: any) => {
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
            if (!hasValidData(p)) continue;

            const key = `${String(p.name).trim().toLowerCase()}|${String(p.category || '').trim().toLowerCase()}`;
            if (!map.has(key)) {
                map.set(key, { key, variants: [] });
                order.push(key);
            }
            map.get(key)!.variants.push(p);
        }

        return order.map((k) => {
            const group = map.get(k)!;
            const sorted = [...group.variants].sort((a, b) => sizeValue(a.size) - sizeValue(b.size));
            const selected = sorted.length > 0 ? sorted[sorted.length - 1] : group.variants[0];
            return { key: group.key, product: selected };
        }).filter(Boolean);
    }, [filteredProducts]);

    const handleQuickFilterClick = (filterId: string) => {
        setActiveFilter(filterId);
        // Update URL query parameter to match header navigation links
        const params = new URLSearchParams(searchParams.toString());
        if (filterId === 'all') {
            params.delete('filter');
        } else {
            params.set('filter', filterId);
        }
        router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    };

    const updateSearchQuery = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set('search', query);
        } else {
            params.delete('search');
        }
        router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const handleInlineSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateSearchQuery(inlineSearchTerm.trim());
    };

    const handleInlineSearchClear = () => {
        setInlineSearchTerm('');
        updateSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-cream-light font-sans">


            {/* Page Hero - Premium Storytelling Style */}
            <div className="pt-[calc(var(--header-height,80px)+2rem)] pb-12 relative overflow-hidden bg-white">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-brand-100/20 to-transparent" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-100/20 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="max-w-3xl space-y-4">
                        <span className="inline-block text-gold font-bold uppercase tracking-[0.2em] text-[10px] bg-gold/5 px-4 py-1.5 rounded-full">
                            Our Collection
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-forest leading-tight">
                            {activeFilterContent.title}
                        </h1>
                        <p className="text-text-secondary text-base md:text-lg font-medium leading-relaxed opacity-80 max-w-2xl">
                            {activeFilterContent.description}
                        </p>

                        {searchKeyword && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-lg border border-brand-100 mt-4">
                                <span className="text-brand-forest text-xs font-bold">Search results for:</span>
                                <span className="text-gold text-xs font-bold italic">"{searchKeyword}"</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Navigation & Controls */}
            <div className="sticky top-[var(--header-height,80px)] z-40 bg-white/80 backdrop-blur-xl border-y border-brand-100/50 shadow-premium-sm">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between gap-6 py-4">
                        {/* Quick Filter Pill Navigation */}
                        <div className="flex-1 overflow-x-auto scrollbar-hide py-1">
                            <div className="flex gap-3">
                                {quickFilters.map((filter) => {
                                    const isActive = activeFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => handleQuickFilterClick(filter.id)}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap group ${isActive
                                                ? 'bg-brand-forest text-white shadow-premium'
                                                : 'bg-cream-light/50 text-brand-forest/60 hover:text-brand-forest hover:bg-cream-light'
                                                }`}
                                        >
                                            <span className={`text-base leading-none transition-transform group-hover:scale-110 ${isActive ? '' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                                {filter.icon}
                                            </span>
                                            <span>{filter.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search & Sort - Hidden on mobile if space is tight, or shown in a compact way */}
                        <div className="hidden lg:flex items-center gap-4">
                            <form onSubmit={handleInlineSearchSubmit} className="relative w-64">
                                <input
                                    type="text"
                                    value={inlineSearchTerm}
                                    onChange={(e) => setInlineSearchTerm(e.target.value)}
                                    placeholder="Search within..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-100 bg-white/50 focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/10 text-sm placeholder:text-text-secondary/50 transition-all font-medium"
                                />
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </form>

                            <div className="h-8 w-px bg-brand-100/50" />

                            <div className="relative">
                                <button
                                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                    className="flex items-center gap-2 group"
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/60 group-hover:text-brand-forest transition-colors">
                                        Sort By
                                    </span>
                                    <div className="px-3 py-2 bg-cream-light rounded-lg border border-brand-100 flex items-center gap-3 min-w-[140px] group-hover:border-gold transition-all">
                                        <span className="text-[10px] font-bold text-brand-forest truncate">
                                            {sortBy === 'default' ? 'Featured' : sortBy.replace('-', ': ')}
                                        </span>
                                        <svg className={`w-3.5 h-3.5 text-gold transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {isSortDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortDropdownOpen(false)} />
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-premium-xl border border-brand-100 z-50 py-3 animate-scale-in">
                                            {[
                                                { value: 'default', label: 'Featured Selection' },
                                                { value: 'price-low', label: 'Price: Low to High' },
                                                { value: 'price-high', label: 'Price: High to Low' },
                                                { value: 'rating', label: 'Customer Rating' },
                                                { value: 'name', label: 'Name: A to Z' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value);
                                                        setIsSortDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${sortBy === option.value
                                                        ? 'bg-brand-50 text-brand-forest'
                                                        : 'text-brand-forest/60 hover:bg-cream-light hover:text-brand-forest'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-forest/40">
                        Displaying <span className="text-brand-forest">{filteredProducts.length}</span> Organic Treasures
                    </p>

                    {/* Mobile Only: Sort/Search Trigger */}
                    <div className="lg:hidden flex gap-2">
                        {/* Compact Mobile Controls could go here */}
                    </div>
                </div>

                {/* Grid */}
                <div className="min-h-[600px] relative">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <ProductCardSkeleton key={`skeleton-${index}`} />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-32 text-center bg-white rounded-[3rem] border border-brand-100 shadow-premium-sm space-y-6 max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-4xl grayscale opacity-50">
                                🌿
                            </div>
                            <div className="space-y-3 px-8">
                                <h3 className="text-3xl font-serif font-bold text-brand-forest">No Treasures Found</h3>
                                <p className="text-text-secondary font-medium opacity-80">
                                    We couldn't find any products matching your current selection. Try broadening your filters or clearing the search.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveFilter('all');
                                    handleInlineSearchClear();
                                }}
                                className="inline-flex items-center gap-4 bg-brand-forest text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 hover:bg-brand-forest-dark shadow-premium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {filteredProducts.map((product, index) => (
                                <ProductCard
                                    key={`${product.id}-${product.size || ''}`}
                                    product={product}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Trust Section */}
            <div className="bg-white border-t border-brand-100 py-16">
                <div className="container mx-auto px-4 md:px-6 text-center space-y-8">
                    <div className="max-w-xl mx-auto">
                        <h3 className="text-2xl font-serif font-bold text-brand-forest mb-4">
                            Can't find what you're looking for?
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed opacity-70">
                            Our team is constantly sourcing the finest organic products from local farmers. Contact us for custom orders or bulk inquiries.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6">
                        <a href="https://wa.me/yourwhatsapp" className="group flex items-center gap-3 px-6 py-3 bg-brand-50 rounded-xl border border-brand-100 hover:border-gold transition-all duration-300 font-bold text-brand-forest text-xs uppercase tracking-widest">
                            <span className="text-lg">💬</span>
                            WhatsApp Support
                        </a>
                        <Link href="/contact" className="group flex items-center gap-3 px-6 py-3 bg-brand-50 rounded-xl border border-brand-100 hover:border-gold transition-all duration-300 font-bold text-brand-forest text-xs uppercase tracking-widest">
                            <span className="text-lg">📧</span>
                            Send Email
                        </Link>
                    </div>
                </div>
            </div>


        </div>
    );
}

export default function AllProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white"><div className="container mx-auto px-6 py-20"><div className="text-center"><p className="text-gray-600">Loading...</p></div></div></div>}>
            <AllProductsContent />
        </Suspense>
    );
}


