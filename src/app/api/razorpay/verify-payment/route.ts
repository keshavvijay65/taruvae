import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderStatusInFirebase } from '@/lib/firebaseOrders';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            console.error('RAZORPAY_KEY_SECRET not configured');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        // Create signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(text)
            .digest('hex');

        // Verify signature
        const isSignatureValid = generatedSignature === razorpay_signature;

        if (isSignatureValid) {
            // Update order status in Firebase if order_id is provided
            if (order_id) {
                try {
                    await updateOrderStatusInFirebase(order_id, 'processing', 'Payment verified and order confirmed.', {
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        paymentStatus: 'paid'
                    });
                } catch (dbError) {
                    console.error('Error updating order status after payment:', dbError);
                    // We don't fail the verification if DB update fails, but log it
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
            });
        } else {
            console.error('Payment signature mismatch');
            return NextResponse.json(
                { success: false, error: 'Invalid payment signature' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Payment verification failed' },
            { status: 500 }
        );
    }
}

