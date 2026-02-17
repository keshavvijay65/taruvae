'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getCouponsFromFirebase, Coupon } from '@/lib/firebaseCoupons';

export default function TopCouponBar() {
    const pathname = usePathname();
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkCouponValidity = (coupon: Coupon): boolean => {
        // Check if coupon is active
        if (!coupon.isActive) {
            return false;
        }

        // Check if coupon is within validity period
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const validFromDate = new Date(validFrom.getFullYear(), validFrom.getMonth(), validFrom.getDate());
        const validUntilDate = new Date(validUntil.getFullYear(), validUntil.getMonth(), validUntil.getDate());

        if (nowDate < validFromDate || nowDate > validUntilDate) {
            return false;
        }

        // Check usage limit if set
        if (coupon.usageLimit && coupon.usageLimit > 0) {
            const usedCount = coupon.usedCount || 0;
            if (usedCount >= coupon.usageLimit) {
                return false;
            }
        }

        return true;
    };

    const loadActiveCoupon = async () => {
        try {
            const coupons = await getCouponsFromFirebase();
            const validCoupon = coupons.find((coupon: Coupon) => checkCouponValidity(coupon) && coupon.showOnHome);

            if (validCoupon) {
                setActiveCoupon(validCoupon);
            } else {
                setActiveCoupon(null);
            }
        } catch (error) {
            console.error('Error loading active coupon:', error);
            setActiveCoupon(null);
        }
    };

    useEffect(() => {
        setMounted(true);
        loadActiveCoupon();

        const handleStorageChange = () => {
            loadActiveCoupon();
        };
        window.addEventListener('taruvae-coupons-updated', handleStorageChange);

        intervalRef.current = setInterval(() => {
            loadActiveCoupon();
        }, 30000);

        return () => {
            window.removeEventListener('taruvae-coupons-updated', handleStorageChange);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const isAdmin = pathname?.startsWith('/admin');
    const isValid = activeCoupon ? checkCouponValidity(activeCoupon) : false;
    const isVisible = mounted && !isAdmin && activeCoupon && isValid;

    // Dynamic height measurement
    useEffect(() => {
        const updateHeight = () => {
            if (mounted && isVisible && containerRef.current) {
                const height = containerRef.current.offsetHeight;
                document.documentElement.style.setProperty('--top-bar-height', `${height}px`);
                window.dispatchEvent(new CustomEvent('taruvae-topbar-height-change', { detail: { height } }));
            } else {
                document.documentElement.style.setProperty('--top-bar-height', '0px');
                window.dispatchEvent(new CustomEvent('taruvae-topbar-height-change', { detail: { height: 0 } }));
            }
        };

        // Initial update
        updateHeight();

        // Update on window resize
        window.addEventListener('resize', updateHeight);

        // Update when visibility/mount status changes
        return () => window.removeEventListener('resize', updateHeight);
    }, [isVisible, mounted]);

    // Don't render if not visible
    if (!isVisible || !activeCoupon) {
        return null;
    }

    // Format discount text
    const discountText = activeCoupon.type === 'percentage'
        ? `${activeCoupon.value}% OFF`
        : `₹${activeCoupon.value} OFF`;

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 right-0 z-[101] w-full overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #1F3D2B 0%, #2F5D3A 50%, #1F3D2B 100%)',
                boxShadow: '0 2px 8px rgba(31, 61, 43, 0.3)'
            }}>
            {/* Subtle organic pattern overlay */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand-300 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-200 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl relative z-10">
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 relative">
                    {/* Decorative leaf elements */}
                    <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 opacity-20">
                        <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 opacity-20">
                        <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>

                    <p className="text-xs sm:text-sm md:text-base font-medium text-center relative z-10" style={{ color: '#F6F3EE' }}>
                        <span className="inline-flex items-center gap-1">
                            <span className="text-[10px] opacity-70">🌿</span>
                            Pure Desi Ghee &amp; Oils at{' '}
                        </span>
                        <span className="font-bold px-1.5 py-0.5 rounded" style={{
                            color: '#B8954A',
                            backgroundColor: 'rgba(184, 149, 74, 0.15)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                        }}>{discountText}</span>
                        <span className="hidden sm:inline mx-1.5" style={{ color: '#F6F3EE', opacity: 0.4 }}> | </span>
                        <span className="font-medium">Use Code:</span>{' '}
                        <span className="font-mono font-bold tracking-wide px-2 py-0.5 rounded" style={{
                            color: '#B8954A',
                            backgroundColor: 'rgba(184, 149, 74, 0.15)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                        }}>{activeCoupon.code}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

