'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useCart, Product } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllProductsFromFirebase, subscribeToProducts, getAllCategoriesFromFirebase, subscribeToCategories, Category } from '@/lib/firebaseProducts';
import type { Product as FirebaseProduct } from '@/lib/firebaseProducts';

// Helper function to convert Firebase Product to CartContext Product
function convertToCartProduct(firebaseProduct: FirebaseProduct): Product {
    return {
        id: typeof firebaseProduct.id === 'string' ? parseInt(firebaseProduct.id) || 0 : firebaseProduct.id,
        name: firebaseProduct.name || '',
        price: firebaseProduct.price || 0,
        image: firebaseProduct.image || '',
        rating: firebaseProduct.rating || 4.0,
        reviews: 0, // Default reviews
        inStock: firebaseProduct.stock !== undefined ? firebaseProduct.stock > 0 : true,
        category: firebaseProduct.category || '',
        size: firebaseProduct.weight || '',
        description: firebaseProduct.description || '',
    };
}

// Function to get all default products (same as admin panel)
const getAllDefaultProducts = (): Product[] => {
    return [
        // Cold Pressed Peanut Oil
        { id: 1, name: 'Cold Pressed Peanut Oil', price: 430, size: '1000 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 128, inStock: true, category: 'oil' },
        { id: 2, name: 'Cold Pressed Peanut Oil', price: 250, size: '500 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 95, inStock: true, category: 'oil' },
        { id: 3, name: 'Cold Pressed Peanut Oil', price: 140, size: '250 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 78, inStock: true, category: 'oil' },
        { id: 4, name: 'Cold Pressed Peanut Oil', price: 70, size: '100 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 45, inStock: true, category: 'oil' },
        
        // Cold Pressed Mustard Oil
        { id: 5, name: 'Cold Pressed Mustard Oil', price: 460, size: '1000 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 145, inStock: true, category: 'oil' },
        { id: 6, name: 'Cold Pressed Mustard Oil', price: 260, size: '500 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 112, inStock: true, category: 'oil' },
        { id: 7, name: 'Cold Pressed Mustard Oil', price: 150, size: '250 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 89, inStock: true, category: 'oil' },
        { id: 8, name: 'Cold Pressed Mustard Oil', price: 80, size: '100 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 52, inStock: true, category: 'oil' },
        
        // Cold Pressed Sunflower Oil
        { id: 9, name: 'Cold Pressed Sunflower Oil', price: 450, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 167, inStock: true, category: 'oil' },
        { id: 10, name: 'Cold Pressed Sunflower Oil', price: 260, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 134, inStock: true, category: 'oil' },
        { id: 11, name: 'Cold Pressed Sunflower Oil', price: 150, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 98, inStock: true, category: 'oil' },
        { id: 12, name: 'Cold Pressed Sunflower Oil', price: 80, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 61, inStock: true, category: 'oil' },
        
        // Cold Pressed Coconut Oil
        { id: 13, name: 'Cold Pressed Coconut Oil', price: 590, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 189, inStock: true, category: 'oil' },
        { id: 14, name: 'Cold Pressed Coconut Oil', price: 320, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 156, inStock: true, category: 'oil' },
        { id: 15, name: 'Cold Pressed Coconut Oil', price: 180, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 123, inStock: true, category: 'oil' },
        { id: 16, name: 'Cold Pressed Coconut Oil', price: 90, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 87, inStock: true, category: 'oil' },
        
        // Cold Pressed Sesame Oil
        { id: 17, name: 'Cold Pressed Sesame Oil', price: 510, size: '1000 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 178, inStock: true, category: 'oil' },
        { id: 18, name: 'Cold Pressed Sesame Oil', price: 280, size: '500 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 145, inStock: true, category: 'oil' },
        { id: 19, name: 'Cold Pressed Sesame Oil', price: 160, size: '250 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 112, inStock: true, category: 'oil' },
        { id: 20, name: 'Cold Pressed Sesame Oil', price: 85, size: '100 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 78, inStock: true, category: 'oil' },
        
        // Virgin Coconut Oil
        { id: 21, name: 'Virgin Coconut Oil', price: 1290, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 203, inStock: true, category: 'oil', isBestseller: true },
        { id: 22, name: 'Virgin Coconut Oil', price: 680, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 178, inStock: true, category: 'oil' },
        { id: 23, name: 'Virgin Coconut Oil', price: 380, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 145, inStock: true, category: 'oil' },
        { id: 24, name: 'Virgin Coconut Oil', price: 190, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 112, inStock: true, category: 'oil' },
        
        // Cold Pressed Almond Oil
        { id: 25, name: 'Cold Pressed Almond Oil', price: 1200, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 192, inStock: true, category: 'oil', isBestseller: true },
        { id: 26, name: 'Cold Pressed Almond Oil', price: 650, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 167, inStock: true, category: 'oil' },
        { id: 27, name: 'Cold Pressed Almond Oil', price: 360, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 134, inStock: true, category: 'oil' },
        { id: 28, name: 'Cold Pressed Almond Oil', price: 180, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 98, inStock: true, category: 'oil' },
        
        // Cold Pressed Olive Oil
        { id: 29, name: 'Cold Pressed Olive Oil', price: 1810, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 156, inStock: true, category: 'oil', isBestseller: true },
        { id: 30, name: 'Cold Pressed Olive Oil', price: 950, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 134, inStock: true, category: 'oil' },
        { id: 31, name: 'Cold Pressed Olive Oil', price: 520, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 112, inStock: true, category: 'oil' },
        { id: 32, name: 'Cold Pressed Olive Oil', price: 260, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 89, inStock: true, category: 'oil' },
        
        // Cold Pressed Castor Oil
        { id: 33, name: 'Cold Pressed Castor Oil', price: 420, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 134, inStock: true, category: 'oil' },
        { id: 34, name: 'Cold Pressed Castor Oil', price: 240, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 112, inStock: true, category: 'oil' },
        { id: 35, name: 'Cold Pressed Castor Oil', price: 140, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 89, inStock: true, category: 'oil' },
        { id: 36, name: 'Cold Pressed Castor Oil', price: 70, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 67, inStock: true, category: 'oil' },
        
        // Premium Desi Cow Bilona Ghee
        { id: 37, name: 'Premium Desi Cow Bilona Ghee', price: 1450, size: '1 KG', image: '/images/products/GHEE.png', rating: 4.8, reviews: 256, inStock: true, category: 'ghee', isBestseller: true },
        { id: 38, name: 'Premium Desi Cow Bilona Ghee', price: 750, size: '500 GM', image: '/images/products/GHEE.png', rating: 4.8, reviews: 223, inStock: true, category: 'ghee' },
        { id: 39, name: 'Premium Desi Cow Bilona Ghee', price: 320, size: '200 GM', image: '/images/products/GHEE.png', rating: 4.8, reviews: 189, inStock: true, category: 'ghee' },
        
        // Pure Hing (Asafoetida)
        { id: 40, name: 'Pure Hing (Asafoetida)', price: 280, size: '50 GM', image: '/images/products/Hing.png', rating: 4.6, reviews: 145, inStock: true, category: 'superfoods' },
        { id: 41, name: 'Pure Hing (Asafoetida)', price: 150, size: '25 GM', image: '/images/products/Hing.png', rating: 4.6, reviews: 112, inStock: true, category: 'superfoods' },
        { id: 42, name: 'Pure Hing (Asafoetida)', price: 80, size: '10 GM', image: '/images/products/Hing.png', rating: 4.6, reviews: 89, inStock: true, category: 'superfoods' },
        
        // Jeeravan Masala
        { id: 43, name: 'Jeeravan Masala', price: 180, size: '250 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 167, inStock: true, category: 'superfoods' },
        { id: 44, name: 'Jeeravan Masala', price: 100, size: '100 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 134, inStock: true, category: 'superfoods' },
        { id: 45, name: 'Jeeravan Masala', price: 60, size: '50 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 112, inStock: true, category: 'superfoods' },
        { id: 46, name: 'Jeeravan Masala', price: 35, size: '25 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 89, inStock: true, category: 'superfoods' },
        { id: 47, name: 'Jeeravan Masala', price: 20, size: '10 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 67, inStock: true, category: 'superfoods' },
        
        // Garam Masala
        { id: 48, name: 'Garam Masala', price: 200, size: '250 GM', image: '/images/products/Garam Masala.jpeg', rating: 4.7, reviews: 189, inStock: true, category: 'superfoods' },
        { id: 49, name: 'Garam Masala', price: 110, size: '100 GM', image: '/images/products/Garam Masala.jpeg', rating: 4.7, reviews: 156, inStock: true, category: 'superfoods' },
        { id: 50, name: 'Garam Masala', price: 65, size: '50 GM', image: '/images/products/Garam Masala.jpeg', rating: 4.7, reviews: 123, inStock: true, category: 'superfoods' },
        { id: 51, name: 'Garam Masala', price: 38, size: '25 GM', image: '/images/products/Garam Masala.jpeg', rating: 4.7, reviews: 98, inStock: true, category: 'superfoods' },
        { id: 52, name: 'Garam Masala', price: 22, size: '10 GM', image: '/images/products/Garam Masala.jpeg', rating: 4.7, reviews: 78, inStock: true, category: 'superfoods' },
        
        // 100% Arabica Coffee Powder
        { id: 53, name: '100% Arabica Coffee Powder', price: 450, size: '250 GM', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 178, inStock: true, category: 'superfoods' },
        { id: 54, name: '100% Arabica Coffee Powder', price: 250, size: '100 GM', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 145, inStock: true, category: 'superfoods' },
        { id: 55, name: '100% Arabica Coffee Powder', price: 140, size: '50 GM', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 112, inStock: true, category: 'superfoods' },
    ];
};

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
    const [products, setProducts] = useState<Product[]>([]); // Start with empty array - only show admin products
    const [categories, setCategories] = useState<Category[]>([]);

    // Load products from Firebase (with real-time updates)
    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Load from Firebase
                const firebaseProducts = await getAllProductsFromFirebase();
                
                if (firebaseProducts && firebaseProducts.length > 0) {
                    // Convert Firebase Products to CartContext Products
                    const cartProducts = firebaseProducts.map(convertToCartProduct);
                    // Check if products have old/wrong image paths and fix them
                    const fixedProducts = cartProducts.map(product => {
                        // Fix old image paths to correct ones
                        if (product.image === '/images/products/ghee.jpg') {
                            product.image = '/images/products/GHEE.png';
                        }
                        if (product.image === '/images/products/sunflower-oil.jpg' || 
                            product.image === '/images/products/coconut-oil.jpg' || 
                            product.image === '/images/products/olive-oil.jpg') {
                            product.image = '/images/all/products image available soon.png';
                        }
                        if (product.image === '/images/all/IMG-20251019-WA0015.jpg') {
                            product.image = '/images/all/products image available soon.png';
                        }
                        // Fix Hing and Garam Masala paths if they have wrong encoding or paths
                        if (product.name && product.name.includes('Hing') && product.image !== '/images/products/Hing.png') {
                            product.image = '/images/products/Hing.png';
                        }
                        if (product.name && product.name.includes('Garam Masala')) {
                            // Fix if path has encoding or wrong format
                            if (product.image !== '/images/products/Garam Masala.jpeg' && 
                                !product.image.includes('Garam%20Masala') && 
                                !product.image.includes('Garam Masala')) {
                                product.image = '/images/products/Garam Masala.jpeg';
                            }
                        }
                        return product;
                    });
                    setProducts(fixedProducts);
                } else {
                    // If no products in Firebase, use defaults
                    const defaultProducts = getAllDefaultProducts();
                    setProducts(defaultProducts);
                }
            } catch (error) {
                console.error('Error loading products:', error);
                // Fallback to localStorage
                const adminProducts = localStorage.getItem('taruvae-admin-products');
                if (adminProducts !== null) {
                    try {
                        const parsed = JSON.parse(adminProducts);
                        if (parsed && Array.isArray(parsed)) {
                            // Fix old image paths
                            const fixedProducts = parsed.map((product: Product) => {
                                if (product.image === '/images/products/ghee.jpg') {
                                    product.image = '/images/products/GHEE.png';
                                }
                                if (product.image === '/images/products/sunflower-oil.jpg' || 
                                    product.image === '/images/products/coconut-oil.jpg' || 
                                    product.image === '/images/products/olive-oil.jpg') {
                                    product.image = '/images/all/products image available soon.png';
                                }
                                if (product.image === '/images/all/IMG-20251019-WA0015.jpg') {
                                    product.image = '/images/all/products image available soon.png';
                                }
                                // Fix Hing and Garam Masala paths
                                if (product.name && product.name.includes('Hing') && product.image !== '/images/products/Hing.png') {
                                    product.image = '/images/products/Hing.png';
                                }
                                if (product.name && product.name.includes('Garam Masala')) {
                                    if (product.image !== '/images/products/Garam Masala.jpeg' && 
                                        !product.image.includes('Garam%20Masala') && 
                                        !product.image.includes('Garam Masala')) {
                                        product.image = '/images/products/Garam Masala.jpeg';
                                    }
                                }
                                return product;
                            });
                            setProducts(fixedProducts);
                            return;
                        }
                    } catch (parseError) {
                        console.error('Error parsing admin products:', parseError);
                    }
                }
                // Final fallback to defaults
                const defaultProducts = getAllDefaultProducts();
                setProducts(defaultProducts);
            }
        };

        loadProducts();

        // Subscribe to real-time updates from Firebase
        const unsubscribe = subscribeToProducts((updatedProducts) => {
            if (updatedProducts && updatedProducts.length > 0) {
                // Convert Firebase Products to CartContext Products
                const cartProducts = updatedProducts.map(convertToCartProduct);
                // Fix old image paths in real-time updates too
                const fixedProducts = cartProducts.map(product => {
                    if (product.image === '/images/products/ghee.jpg') {
                        product.image = '/images/products/GHEE.png';
                    }
                    if (product.image === '/images/products/sunflower-oil.jpg' || 
                        product.image === '/images/products/coconut-oil.jpg' || 
                        product.image === '/images/products/olive-oil.jpg') {
                        product.image = '/images/all/products image available soon.png';
                    }
                    if (product.image === '/images/all/IMG-20251019-WA0015.jpg') {
                        product.image = '/images/all/products image available soon.png';
                    }
                    // Fix Hing and Garam Masala paths
                    if (product.name && product.name.includes('Hing') && product.image !== '/images/products/Hing.png') {
                        product.image = '/images/products/Hing.png';
                    }
                    if (product.name && product.name.includes('Garam Masala')) {
                        if (product.image !== '/images/products/Garam Masala.jpeg' && 
                            !product.image.includes('Garam%20Masala') && 
                            !product.image.includes('Garam Masala')) {
                            product.image = '/images/products/Garam Masala.jpeg';
                        }
                    }
                    return product;
                });
                setProducts(fixedProducts);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Load categories from Firebase
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const loadedCategories = await getAllCategoriesFromFirebase();
                setCategories(loadedCategories);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();

        // Subscribe to real-time category updates
        const unsubscribe = subscribeToCategories((updatedCategories) => {
            setCategories(updatedCategories);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

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
        if (filterParam && dynamicFilterMeta[filterParam]) {
            setActiveFilter(filterParam);
        } else if (!filterParam) {
            setActiveFilter('all');
        }

        const searchParam = searchParams.get('search') || '';
        setSearchKeyword(searchParam);
        setInlineSearchTerm(searchParam);
    }, [searchParams]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Quick filter logic
        if (activeFilter === 'new') {
            filtered = filtered.filter(p => p.isNew);
        } else if (activeFilter === 'deals') {
            filtered = filtered.filter(p => (p.discount ?? 0) >= 15);
        } else if (activeFilter === 'under-499') {
            filtered = filtered.filter(p => p.price <= 499);
        } else if (activeFilter === 'under-999') {
            filtered = filtered.filter(p => p.price <= 999);
        } else if (activeFilter === 'all') {
            // Show all products
        } else {
            // Dynamic category filter - check if it's a category
            const categoryValues = categories.map(cat => cat.value);
            if (categoryValues.includes(activeFilter)) {
                filtered = filtered.filter(p => p.category === activeFilter);
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
                filtered = [...filtered].sort((a, b) => b.rating - a.rating);
                break;
            case 'name':
                filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }

        return filtered;
    }, [activeFilter, sortBy, searchKeyword, products]);

    const handleQuickFilterClick = (filterId: string) => {
        setActiveFilter(filterId);
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
        <div className="min-h-screen rich-gradient">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>

            {/* Page Header */}
            <div className="rich-gradient pt-20 sm:pt-24 pb-6 md:pb-8 border-b border-[#E2DACF]/30">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 text-shadow-premium animate-fade-in-up" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        {activeFilterContent.title}
                    </h1>
                    <p className="text-base md:text-lg text-gray-700 animate-fade-in">
                        {activeFilterContent.description}
                    </p>
                    {searchKeyword && (
                        <p className="mt-3 text-sm md:text-base text-[#1F4F2B] font-medium">
                            Showing results for <span className="font-bold">&ldquo;{searchKeyword}&rdquo;</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-white/80 backdrop-blur-sm border-y border-[#E2DACF]/50 shadow-premium">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex gap-2 sm:gap-3 md:gap-4 items-center overflow-x-auto py-4 sm:py-5 scrollbar-hide px-2 sm:px-0">
                        {quickFilters.map((filter) => {
                            const isActive = activeFilter === filter.id;
                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => handleQuickFilterClick(filter.id)}
                                    className={`flex flex-col items-center gap-1 sm:gap-1.5 min-w-[60px] xs:min-w-[68px] sm:min-w-[72px] md:min-w-[80px] flex-shrink-0`}
                                >
                                    <span
                                        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isActive
                                            ? 'bg-[#11412F] border-[#11412F] text-white shadow-lg'
                                            : 'border-[#1E5A3C] text-[#1E5A3C] bg-white hover:bg-[#F5F1EB]'
                                            }`}
                                    >
                                        {filter.icon}
                                    </span>
                                    <span className={`text-[10px] xs:text-xs sm:text-sm font-semibold text-center ${isActive ? 'text-[#11412F]' : 'text-[#2D5016]'}`}>
                                        {filter.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-10">
                {/* Products Grid */}
                <div className="w-full">
                        {/* Toolbar */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-gray-600 text-xs sm:text-sm">
                                    Showing <span className="font-bold text-[#2D5016]">{filteredProducts.length}</span> products
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                                <form onSubmit={handleInlineSearchSubmit} className="relative w-full sm:w-56 md:w-64">
                                    <input
                                        type="text"
                                        value={inlineSearchTerm}
                                        onChange={(e) => setInlineSearchTerm(e.target.value)}
                                        placeholder="Search within products"
                                        className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 rounded-full border border-transparent bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] focus:border-[#2D5016] focus:ring-2 focus:ring-[#2D5016]/20 text-xs sm:text-sm placeholder:text-gray-400"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#2D5016]"
                                        aria-label="Apply search"
                                    >
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                    {inlineSearchTerm && (
                                        <button
                                            type="button"
                                            onClick={handleInlineSearchClear}
                                            className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D5016]"
                                            aria-label="Clear search"
                                        >
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    )}
                                </form>
                                <div className="relative flex items-center gap-2 w-full sm:w-auto">
                                    <label className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">Sort by:</label>
                                    <div className="relative flex-1 sm:flex-none">
                                        <button
                                            type="button"
                                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                            className={`w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016] font-medium text-xs sm:text-sm bg-white flex items-center justify-between gap-2 ${
                                                isSortDropdownOpen 
                                                    ? 'border-[#2D5016] ring-2 ring-[#2D5016]/20' 
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            <span>
                                                {sortBy === 'default' && 'Default'}
                                                {sortBy === 'price-low' && 'Price: Low to High'}
                                                {sortBy === 'price-high' && 'Price: High to Low'}
                                                {sortBy === 'rating' && 'Rating: High to Low'}
                                                {sortBy === 'name' && 'Name: A to Z'}
                                            </span>
                                            <svg 
                                                className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        {isSortDropdownOpen && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setIsSortDropdownOpen(false)}
                                                />
                                                <div className="absolute right-0 mt-1 w-full sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                                                    {[
                                                        { value: 'default', label: 'Default' },
                                                        { value: 'price-low', label: 'Price: Low to High' },
                                                        { value: 'price-high', label: 'Price: High to Low' },
                                                        { value: 'rating', label: 'Rating: High to Low' },
                                                        { value: 'name', label: 'Name: A to Z' },
                                                    ].map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setSortBy(option.value);
                                                                setIsSortDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                                                                sortBy === option.value
                                                                    ? 'bg-blue-50 text-blue-600'
                                                                    : 'text-gray-700 hover:bg-gray-50'
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

                        {/* Products Grid */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-12 sm:py-20">
                                <p className="text-gray-600 text-base sm:text-lg">No products found matching your filters.</p>
                                <button
                                    onClick={() => {
                                        setActiveFilter('all');
                                        handleInlineSearchClear();
                                    }}
                                    className="mt-4 px-4 sm:px-6 py-2 bg-[#2D5016] text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-[#4A7C2A] transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 w-full">
                                {filteredProducts.map((product, index) => (
                                    <div key={product.id} className="w-full min-w-0">
                                        <ProductCard product={product} index={index} />
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            </div>

            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
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


