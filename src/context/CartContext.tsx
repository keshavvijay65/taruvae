'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    hoverImage?: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    category?: string;
    size?: string;
    isNew?: boolean;
    isBestseller?: boolean;
    isPrime?: boolean; // Fast/Priority Delivery
    showOnHome?: boolean; // Show on Homepage
    description?: string; // Product description
    features?: string[]; // Key features array
    benefits?: string[]; // Benefits array
    includedProducts?: Array<{ id: number; name: string; price: number; image: string; size?: string }>; // Included products for combos
}

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
    isHydrated: boolean; // HYDRATION FIX: Expose hydration state
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    // HYDRATION FIX: Track when localStorage has been loaded
    const [isHydrated, setIsHydrated] = useState(false);

    // Helper to enrich minimal cart data with full product info
    const enrichCartItems = async (minimalCart: Array<{ id: number; quantity: number; price: number; size?: string }>): Promise<CartItem[]> => {
        try {
            // Try to load products from Firebase to enrich cart items
            const { getAllProductsFromFirebase } = await import('@/lib/firebaseProducts');
            const products = await getAllProductsFromFirebase();

            return minimalCart.map(minimalItem => {
                // Find matching product
                const product = products.find((p: any) => {
                    const productId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return productId === minimalItem.id;
                });

                if (product) {
                    // Enrich with full product data
                    return {
                        id: minimalItem.id,
                        quantity: minimalItem.quantity,
                        price: minimalItem.price,
                        name: product.name || `Product ${minimalItem.id}`,
                        image: product.image || '/placeholder.png',
                        originalPrice: product.originalPrice,
                        discount: product.discount,
                        rating: product.rating || 4.0,
                        reviews: 0,
                        inStock: product.stock !== undefined ? product.stock > 0 : true,
                        category: product.category || '',
                        size: minimalItem.size || product.weight || '',
                        description: product.description || '',
                        features: product.features || [],
                        benefits: product.benefits || [],
                        isNew: product.isNew,
                        isBestseller: product.isBestseller,
                        isPrime: product.isPrime,
                        includedProducts: product.includedProducts || [],
                    } as CartItem;
                }

                // Fallback: return minimal cart item with defaults
                return {
                    id: minimalItem.id,
                    quantity: minimalItem.quantity,
                    price: minimalItem.price,
                    name: `Product ${minimalItem.id}`,
                    image: '/placeholder.png',
                    rating: 4.0,
                    reviews: 0,
                    inStock: true,
                    size: minimalItem.size || '',
                } as CartItem;
            });
        } catch (error) {
            console.warn('[CartContext] Could not enrich cart items from Firebase, using minimal data:', error);
            // Return minimal cart items as fallback
            return minimalCart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                name: `Product ${item.id}`,
                image: '/placeholder.png',
                rating: 4.0,
                reviews: 0,
                inStock: true,
                size: item.size || '',
            } as CartItem));
        }
    };

    // Load cart from localStorage on mount - HYDRATION SAFE
    useEffect(() => {
        // Only access localStorage in browser
        if (typeof window === 'undefined') return;

        const loadCart = async () => {
            try {
                const savedCart = localStorage.getItem('taruvae-cart');
                if (savedCart) {
                    const parsed = JSON.parse(savedCart);
                    if (Array.isArray(parsed)) {
                        // Check if it's minimal data (has id, quantity, price) or full data
                        const isMinimalData = parsed.length > 0 && parsed[0].hasOwnProperty('id') &&
                            parsed[0].hasOwnProperty('quantity') &&
                            parsed[0].hasOwnProperty('price') &&
                            !parsed[0].hasOwnProperty('name');

                        if (isMinimalData) {
                            // Enrich minimal data with product info
                            const enrichedCart = await enrichCartItems(parsed);
                            setCart(enrichedCart);
                        } else {
                            // Full data (legacy format) - use as is
                            setCart(parsed);
                        }
                    }
                }
            } catch (error) {
                console.error('[CartContext] Error loading cart from localStorage:', error);
            } finally {
                // Mark as hydrated after loading (whether successful or not)
                setIsHydrated(true);
            }
        };

        loadCart();
    }, []);

    // Save cart to localStorage whenever it changes - HYDRATION SAFE
    useEffect(() => {
        // Only save after initial hydration to prevent overwriting with empty array
        if (!isHydrated) return;
        if (typeof window === 'undefined') return;

        try {
            // OPTIMIZATION: Only save essential data to prevent localStorage quota exceeded
            // Store minimal cart data: id, quantity, price, size (if applicable)
            const minimalCart = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                size: item.size || undefined, // Only include if exists
            }));

            const cartData = JSON.stringify(minimalCart);

            // Check size before saving (localStorage limit is typically 5-10MB)
            const sizeInMB = new Blob([cartData]).size / (1024 * 1024);
            if (sizeInMB > 4) { // Warn if approaching limit
                console.warn(`[CartContext] Cart data size (${sizeInMB.toFixed(2)}MB) is large. Consider reducing cart items.`);
            }

            localStorage.setItem('taruvae-cart', cartData);
        } catch (error: any) {
            // Handle quota exceeded error specifically
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.error('[CartContext] localStorage quota exceeded. Cart data is too large. Clearing old cart data...');
                // Try to save a reduced version (keep only last 20 items)
                try {
                    const reducedCart = cart.slice(-20).map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        size: item.size || undefined,
                    }));
                    localStorage.setItem('taruvae-cart', JSON.stringify(reducedCart));
                    console.warn('[CartContext] Saved reduced cart (last 20 items) due to storage limit.');
                } catch (retryError) {
                    console.error('[CartContext] Failed to save even reduced cart:', retryError);
                    // Clear localStorage for this key and start fresh
                    localStorage.removeItem('taruvae-cart');
                }
            } else {
                console.error('[CartContext] Error saving cart to localStorage:', error);
            }
        }
    }, [cart, isHydrated]);

    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems,
                isHydrated, // HYDRATION FIX: Expose hydration state
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

