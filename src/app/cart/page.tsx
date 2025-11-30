'use client';

import { Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        router.push('/checkout');
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-20">
                    <div className="text-center">
                        <div className="mb-8">
                            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Your Cart is Empty
                        </h2>
                        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
                        <Link
                            href="/"
                            className="inline-block bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                        >
                            Continue Shopping
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
            <div className="py-8 md:py-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-8" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        Shopping Cart
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                        {/* Product Image */}
                                        <div className="w-full sm:w-24 md:w-32 h-24 sm:h-24 md:h-32 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {item.image && item.image.trim() !== '' ? (
                                                item.image.startsWith('http') ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        width={128}
                                                        height={128}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                )
                                            ) : (
                                                <Image
                                                    src="/images/all/products image available soon.png"
                                                    alt={item.name}
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-black mb-2 line-clamp-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                    <span className="text-xl sm:text-2xl font-bold text-[#D4AF37]">₹{item.price}</span>
                                                    {item.originalPrice && (
                                                        <span className="text-xs sm:text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="px-3 sm:px-4 py-2 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="px-4 sm:px-6 py-2 font-semibold min-w-[50px] sm:min-w-[60px] text-center text-sm sm:text-base">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="px-3 sm:px-4 py-2 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-base sm:text-lg font-bold text-black">₹{item.price * item.quantity}</p>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                    title="Remove item"
                                                >
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#F5F1EB] rounded-xl p-4 sm:p-6 sticky top-20 sm:top-24">
                                <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    Order Summary
                                </h2>

                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                        <span>Subtotal ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})</span>
                                        <span className="font-semibold">₹{getTotalPrice()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                        <span>Shipping</span>
                                        <span className="font-semibold">
                                            {getTotalPrice() >= 500 ? (
                                                <span className="text-green-600">Free</span>
                                            ) : (
                                                <span>₹50</span>
                                            )}
                                        </span>
                                    </div>
                                    {getTotalPrice() < 500 && (
                                        <p className="text-xs sm:text-sm text-green-600">
                                            Add ₹{500 - getTotalPrice()} more for free shipping!
                                        </p>
                                    )}
                                    <div className="border-t border-gray-300 pt-3 sm:pt-4">
                                        <div className="flex justify-between text-lg sm:text-xl font-bold text-black">
                                            <span>Total</span>
                                            <span>₹{getTotalPrice() + (getTotalPrice() >= 500 ? 0 : 50)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-[#2D5016] text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-[#4A7C2A] transition-colors mb-3 sm:mb-4"
                                >
                                    Proceed to Checkout
                                </button>

                                <Link
                                    href="/"
                                    className="block w-full text-center bg-white text-[#2D5016] py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold border-2 border-[#2D5016] hover:bg-[#2D5016] hover:text-white transition-colors"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}



