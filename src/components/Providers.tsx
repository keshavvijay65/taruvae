'use client';

import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { UserProfileProvider } from '@/context/UserProfileContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <UserProfileProvider>
                <CartProvider>
                    <WishlistProvider>
                        {children}
                    </WishlistProvider>
                </CartProvider>
            </UserProfileProvider>
        </AuthProvider>
    );
}

