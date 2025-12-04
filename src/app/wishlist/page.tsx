'use client';

import { Suspense } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function WishlistPage() {
    const { wishlist, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = (product: any) => {
        addToCart(product);
    };

    if (wishlist.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-20">
                    <div className="text-center">
                        <div className="mb-8">
                            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Your Wishlist is Empty
                        </h2>
                        <p className="text-gray-600 mb-8">Start adding products you love to your wishlist!</p>
                        <Link
                            href="/products"
                            className="inline-block bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            My Wishlist ({wishlist.length})
                        </h1>
                        <Link
                            href="/products"
                            className="bg-[#2D5016] text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-[#4A7C2A] transition-colors whitespace-nowrap"
                        >
                            Continue Shopping
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
                        {wishlist.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#D4AF37] transition-all duration-300 flex flex-col w-full min-w-0"
                            >
                                {/* Product Image */}
                                <div className="relative w-full aspect-square bg-gradient-to-br from-[#F5F1EB] via-white to-[#FDF8F1] overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
                                        {product.image && product.image.trim() !== '' ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={200}
                                                height={200}
                                                className="object-contain w-full h-full max-w-[200px] max-h-[200px]"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/all/products image available soon.png';
                                                }}
                                            />
                                        ) : (
                                            <Image
                                                src="/images/all/products image available soon.png"
                                                alt={product.name}
                                                width={200}
                                                height={200}
                                                className="object-contain w-full h-full max-w-[200px] max-h-[200px]"
                                            />
                                        )}
                                    </div>

                                    {/* Remove from Wishlist Button */}
                                    <button
                                        onClick={() => removeFromWishlist(product.id)}
                                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors z-10"
                                        aria-label="Remove from wishlist"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Discount Badge */}
                                    {product.discount && (
                                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-lg flex items-center gap-1 z-10">
                                            <span className="text-xs">🔥</span>
                                            <span>{product.discount}% OFF</span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-base font-bold text-[#2D5016] mb-2 line-clamp-2 min-h-[2.5rem]" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        {product.name}
                                    </h3>

                                    {/* Price */}
                                    <div className="mb-4 flex-grow">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-2xl font-bold text-[#2D5016]" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                                ₹{product.price}
                                            </span>
                                            {product.originalPrice && (
                                                <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#2D5016] text-white hover:bg-[#D4AF37] transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>Add to Cart</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}


