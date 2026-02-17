'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from './CartContext';

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    getWishlistCount: () => number;
    isHydrated: boolean; // HYDRATION FIX: Expose hydration state
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    // HYDRATION FIX: Track when localStorage has been loaded
    const [isHydrated, setIsHydrated] = useState(false);

    // Load wishlist from localStorage on mount - HYDRATION SAFE
    useEffect(() => {
        // Only access localStorage in browser
        if (typeof window === 'undefined') return;
        
        try {
            const savedWishlist = localStorage.getItem('taruvae-wishlist');
            if (savedWishlist) {
                const parsed = JSON.parse(savedWishlist);
                if (Array.isArray(parsed)) {
                    setWishlist(parsed);
                }
            }
        } catch (error) {
            console.error('Error loading wishlist from localStorage:', error);
        }
        
        // Mark as hydrated after loading
        setIsHydrated(true);
    }, []);

    // Save wishlist to localStorage whenever it changes - HYDRATION SAFE
    useEffect(() => {
        // Only save after initial hydration to prevent overwriting with empty array
        if (!isHydrated) return;
        if (typeof window === 'undefined') return;
        
        try {
            localStorage.setItem('taruvae-wishlist', JSON.stringify(wishlist));
        } catch (error) {
            console.error('Error saving wishlist to localStorage:', error);
        }
    }, [wishlist, isHydrated]);

    const addToWishlist = (product: Product) => {
        setWishlist((prevWishlist) => {
            if (prevWishlist.find((item) => item.id === product.id)) {
                return prevWishlist; // Already in wishlist
            }
            return [...prevWishlist, product];
        });
    };

    const removeFromWishlist = (productId: number) => {
        setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== productId));
    };

    const isInWishlist = (productId: number) => {
        return wishlist.some((item) => item.id === productId);
    };

    const getWishlistCount = () => {
        return wishlist.length;
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                getWishlistCount,
                isHydrated, // HYDRATION FIX: Expose hydration state
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}

