'use client';

import { useState } from 'react';
import { Coupon } from '@/lib/firebaseCoupons';

// ✅ single source of truth for coupon code format
const normalizeCouponCode = (code: string) =>
    code.replace(/\s+/g, '').toUpperCase();

interface CouponCardProps {
    coupon: Coupon;
    onApply?: (coupon: Coupon) => void;   // 🔥 IMPORTANT: coupon object pass hoga
    isApplied?: boolean;
    orderAmount: number;
}

export default function CouponCard({
    coupon,
    onApply,
    isApplied = false,
    orderAmount,
}: CouponCardProps) {
    const [copied, setCopied] = useState(false);

    const normalizedCode = normalizeCouponCode(coupon.code);

    const isMinAmountMet =
        !coupon.minAmount || orderAmount >= coupon.minAmount;

    // 📋 COPY COUPON
    const handleCopy = () => {
        navigator.clipboard.writeText(normalizedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ✅ APPLY COUPON (DIRECT OBJECT)
    const handleApply = () => {
        if (!onApply || isApplied || !isMinAmountMet) return;
        onApply(coupon); // 🔥 yahi sabse bada fix hai
    };

    return (
        <div
            className={`bg-gradient-to-br from-white to-brand-50 rounded-xl p-4 border-2 transition-all ${isApplied
                ? 'border-success bg-success/5 shadow-lg'
                : 'border-brand-200 hover:border-brand hover:shadow-md'
                }`}
        >
            {/* HEADER */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-brand-100 border-2 border-brand rounded-full flex items-center justify-center">
                            💸
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">
                                Coupon Code
                            </p>
                            <p className="text-base font-bold text-brand-dark font-mono">
                                {normalizedCode}
                            </p>
                        </div>
                    </div>

                    <p className="text-xl font-bold text-gold">
                        {coupon.type === 'percentage'
                            ? `${coupon.value}% OFF`
                            : `₹${coupon.value} OFF`}
                    </p>

                    {coupon.minAmount && (
                        <p className="text-xs text-gray-600 mt-1">
                            Min. order ₹{coupon.minAmount}
                        </p>
                    )}

                    {coupon.description && (
                        <p className="text-xs text-gray-700 mt-1">
                            {coupon.description}
                        </p>
                    )}
                </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={handleCopy}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold"
                >
                    {copied ? 'Copied ✓' : 'Copy'}
                </button>

                {onApply && (
                    <button
                        onClick={handleApply}
                        disabled={isApplied || !isMinAmountMet}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isApplied
                            ? 'bg-success/20 text-success border-2 border-success cursor-not-allowed'
                            : !isMinAmountMet
                                ? 'bg-gray-200 text-gray-500 border-2 border-gray-300 cursor-not-allowed'
                                : 'bg-brand-100 text-brand-dark border-2 border-brand hover:bg-brand-200'
                            }`}
                    >
                        {isApplied ? 'Applied ✓' : 'Apply'}
                    </button>
                )}
            </div>

            {/* VALIDITY */}
            <p className="text-xs text-gray-500 text-center mt-2">
                Valid till{' '}
                {new Date(coupon.validUntil).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                })}
            </p>
        </div>
    );
}
