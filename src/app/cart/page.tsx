'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CouponCard from '@/components/CouponCard';
import { getCouponsFromFirebase, Coupon } from '@/lib/firebaseCoupons';
import {
    calculateOrderSummary,
    isFreeShipping,
    amountForFreeShipping,
    CartItem,
    AppliedCoupon,
} from '@/lib/orderCalculations';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const router = useRouter();
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [showCouponSuggestions, setShowCouponSuggestions] = useState(false);
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [couponFeedback, setCouponFeedback] = useState<{
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
    } | null>(null);

    // ========================================================================
    // MEMOIZED ORDER SUMMARY - Uses shared utility (single source of truth)
    // FORMULA: Total = TaxableAmount + GST + Shipping
    // Note: On cart page, coupon is not applied yet (applied at checkout)
    // ========================================================================
    const orderSummary = useMemo(() => {
        return calculateOrderSummary(cart as CartItem[], appliedCoupon);
    }, [cart, appliedCoupon]);

    // Note: taxableAmount = subtotal - discount (no discount on cart page)
    const { subtotal, discount, gst, shipping, total, itemCount } = orderSummary;

    // ========================================================================
    // LOAD COUPONS
    // ========================================================================
    useEffect(() => {
        const loadCoupons = async () => {
            try {
                const coupons = await getCouponsFromFirebase();
                const now = new Date();
                const active = coupons.filter(coupon => {
                    if (!coupon.isActive) return false;
                    if (!coupon.showOnCheckout) return false;
                    const validFrom = new Date(coupon.validFrom);
                    const validUntil = new Date(coupon.validUntil);
                    return now >= validFrom && now <= validUntil;
                }).slice(0, 3);
                setAvailableCoupons(active);
            } catch (error) {
                console.error('Error loading coupons:', error);
            }
        };
        loadCoupons();
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleCheckout = () => {
        router.push('/checkout');
    };

    const handleApplyCoupon = useCallback(async (code?: string) => {
        const codeToApply = (code || couponCode).trim().toUpperCase();
        if (!codeToApply) {
            setCouponFeedback({ type: 'error', message: 'Please enter a coupon code.' });
            return;
        }
        if (applyingCoupon) return;

        setApplyingCoupon(true);
        setCouponFeedback(null);

        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: codeToApply,
                    orderAmount: subtotal,
                }),
            });

            const data = await response.json().catch(() => ({ success: false, error: 'Network error' }));

            if (!response.ok || !data.success || !data.discount || data.discount <= 0) {
                setAppliedCoupon(null);
                setCouponFeedback({
                    type: 'error',
                    message: data.error || 'This coupon is not valid for your current cart.',
                });
                return;
            }

            const nextApplied: AppliedCoupon = {
                code: data.coupon.code,
                discount: data.discount,
                type: data.coupon.type,
                value: data.coupon.value,
            };
            setAppliedCoupon(nextApplied);
            setCouponCode(data.coupon.code);
            setShowCouponSuggestions(false);
            setCouponFeedback({
                type: 'success',
                message: `Coupon applied. You saved ₹${data.discount.toLocaleString('en-IN')}.`,
            });
        } catch (error: any) {
            console.error('Error applying coupon:', error);
            setAppliedCoupon(null);
            setCouponFeedback({
                type: 'error',
                message: error?.message || 'Failed to validate coupon. Please try again.',
            });
        } finally {
            setApplyingCoupon(false);
        }
    }, [couponCode, subtotal, applyingCoupon]);

    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponFeedback({ type: 'info', message: 'Coupon removed.' });
    }, []);

    // ========================================================================
    // RENDER - EMPTY CART
    // ========================================================================
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-[calc(var(--header-height,80px)+2rem)] pb-24 sm:pb-32">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-24 h-24 mx-auto mb-8 bg-brand-100 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Your Cart is Empty
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Looks like you haven't added anything to your cart yet. Explore our products and find something you love.
                        </p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-brand text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-dark transition-all shadow-md hover:shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Start Shopping
                        </Link>
                    </div>
                </div>

            </div>
        );
    }

    // ========================================================================
    // RENDER - CART WITH ITEMS
    // ========================================================================
    return (
        <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">

            <div className="pt-[calc(var(--header-height,80px)+1rem)] sm:pt-[calc(var(--header-height,80px)+2rem)] pb-10 md:pb-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Page Header */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Shopping Cart
                        </h1>
                        <p className="text-gray-500 text-xs sm:text-base">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-all"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex gap-3 sm:gap-5">
                                        {/* Product Image */}
                                        <Link href={`/products/${item.id}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 group">
                                            <img
                                                src={item.image || '/placeholder.png'}
                                                alt={item.name}
                                                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder.png';
                                                }}
                                            />
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/products/${item.id}`} className="block group">
                                                        <h3 className="text-sm sm:text-base font-semibold text-text-primary group-hover:text-brand line-clamp-2 mb-1 transition-colors">
                                                            {item.name}
                                                        </h3>
                                                    </Link>
                                                    {item.size && (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-soft text-brand rounded text-xs font-medium mb-2">
                                                            {item.size}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                                    title="Remove item"
                                                >
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Price and Quantity Row */}
                                            <div className="flex items-center justify-between mt-3">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        </svg>
                                                    </button>
                                                    <span className="w-10 text-center font-semibold text-sm text-gray-900">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right">
                                                    <p className="text-lg sm:text-xl font-bold text-brand">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                    {item.originalPrice && item.originalPrice > item.price && (
                                                        <p className="text-xs text-gray-400 line-through">₹{(item.originalPrice * item.quantity).toLocaleString('en-IN')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 sticky top-[calc(var(--header-height,80px)+1.5rem)]">
                                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    Order Summary
                                </h2>

                                {/* Price Breakdown */}
                                <div className="space-y-3 mb-5">
                                    {/* Subtotal */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                                        <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* Coupon discount */}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Coupon Discount</span>
                                            <span className="font-semibold text-green-600">-₹{discount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    {/* GST */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">GST (18%)</span>
                                        <span className="font-medium text-gray-700">₹{gst.toLocaleString('en-IN')}</span>
                                    </div>

                                    {/* Shipping */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Shipping</span>
                                        {isFreeShipping(subtotal) ? (
                                            <span className="font-semibold text-green-600 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Free
                                            </span>
                                        ) : (
                                            <span className="font-medium text-gray-700">₹{shipping.toLocaleString('en-IN')}</span>
                                        )}
                                    </div>

                                    {/* Free shipping progress */}
                                    {!isFreeShipping(subtotal) && (
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                                <span>Free shipping progress</span>
                                                <span>₹{amountForFreeShipping(subtotal)} more</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Total */}
                                <div className="border-t border-gray-200 pt-4 mb-5">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-base font-semibold text-gray-900">Total</span>
                                        <span className="text-2xl font-bold text-brand">₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>

                                    {/* Savings callout */}
                                    {discount > 0 && (
                                        <div className="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-100">
                                            <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                You saved ₹{discount.toLocaleString('en-IN')} with this coupon.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Coupon Section */}
                                <div className="mb-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="text-sm font-bold text-gray-800">Apply Coupon</h3>
                                    </div>

                                    {appliedCoupon ? (
                                        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-dashed border-green-300 rounded-2xl p-4 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_10px_25px_-15px_rgba(34,197,94,0.55)]">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600 font-medium">Coupon Applied</p>
                                                        <p className="text-base font-bold text-green-700 font-mono">{appliedCoupon.code}</p>
                                                        <p className="text-xs text-green-600 mt-0.5">You saved ₹{appliedCoupon.discount.toLocaleString('en-IN')}!</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleRemoveCoupon}
                                                    className="px-3 py-2 rounded-xl text-xs font-bold border border-red-200 bg-white/70 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                                                >
                                                    REMOVE
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gradient-to-br from-amber-50/60 to-white rounded-2xl p-4 border border-dashed border-amber-300 shadow-[0_0_0_1px_rgba(212,175,55,0.12),0_10px_30px_-18px_rgba(212,175,55,0.55)]">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value.toUpperCase());
                                                        if (e.target.value.trim() && availableCoupons.length > 0) {
                                                            setShowCouponSuggestions(true);
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        if (availableCoupons.length > 0) setShowCouponSuggestions(true);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && couponCode.trim()) {
                                                            e.preventDefault();
                                                            handleApplyCoupon();
                                                        }
                                                    }}
                                                    disabled={applyingCoupon}
                                                    className="flex-1 px-4 py-3.5 border-2 border-brand-300 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 uppercase disabled:opacity-50"
                                                />
                                                <button
                                                    onClick={() => handleApplyCoupon()}
                                                    disabled={!couponCode.trim() || applyingCoupon}
                                                    className={`px-6 py-3.5 rounded-xl text-sm font-extrabold tracking-wide transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg border-2 ${!couponCode.trim() || applyingCoupon
                                                        ? 'bg-gray-200 text-gray-600 border-gray-300'
                                                        : 'bg-brand-100 text-brand-dark border-brand hover:bg-brand-200'
                                                        }`}
                                                >
                                                    {applyingCoupon ? 'APPLYING…' : 'APPLY'}
                                                </button>
                                            </div>

                                            {/* Inline feedback */}
                                            {couponFeedback && (
                                                <div
                                                    className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${couponFeedback.type === 'success'
                                                        ? 'bg-green-50 border-green-200 text-green-700'
                                                        : couponFeedback.type === 'error'
                                                            ? 'bg-red-50 border-red-200 text-red-700'
                                                            : couponFeedback.type === 'warning'
                                                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                                                : 'bg-gray-50 border-gray-200 text-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            {couponFeedback.type === 'success' ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            ) : couponFeedback.type === 'error' ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            )}
                                                        </svg>
                                                        <p className="leading-5">{couponFeedback.message}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {availableCoupons.length > 0 && (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => setShowCouponSuggestions(!showCouponSuggestions)}
                                                        className="w-full flex items-center justify-between text-xs font-semibold text-gray-700"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                            Best coupons for you
                                                        </span>
                                                        <span className="text-brand-dark">{showCouponSuggestions ? 'Hide' : 'Show'}</span>
                                                    </button>

                                                    {showCouponSuggestions && (
                                                        <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                                                            {availableCoupons.map((coupon) => (
                                                                <CouponCard
                                                                    key={coupon.id}
                                                                    coupon={coupon}
                                                                    onApply={(c) => handleApplyCoupon(c.code)}
                                                                    isApplied={appliedCoupon?.code === coupon.code}
                                                                    orderAmount={subtotal}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full text-white py-3.5 rounded-xl font-extrabold text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, #2F5D3A 0%, #1F3D2B 100%)',
                                            color: '#FFFFFF'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #1F3D2B 0%, #2F5D3A 100%)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #2F5D3A 0%, #1F3D2B 100%)';
                                        }}
                                    >
                                        Proceed to Checkout
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </button>

                                    <Link
                                        href="/products"
                                        className="block w-full text-center py-3 rounded-xl text-sm font-bold transition-all border-2 border-brand-300 hover:border-brand"
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            color: '#2F5D3A'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#F0F7F2';
                                            e.currentTarget.style.color = '#1F3D2B';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            e.currentTarget.style.color = '#2F5D3A';
                                        }}
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>

                                {/* Trust badges */}
                                <div className="mt-5 pt-5 border-t border-gray-100">
                                    <div className="flex items-center justify-center gap-4 text-gray-400">
                                        <div className="flex items-center gap-1 text-xs">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Secure
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Verified
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
