import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/firebaseCoupons';
import { getFirebaseDatabase } from '@/lib/firebase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, orderAmount } = body;

        // Validate input
        if (!code || typeof code !== 'string' || !code.trim()) {
            return NextResponse.json(
                { success: false, error: 'Coupon code is required' },
                { status: 400 }
            );
        }

        if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Valid order amount is required' },
                { status: 400 }
            );
        }

        // Ensure Firebase is initialized
        const db = getFirebaseDatabase();
        if (!db) {
            console.warn('[API] Firebase database not available, attempting to validate anyway');
        }

        // Validate coupon
        console.log('[API] Validating coupon:', { code, orderAmount, dbAvailable: !!db });
        const result = await validateCoupon(code, orderAmount);

        console.log('[API] Coupon validation result:', {
            code,
            orderAmount,
            valid: result.valid,
            error: result.error,
            discount: result.discount,
            couponFound: !!result.coupon
        });

        if (result.valid && result.coupon && result.discount !== undefined) {
            return NextResponse.json({
                success: true,
                coupon: {
                    code: result.coupon.code,
                    type: result.coupon.type,
                    value: result.coupon.value,
                    description: result.coupon.description,
                },
                discount: result.discount,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error || 'Invalid coupon code' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Coupon validation API error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to validate coupon. Please try again.' },
            { status: 500 }
        );
    }
}

