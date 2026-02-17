import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay instance
// IMPORTANT: Replace these with your actual Razorpay keys
// Get them from: https://dashboard.razorpay.com/app/keys
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: NextRequest) {
    try {
        // Check if Razorpay keys are configured
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_S1qGojViHE11Lc';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '63LGj1KargqMwVpBZL57hgSI';

        if (!keySecret || keySecret === 'your_key_secret_here') {
            console.error('Razorpay Key Secret is not configured');
            return NextResponse.json(
                {
                    error: 'Razorpay Key Secret is not configured. Please add RAZORPAY_KEY_SECRET to .env.local file.',
                    details: 'Get your Key Secret from: https://dashboard.razorpay.com/app/keys'
                },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { amount, currency = 'INR', receipt, notes } = body;

        // Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // Convert to paise (multiply by 100)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {},
        };

        console.log('Creating Razorpay order with options:', {
            amount: options.amount,
            currency: options.currency,
            receipt: options.receipt,
            keyId: keyId.substring(0, 10) + '...' // Log partial key for debugging
        });

        const order = await razorpay.orders.create(options);

        console.log('Razorpay order created successfully:', order.id);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error: any) {
        console.error('Razorpay order creation error:', error);
        console.error('Error details:', {
            message: error.message,
            description: error.description,
            field: error.field,
            source: error.source,
            step: error.step,
            reason: error.reason,
            metadata: error.metadata
        });

        // Provide more helpful error messages
        let errorMessage = 'Failed to create order';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.description) {
            errorMessage = error.description;
        } else if (error.reason) {
            errorMessage = error.reason;
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: error.description || error.reason || 'Please check Razorpay configuration and try again.'
            },
            { status: 500 }
        );
    }
}

