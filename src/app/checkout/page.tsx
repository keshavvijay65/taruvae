'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { getCouponsFromFirebase, Coupon } from '@/lib/firebaseCoupons';
import { Order } from '@/types';
import {
    calculateOrderSummary,
    calculateCouponDiscount,
    isFreeShipping,
    rupeesToPaise,
    CartItem,
    AppliedCoupon,
    CouponData,
} from '@/lib/orderCalculations';

const normalizeCouponCode = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, '').toUpperCase();
};


// Declare Razorpay types
declare global {
    interface Window {
        Razorpay: any;
    }
}

// ============================================================================
// CHECKOUT CONTENT COMPONENT (Uses useSearchParams)
// ============================================================================
function CheckoutContent() {
    const { cart, getTotalItems, clearCart } = useCart();
    const { user } = useAuth();
    const { addresses, addAddress } = useUserProfile();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        paymentMethod: 'cod',
        couponCode: '',
    });

    // Coupon state
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
    const [showCouponSuggestions, setShowCouponSuggestions] = useState(false);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [couponFeedback, setCouponFeedback] = useState<{
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
    } | null>(null);

    // UI state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const MERCHANT_NAME = 'Taruvaé Naturals';
    const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    // ========================================================================
    // MEMOIZED ORDER SUMMARY - Single source of truth
    // FORMULA: Total = TaxableAmount + GST + Shipping
    // Where: TaxableAmount = Subtotal - Discount, GST = 18% of TaxableAmount
    // ========================================================================
    const orderSummary = useMemo(() => {
        return calculateOrderSummary(cart as CartItem[], appliedCoupon);
    }, [cart, appliedCoupon]);

    // Destructure for easy access
    const { subtotal, discount, taxableAmount, gst, shipping, total, itemCount } = orderSummary;

    // ========================================================================
    // COUPON HANDLERS
    // ========================================================================

    // Load available coupons for suggestions
    useEffect(() => {
        const loadAvailableCoupons = async () => {
            try {
                setLoadingCoupons(true);
                const coupons = await getCouponsFromFirebase();
                const now = new Date();

                const active = coupons.filter(coupon => {
                    if (!coupon.isActive) return false;
                    if (!coupon.showOnCheckout) return false;
                    const validFrom = new Date(coupon.validFrom);
                    const validUntil = new Date(coupon.validUntil);
                    if (now < validFrom || now > validUntil) return false;
                    // Note: We show it even if minAmount is not met, so the user knows about it
                    // but they might need to add more items to use it.
                    // However, original code had: if (coupon.minAmount && subtotal < coupon.minAmount) return false;
                    // I will keep it as it was but add the showOnCheckout flag.
                    if (coupon.minAmount && subtotal < coupon.minAmount) return false;
                    return true;
                }).slice(0, 5); // Increased slice to 5 to show more options if available

                setAvailableCoupons(active);
            } catch (error) {
                console.error('Error loading coupons:', error);
            } finally {
                setLoadingCoupons(false);
            }
        };

        loadAvailableCoupons();
    }, [subtotal]);

    // Apply coupon function - Use already loaded coupons first
    const handleApplyCoupon = useCallback(async (couponCode?: string, couponObject?: Coupon) => {
        if (applyingCoupon) return;

        setApplyingCoupon(true);
        setCouponFeedback(null);

        try {
            const codeToApply = normalizeCouponCode(couponCode ?? formData.couponCode);

            if (!codeToApply && !couponObject) {
                setCouponFeedback({ type: 'error', message: 'Please enter a coupon code.' });
                setApplyingCoupon(false);
                return;
            }

            // Use the centralized validation logic from firebaseCoupons library
            const { validateCoupon } = await import('@/lib/firebaseCoupons');
            const result = await validateCoupon(codeToApply || (couponObject?.code || ''), subtotal);

            if (result.valid && result.coupon && result.discount !== undefined) {
                const nextApplied: AppliedCoupon = {
                    code: result.coupon.code,
                    discount: result.discount,
                    type: result.coupon.type,
                    value: result.coupon.value,
                };
                setAppliedCoupon(nextApplied);
                setFormData(prev => ({ ...prev, couponCode: result.coupon!.code }));
                setShowCouponSuggestions(false);
                setCouponFeedback({
                    type: 'success',
                    message: `Coupon applied. You saved ₹${result.discount.toLocaleString('en-IN')} with ${result.coupon.code}.`,
                });
            } else {
                setAppliedCoupon(null);
                setCouponFeedback({
                    type: 'error',
                    message: result.error || 'Failed to validate coupon. Please try again.',
                });
            }
        } catch (error: any) {
            console.error('Error applying coupon:', error);
            setAppliedCoupon(null);
            setCouponFeedback({
                type: 'error',
                message: error.message || 'Failed to validate coupon. Please try again.',
            });
        } finally {
            setApplyingCoupon(false);
        }
    }, [formData.couponCode, subtotal, applyingCoupon]);

    // Remove coupon - clean state reset with full recalculation
    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setFormData(prev => ({ ...prev, couponCode: '' }));
        setCouponFeedback({ type: 'info', message: 'Coupon removed.' });
    }, []);

    // FIX: Auto-remove coupon if subtotal goes below minimum order amount
    // This ensures coupon state stays consistent with cart changes
    // Using appliedCoupon?.code to properly track when we need to re-validate
    useEffect(() => {
        const couponCode = appliedCoupon?.code;
        const currentDiscount = appliedCoupon?.discount;

        if (!couponCode || subtotal <= 0) return;

        // Re-validate the coupon against current subtotal
        const validateCurrentCoupon = async () => {
            try {
                const response = await fetch('/api/coupons/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: couponCode,
                        orderAmount: subtotal,
                    }),
                });

                const data = await response.json();

                if (!data.success || !data.discount || data.discount <= 0) {
                    // Coupon no longer valid - auto-remove
                    setAppliedCoupon(null);
                    setFormData(prev => ({ ...prev, couponCode: '' }));
                    setCouponFeedback({
                        type: 'warning',
                        message: data.error || 'Coupon is no longer valid for your cart and was removed.',
                    });
                } else if (data.discount !== currentDiscount) {
                    // Discount amount changed - update it
                    setAppliedCoupon(prev => prev ? { ...prev, discount: data.discount } : null);
                }
            } catch (error) {
                // On error, keep the coupon but log warning
                console.warn('Could not re-validate coupon:', error);
            }
        };

        validateCurrentCoupon();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal, appliedCoupon?.code]); // Re-run when subtotal or coupon code changes

    // Load coupon from URL if present
    useEffect(() => {
        const couponFromUrl = searchParams.get('coupon');
        if (couponFromUrl && !appliedCoupon && !applyingCoupon) {
            const timer = setTimeout(() => {
                handleApplyCoupon(couponFromUrl);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchParams, appliedCoupon, applyingCoupon, handleApplyCoupon]);

    // ========================================================================
    // PAYMENT HANDLERS
    // ========================================================================

    const handleRazorpayPayment = async () => {
        const validationResult = validateForm();
        if (!validationResult.isValid) {
            const errorKeys = Object.keys(validationResult.errors);
            if (errorKeys.length > 0) {
                setAlertModal({
                    isOpen: true,
                    title: 'Validation Error',
                    message: validationResult.errors[errorKeys[0]] || 'Please fill all required fields',
                    type: 'error',
                });
                setTimeout(() => {
                    const element = document.querySelector(`[name="${errorKeys[0]}"]`) as HTMLElement;
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element?.focus();
                }, 100);
            }
            return;
        }

        if (!razorpayLoaded || !window.Razorpay) {
            setAlertModal({
                isOpen: true,
                title: 'Payment Gateway Error',
                message: 'Razorpay is not loaded. Please refresh the page.',
                type: 'error',
            });
            return;
        }

        try {
            // STEP 1: Create order in database FIRST with pending status
            const orderId = `ORD-${Date.now()}`;
            const currentTotal = total; // Capture total at order creation
            console.log('[Checkout] Total ₹:', currentTotal);
            console.log('[Checkout] Total Paise:', rupeesToPaise(currentTotal));

            const orderData: Order = {
                orderId,
                userId: user?.uid || null,
                customer: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                },
                shippingAddress: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity,
                })),
                paymentMethod: 'razorpay',
                paymentStatus: 'pending' as const, // PENDING until payment verified
                subtotal,
                discount,
                taxableAmount,
                gst,
                shipping,
                total: currentTotal,
                totalAmount: currentTotal,
                ...(appliedCoupon && {
                    couponCode: normalizeCouponCode(appliedCoupon.code),
                    couponDiscount: appliedCoupon.discount,
                }),
                orderDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: 'pending',
                statusHistory: [{
                    status: 'pending',
                    date: new Date().toISOString(),
                    message: 'Order created, awaiting payment',
                }],
            };

            // Save order with pending status
            const { saveOrderToFirebase } = await import('@/lib/firebaseOrders');
            const saveResult = await saveOrderToFirebase(orderData);

            if (!saveResult.success) {
                throw new Error('Failed to create order. Please try again.');
            }

            // STEP 2: Create Razorpay order
            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: currentTotal, // ✅ rupees
                    currency: 'INR',
                    receipt: orderId,
                    notes: {
                        order_id: orderId,
                        customer_name: `${formData.firstName} ${formData.lastName}`,
                        customer_email: formData.email,
                        customer_phone: formData.phone,
                    },
                }),
            });

            const razorpayOrderData = await orderResponse.json();
            console.log('[Checkout] Razorpay order response:', razorpayOrderData);


            if (!orderResponse.ok || !razorpayOrderData.success || !razorpayOrderData.orderId) {
                // Update order status to failed
                await updateOrderStatus(orderId, 'failed', 'Razorpay order creation failed');
                throw new Error(razorpayOrderData.error || 'Failed to create payment order');
            }

            const options = {
                key: RAZORPAY_KEY_ID,
                amount: razorpayOrderData.amount,
                currency: razorpayOrderData.currency,
                name: MERCHANT_NAME,
                description: `Order Payment - ${orderId}`,
                order_id: razorpayOrderData.orderId,
                handler: async function (response: any) {
                    // STEP 3: Verify payment signature on server
                    const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: orderId, // Pass internal orderId for server-side update
                        }),
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        // STEP 4: Update order to paid ONLY after verification
                        await handlePaymentSuccess(orderId, razorpayOrderData.orderId, response.razorpay_payment_id, response.razorpay_signature);
                    } else {
                        // Payment verification failed - update order status
                        await updateOrderStatus(orderId, 'failed', 'Payment verification failed');
                        setAlertModal({
                            isOpen: true,
                            title: 'Payment Verification Failed',
                            message: verifyData.error || 'Payment could not be verified.',
                            type: 'error',
                        });
                    }
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: { color: '#2F5D3A' },
                modal: {
                    ondismiss: function () {
                        setAlertModal({
                            isOpen: true,
                            title: 'Payment Cancelled',
                            message: 'You cancelled the payment. Order is saved with pending status.',
                            type: 'info',
                        });
                    },
                },
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (error: any) {
            console.error('Razorpay payment error:', error);
            setAlertModal({
                isOpen: true,
                title: 'Payment Error',
                message: error.message || 'Failed to process payment.',
                type: 'error',
            });
        }
    };

    // Helper function to update order status
    const updateOrderStatus = async (orderId: string, status: string, message: string) => {
        try {
            const { updateOrderStatusInFirebase } = await import('@/lib/firebaseOrders');
            await updateOrderStatusInFirebase(orderId, status, message);
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    // Handle successful payment
    const handlePaymentSuccess = async (
        orderId: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ) => {
        try {
            // Get order from Firebase or localStorage
            const { getAllOrdersFromFirebase, saveOrderToFirebase } = await import('@/lib/firebaseOrders');
            let orders = await getAllOrdersFromFirebase();
            let order = orders.find(o => o.orderId === orderId);

            // Fallback to localStorage if not found in Firebase
            if (!order) {
                const localOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                order = localOrders.find((o: any) => o.orderId === orderId);
            }

            if (order) {
                const updatedOrder: Order = {
                    ...order,
                    paymentStatus: 'paid' as const,
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                    status: 'confirmed',
                    totalAmount: order.totalAmount || total,
                    statusHistory: [
                        ...(order.statusHistory || []),
                        {
                            status: 'paid',
                            date: new Date().toISOString(),
                            message: 'Payment verified and received',
                        },
                        {
                            status: 'confirmed',
                            date: new Date().toISOString(),
                            message: 'Order confirmed and payment received',
                        },
                    ],
                };

                await saveOrderToFirebase(updatedOrder);

                // Send email notifications (non-blocking)
                fetch('/api/send-order-emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, order: updatedOrder }),
                }).catch(err => console.error('Email sending failed (non-critical):', err));

                // Increment coupon usage if applied
                if (appliedCoupon) {
                    try {
                        const { getCouponsFromFirebase, saveCouponsToFirebase } = await import('@/lib/firebaseCoupons');
                        const coupons = await getCouponsFromFirebase();
                        const coupon = coupons.find(c => c.code === normalizeCouponCode(appliedCoupon.code));
                        if (coupon) {
                            coupon.usedCount = (coupon.usedCount || 0) + 1;
                            coupon.updatedAt = new Date().toISOString();
                            await saveCouponsToFirebase(coupons);
                        }
                    } catch (couponError) {
                        console.error('Error incrementing coupon usage:', couponError);
                    }
                }

                // [FIX] Sync phone to user profile if missing
                if (user && order.customer?.phone && (!user.phone || user.phone.trim() === '')) {
                    try {
                        const { updateUserProfile } = await import('@/lib/authHelpers');
                        await updateUserProfile(user.uid, { phone: order.customer.phone });
                    } catch (syncError) {
                        console.warn('Silent phone sync after online payment failed', syncError);
                    }
                }

                setAlertModal({
                    isOpen: true,
                    title: 'Order Placed Successfully!',
                    message: `Order ID: ${orderId}\nPayment ID: ${razorpayPaymentId}\nTotal: ₹${(order.totalAmount || total).toLocaleString('en-IN')}`,
                    type: 'success',
                });
                clearCart();
                setTimeout(() => router.push(`/orders?success=true&orderId=${orderId}`), 2000);
            } else {
                throw new Error('Order not found');
            }
        } catch (error) {
            console.error('Error updating order after payment:', error);
            setAlertModal({
                isOpen: true,
                title: 'Payment Successful',
                message: `Payment received (ID: ${razorpayPaymentId}) but order update failed. Please contact support with this payment ID.`,
                type: 'warning',
            });
        }
    };

    // ========================================================================
    // ORDER PLACEMENT - Uses exact same orderSummary values
    // ========================================================================

    const handleOrderPlacement = async (paymentMethod: string) => {
        // For COD orders, create order directly with confirmed status
        const orderData: Order = {
            orderId: `ORD-${Date.now()}`,
            userId: user?.uid || null,
            customer: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
            },
            shippingAddress: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity,
            })),
            paymentMethod,
            paymentStatus: (paymentMethod === 'cod' ? 'pending' : 'paid') as 'pending' | 'paid',
            subtotal,
            discount,
            taxableAmount,
            gst,
            shipping,
            total,
            totalAmount: total,
            ...(appliedCoupon && {
                couponCode: normalizeCouponCode(appliedCoupon.code),
                couponDiscount: appliedCoupon.discount,
            }),
            orderDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
            trackingNumber: `TRK${Date.now()}`,
            statusHistory: [{
                status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
                date: new Date().toISOString(),
                message: paymentMethod === 'cod' ? 'Order placed, payment on delivery' : 'Order confirmed and payment received',
            }],
        };

        try {
            const { saveOrderToFirebase } = await import('@/lib/firebaseOrders');
            const result = await saveOrderToFirebase(orderData);

            if (result.success) {
                // Increment coupon usage if applied
                if (appliedCoupon) {
                    try {
                        const { getCouponsFromFirebase, saveCouponsToFirebase } = await import('@/lib/firebaseCoupons');
                        const coupons = await getCouponsFromFirebase();
                        const coupon = coupons.find(c => c.code === normalizeCouponCode(appliedCoupon.code));
                        if (coupon) {
                            coupon.usedCount = (coupon.usedCount || 0) + 1;
                            coupon.updatedAt = new Date().toISOString();
                            await saveCouponsToFirebase(coupons);
                        }
                    } catch (couponError) {
                        console.error('Error incrementing coupon usage:', couponError);
                    }
                }

                // Send email notifications (non-blocking)
                fetch('/api/send-order-emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: orderData.orderId, order: orderData }),
                }).catch(err => console.error('Email sending failed (non-critical):', err));

                // [FIX] Sync phone to user profile if missing
                if (user && formData.phone && (!user.phone || user.phone.trim() === '')) {
                    try {
                        const { updateUserProfile } = await import('@/lib/authHelpers');
                        await updateUserProfile(user.uid, { phone: formData.phone });
                    } catch (syncError) {
                        console.warn('Silent phone sync during checkout failed', syncError);
                    }
                }

                setAlertModal({
                    isOpen: true,
                    title: 'Order Placed Successfully!',
                    message: `Order ID: ${orderData.orderId}\nTotal: ₹${total.toLocaleString('en-IN')}`,
                    type: 'success',
                });
                clearCart();
                setTimeout(() => router.push(`/orders?success=true&orderId=${orderData.orderId}`), 2000);
            } else {
                throw new Error(result.message || 'Failed to store order');
            }
        } catch (error) {
            console.error('Error storing order:', error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to place order. Please try again.',
                type: 'error',
            });
        }
    };

    // ========================================================================
    // FORM HANDLERS
    // ========================================================================

    // Prefill form for logged in users
    useEffect(() => {
        if (formData.firstName || formData.address || formData.city) return;

        if (user) {
            const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];

            if (defaultAddress) {
                setFormData(prev => ({
                    ...prev,
                    firstName: defaultAddress.firstName || '',
                    lastName: defaultAddress.lastName || '',
                    email: defaultAddress.email || user.email || '',
                    phone: defaultAddress.phone || user.phone || '',
                    address: defaultAddress.address || '',
                    city: defaultAddress.city || '',
                    state: defaultAddress.state || '',
                    pincode: defaultAddress.pincode || '',
                }));
            } else {
                const nameParts = user.name ? user.name.split(' ') : [];
                setFormData(prev => ({
                    ...prev,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    email: user.email || '',
                    phone: user.phone || '',
                }));
            }
        }
    }, [user, addresses, formData.firstName, formData.address, formData.city]);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => {
            console.error('Failed to load Razorpay script');
            setAlertModal({
                isOpen: true,
                title: 'Payment Gateway Error',
                message: 'Failed to load payment gateway. Please refresh the page.',
                type: 'error',
            });
        };
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existingScript?.parentNode) {
                existingScript.parentNode.removeChild(existingScript);
            }
        };
    }, []);

    // Auto-fill for guests
    useEffect(() => {
        if (!user && (formData.email || formData.phone) && !formData.address) {
            try {
                const guestKey = formData.email?.toLowerCase() || formData.phone;
                const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                const savedAddresses = guestAddresses[guestKey] || [];

                if (savedAddresses.length > 0) {
                    const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault) || savedAddresses[savedAddresses.length - 1];
                    if (defaultAddress) {
                        setFormData(prev => ({
                            ...prev,
                            firstName: prev.firstName || defaultAddress.firstName || '',
                            lastName: prev.lastName || defaultAddress.lastName || '',
                            email: prev.email || defaultAddress.email || '',
                            phone: prev.phone || defaultAddress.phone || '',
                            address: prev.address || defaultAddress.address || '',
                            city: prev.city || defaultAddress.city || '',
                            state: prev.state || defaultAddress.state || '',
                            pincode: prev.pincode || defaultAddress.pincode || '',
                        }));
                    }
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        }
    }, [formData.email, formData.phone, user, formData.address]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number must be 10 digits';
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
            newErrors.pincode = 'Pincode must be 6 digits';
        }

        setErrors(newErrors);
        return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.paymentMethod === 'razorpay') {
            await handleRazorpayPayment();
            return;
        }

        const validationResult = validateForm();
        if (!validationResult.isValid) return;

        // Save address
        try {
            if (user) {
                await addAddress({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    isDefault: addresses.length === 0,
                });
            } else {
                const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                const guestKey = formData.email.toLowerCase() || formData.phone;
                if (guestKey) {
                    if (!guestAddresses[guestKey]) guestAddresses[guestKey] = [];
                    guestAddresses[guestKey].push({
                        id: `guest-addr-${Date.now()}`,
                        ...formData,
                        isDefault: guestAddresses[guestKey].length === 0,
                        createdAt: new Date().toISOString(),
                    });
                    localStorage.setItem('taruvae-guest-addresses', JSON.stringify(guestAddresses));
                }
            }
        } catch (error) {
            console.error('Error saving address:', error);
        }

        await handleOrderPlacement('cod');
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    if (cart.length === 0) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-black mb-4">Your cart is empty</h2>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-brand-100 text-brand-dark border-2 border-brand px-8 py-3 rounded-lg font-bold text-base hover:bg-brand-200 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alertModal.isOpen}
                    title={alertModal.title}
                    message={alertModal.message}
                    type={alertModal.type}
                    onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                />
            </>
        );
    }

    return (
        <>
            <div className="pt-[calc(var(--header-height,80px)+2rem)] pb-20 bg-gradient-page min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Header */}
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-forest mb-3 font-serif">
                            Checkout
                        </h1>
                        <p className="text-text-secondary text-sm sm:text-base max-w-2xl">Complete your order with Taruvaé Naturals. Secure and seamless experience.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-8 space-y-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Saved Addresses - For logged in users */}
                                {user && addresses.length > 0 && (
                                    <div className="card-premium p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl sm:text-2xl font-bold text-brand-forest font-serif">
                                                Saved Addresses
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {addresses.map((addr) => (
                                                <button
                                                    key={addr.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            firstName: addr.firstName,
                                                            lastName: addr.lastName,
                                                            email: addr.email,
                                                            phone: addr.phone,
                                                            address: addr.address,
                                                            city: addr.city,
                                                            state: addr.state,
                                                            pincode: addr.pincode,
                                                        }));
                                                    }}
                                                    className={`w-full text-left p-4 border-2 rounded-xl transition-all relative ${formData.address === addr.address ? 'border-gold bg-gold/5 ring-1 ring-gold/20' : 'border-border-soft hover:border-gold/50 bg-white/50'}`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <p className="font-bold text-brand-forest">{addr.firstName} {addr.lastName}</p>
                                                                {addr.isDefault && (
                                                                    <span className="px-2 py-0.5 bg-gold/10 text-gold-dark text-[10px] font-bold rounded uppercase tracking-wider border border-gold/20">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-text-secondary leading-relaxed">{addr.address}</p>
                                                            <p className="text-sm text-text-secondary">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                            <p className="text-sm text-brand-main font-medium mt-2">{addr.phone}</p>
                                                        </div>
                                                        {formData.address === addr.address && (
                                                            <div className="w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center shrink-0">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    firstName: '',
                                                    lastName: '',
                                                    address: '',
                                                    city: '',
                                                    state: '',
                                                    pincode: '',
                                                }));
                                            }}
                                            className="mt-6 w-full px-6 py-3 bg-brand-light text-brand-forest border border-brand-forest/10 font-bold rounded-xl hover:bg-beige transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add New Address
                                        </button>
                                    </div>
                                )}

                                {/* Personal & Shipping Information */}
                                <div className="card-premium p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                        <h2 className="text-xl sm:text-2xl font-bold text-brand-forest font-serif flex items-center gap-3">
                                            <span className="w-10 h-10 bg-brand-forest text-gold rounded-full flex items-center justify-center text-sm font-bold shadow-green shrink-0">1</span>
                                            Delivery Details
                                        </h2>
                                        {user && (
                                            <span className="text-xs px-3 py-1 bg-brand-light text-brand-forest rounded-full font-bold flex items-center gap-2 border border-brand-main/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-main animate-pulse" />
                                                Logged In as {user.name || 'User'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                placeholder="e.g. Rahul"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.firstName ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.firstName && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.firstName}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="e.g. Sharma"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.lastName ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.lastName && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.lastName}</p>}
                                        </div>
                                        <div className="sm:col-span-1 space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="name@example.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.email && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.email}</p>}
                                        </div>
                                        <div className="sm:col-span-1 space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">Phone Number</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-sm">+91</span>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="00000 00000"
                                                    value={formData.phone}
                                                    onChange={(e) => {
                                                        const phoneValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setFormData(prev => ({ ...prev, phone: phoneValue }));
                                                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                                    }}
                                                    className={`w-full pl-12 pr-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.phone ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                                />
                                            </div>
                                            {errors.phone && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.phone}</p>}
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">Complete Address</label>
                                            <textarea
                                                name="address"
                                                placeholder="Flat/House No., Building, Street, Area"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all resize-none ${errors.address ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.address && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.address}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                placeholder="City Name"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.city ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.city && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.city}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">State</label>
                                            <input
                                                type="text"
                                                name="state"
                                                placeholder="State Name"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.state ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.state && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.state}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-brand-forest ml-1">Pincode</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                placeholder="6-digit Pincode"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                                maxLength={6}
                                                className={`w-full px-4 py-3.5 bg-beige/30 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-main/5 transition-all ${errors.pincode ? 'border-red-400 bg-red-50/30' : 'border-border-soft focus:border-brand-main'}`}
                                            />
                                            {errors.pincode && <p className="text-red-500 text-[11px] font-bold ml-1 uppercase tracking-wider">{errors.pincode}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="card-premium p-6 sm:p-8">
                                    <h2 className="text-xl sm:text-2xl font-bold text-brand-forest font-serif flex items-center gap-3 mb-8">
                                        <span className="w-10 h-10 bg-brand-forest text-gold rounded-full flex items-center justify-center text-sm font-bold shadow-green shrink-0">2</span>
                                        Payment Method
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className={`relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-gold bg-gold/5 ring-1 ring-gold/20 shadow-md' : 'border-border-soft hover:border-gold/30 bg-white/50'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-gold border-gray-300 focus:ring-gold"
                                            />
                                            <div className="ml-4">
                                                <span className="block font-bold text-brand-forest">Cash on Delivery</span>
                                                <span className="block text-xs text-text-secondary mt-1">Pay with cash at your doorstep</span>
                                            </div>
                                            <div className="ml-auto text-2xl">💵</div>
                                        </label>

                                        <label className={`relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'razorpay' ? 'border-gold bg-gold/5 ring-1 ring-gold/20 shadow-md' : 'border-border-soft hover:border-gold/30 bg-white/50'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="razorpay"
                                                checked={formData.paymentMethod === 'razorpay'}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-gold border-gray-300 focus:ring-gold"
                                            />
                                            <div className="ml-4">
                                                <span className="block font-bold text-brand-forest">Online Payment</span>
                                                <span className="block text-xs text-text-secondary mt-1">UPI, Cards, Netbanking</span>
                                            </div>
                                            <div className="ml-auto text-2xl">💳</div>
                                        </label>
                                    </div>

                                    {formData.paymentMethod === 'razorpay' && (
                                        <div className="mt-6 p-4 bg-brand-light/30 border border-brand-main/10 rounded-xl flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-forest/10 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-brand-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-xs text-brand-forest leading-relaxed">
                                                <p className="font-bold mb-1">Secure Checkout with Razorpay</p>
                                                <p>Experience the highest level of security with 128-bit encryption. Your payment info is never stored on our servers.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full py-5 text-lg group relative overflow-hidden flex items-center justify-center gap-3"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    {formData.paymentMethod === 'cod' ? 'Confirm Order' : `Pay ₹${total.toLocaleString('en-IN')}`}
                                </button>
                                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-text-secondary px-4">
                                    By placing your order, you agree to Taruvaé Naturals <Link href="/terms" className="text-brand-forest font-bold hover:underline">Terms of Service</Link>
                                </p>
                            </form>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                            <div className="card-premium p-4 sm:p-8 sticky top-[calc(var(--header-height,80px)+1.5rem)]">
                                <h2 className="text-lg sm:text-xl font-bold text-brand-forest mb-4 sm:mb-6 font-serif">
                                    Order Summary
                                </h2>

                                {/* Cart Items */}
                                <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-beige/20 border border-brand-main/5 group hover:bg-beige/40 transition-colors">
                                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-brand-main/10 shadow-sm">
                                                <img
                                                    src={item.image || '/placeholder.png'}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <h3 className="font-bold text-sm text-brand-forest line-clamp-1 group-hover:text-brand-main transition-colors">{item.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                                                    {item.size && <span className="bg-brand-light px-2 py-0.5 rounded-full text-brand-forest font-bold">{item.size}</span>}
                                                    <span className="font-medium">Qty: {item.quantity}</span>
                                                </div>
                                                <p className="text-sm font-extrabold text-brand-main mt-2">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3 mb-8 p-5 bg-brand-forest/[0.02] border border-brand-main/5 rounded-2xl">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Subtotal ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})</span>
                                        <span className="font-bold text-brand-forest">₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-secondary">Coupon Discount</span>
                                            <span className="font-bold text-success">-₹{discount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">GST (18%)</span>
                                        <span className="font-bold text-brand-forest">₹{gst.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Shipping</span>
                                        {isFreeShipping(subtotal) ? (
                                            <span className="font-bold text-success uppercase tracking-wider text-[10px] bg-success/10 px-2 py-0.5 rounded">Free Shipping</span>
                                        ) : (
                                            <span className="font-bold text-brand-forest">₹{shipping.toLocaleString('en-IN')}</span>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-brand-main/10 mt-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-lg font-bold text-brand-forest font-serif">Total Amount</span>
                                            <span className="text-2xl font-extrabold text-brand-main">₹{total.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-widest text-center">Inclusive of all taxes</p>
                                    </div>
                                </div>

                                {/* Savings callout */}
                                {discount > 0 && (
                                    <div className="mb-8 p-4 bg-gradient-gold text-white rounded-2xl shadow-gold animate-pulse-subtle">
                                        <p className="text-xs font-bold flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Premium Savings: ₹{discount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                )}

                                {/* Coupon Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-brand-forest uppercase tracking-wider">Coupons & Offers</h3>
                                    </div>

                                    {appliedCoupon ? (
                                        <div className="p-4 bg-success/5 border-2 border-success/20 rounded-2xl group transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-success text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">
                                                        {appliedCoupon.code}
                                                    </span>
                                                    <span className="text-xs font-bold text-success">Applied</span>
                                                </div>
                                                <button
                                                    onClick={() => setAppliedCoupon(null)}
                                                    className="text-text-secondary hover:text-red-500 transition-colors p-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-success font-medium">You saved ₹{discount.toLocaleString('en-IN')} with this coupon!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1 group">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Promo Code"
                                                        value={formData.couponCode}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                                                        className="w-full px-4 py-3 bg-white border-2 border-border-soft rounded-xl focus:outline-none focus:border-gold transition-all text-xs font-bold placeholder:font-medium uppercase tracking-widest"
                                                    />
                                                    <div className="absolute inset-y-0 right-3 flex items-center text-gold/30 group-focus-within:text-gold transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleApplyCoupon(formData.couponCode)}
                                                    disabled={applyingCoupon || !formData.couponCode}
                                                    className="px-6 py-3 bg-brand-forest text-white font-bold rounded-xl hover:bg-brand-main transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-green-sm text-xs uppercase tracking-widest"
                                                >
                                                    {applyingCoupon ? '...' : 'Apply'}
                                                </button>
                                            </div>

                                            {couponFeedback && (
                                                <div className={`p-3 rounded-xl text-[10px] font-bold flex items-start gap-2 border animate-fadeIn ${couponFeedback.type === 'success' ? 'bg-success/5 text-success border-success/20' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                    <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {couponFeedback.message}
                                                </div>
                                            )}

                                            {/* Available Coupons Shortcut */}
                                            {availableCoupons.length > 0 && !showCouponSuggestions && (
                                                <button
                                                    onClick={() => setShowCouponSuggestions(true)}
                                                    className="w-full py-3 bg-brand-light border border-brand-main/10 rounded-xl text-[10px] font-black text-brand-forest uppercase tracking-widest hover:bg-beige transition-all"
                                                >
                                                    View Available Offers ({availableCoupons.length})
                                                </button>
                                            )}

                                            {showCouponSuggestions && availableCoupons.length > 0 && (
                                                <div className="space-y-3 pt-2 border-t border-dashed border-border-soft mt-4">
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center justify-between">
                                                        Best Offers for You
                                                        <button onClick={() => setShowCouponSuggestions(false)} className="text-gold hover:underline">Hide</button>
                                                    </p>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {availableCoupons.map((coupon) => (
                                                            <button
                                                                key={coupon.id}
                                                                onClick={() => handleApplyCoupon(normalizeCouponCode(coupon.code), coupon)}
                                                                className="flex items-center justify-between p-4 bg-white border-2 border-border-soft rounded-2xl hover:border-gold hover:shadow-md transition-all group text-left"
                                                            >
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono font-black text-sm text-brand-forest group-hover:text-gold transition-colors">{normalizeCouponCode(coupon.code)}</span>
                                                                        <div className="h-4 w-px bg-border-soft" />
                                                                        <span className="text-xs font-bold text-success uppercase tracking-widest">
                                                                            {coupon.type === 'percentage' ? `${coupon.value}% Off` : `₹${coupon.value} Off`}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-text-secondary font-medium">Save ₹{calculateCouponDiscount(coupon as CouponData, subtotal).toLocaleString('en-IN')} on this order</p>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Trust Badges - Moved inside sticky card */}
                                <div className="mt-8 pt-6 border-t border-brand-main/10">
                                    <div className="grid grid-cols-2 gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-700">
                                        <div className="p-4 bg-white/40 border border-white/50 rounded-2xl text-center">
                                            <div className="text-2xl mb-1">🌿</div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-forest">100% Organic</p>
                                        </div>
                                        <div className="p-4 bg-white/40 border border-white/50 rounded-2xl text-center">
                                            <div className="text-2xl mb-1">🛡️</div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-forest">Secure Payment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <AlertModal
                isOpen={alertModal.isOpen}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                type="info"
            />
        </>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT - Wraps CheckoutContent with Suspense
// ============================================================================
export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-white">

            <Suspense fallback={
                <div className="pt-[calc(var(--header-height,80px)+1rem)] sm:pt-[calc(var(--header-height,80px)+2rem)] pb-8 md:pb-12">
                    <div className="container mx-auto px-4 sm:px-8 lg:px-10 max-w-7xl">
                        <div className="animate-pulse">
                            <div className="h-10 sm:h-12 bg-gray-200 rounded w-1/3 mb-6 sm:mb-8"></div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="h-64 bg-gray-200 rounded-xl"></div>
                                    <div className="h-48 bg-gray-200 rounded-xl"></div>
                                </div>
                                <div className="h-96 bg-gray-200 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            }>
                <CheckoutContent />
            </Suspense>

        </div>
    );
}
