'use client';

import { useState, useEffect, Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function CheckoutPage() {
    const { cart, getTotalPrice, getTotalItems, clearCart } = useCart();
    const { user } = useAuth();
    const { addresses, getDefaultAddress, addAddress } = useUserProfile();
    const router = useRouter();

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
        upiId: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [upiModalData, setUpiModalData] = useState<{ appName: string; placeholder: string; example: string } | null>(null);
    const [tempUpiId, setTempUpiId] = useState('');
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Merchant UPI ID - Replace with your actual merchant UPI ID
    // IMPORTANT: Change this to your actual business UPI ID where you want to receive payments
    const MERCHANT_UPI_ID = 'keshavvijay1723-1@okicici'; // ⚠️ Change this to your actual merchant UPI ID (e.g., yourbusiness@paytm, yourbusiness@ybl, etc.)
    const MERCHANT_NAME = 'Taruvaé Naturals';

    // Calculate total amount
    const shipping = getTotalPrice() >= 500 ? 0 : 50;
    const total = getTotalPrice() + shipping;

    // Function to generate UPI deep link
    const generateUpiDeepLink = (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim', amount: number) => {
        const encodedMerchantName = encodeURIComponent(MERCHANT_NAME);
        const transactionId = `TXN${Date.now()}`;
        const amountStr = amount.toFixed(2);

        // UPI deep link format: upi://pay?pa=<UPI_ID>&pn=<Name>&am=<Amount>&cu=INR&tn=<TransactionNote>&tr=<TransactionRef>
        // Required Parameters:
        // pa = Payee Address (Merchant UPI ID)
        // pn = Payee Name (Merchant Name)
        // am = Amount
        // cu = Currency (INR)
        // tn = Transaction Note
        // tr = Transaction Reference ID

        // Optional Parameters (uncomment if needed):
        // url = Redirect URL after payment (optional)
        // mc = Merchant Category Code (optional, e.g., '5411' for Groceries, '5999' for General)

        const upiParams = `pa=${MERCHANT_UPI_ID}&pn=${encodedMerchantName}&am=${amountStr}&cu=INR&tn=Order Payment&tr=${transactionId}`;

        // If you want to add optional parameters, uncomment below:
        // const websiteUrl = encodeURIComponent('https://yourwebsite.com'); // Your website URL
        // const merchantCode = '5999'; // Merchant category code (optional)
        // const upiParams = `pa=${MERCHANT_UPI_ID}&pn=${encodedMerchantName}&am=${amountStr}&cu=INR&tn=Order Payment&tr=${transactionId}&url=${websiteUrl}&mc=${merchantCode}`;

        switch (app) {
            case 'phonepe':
                // PhonePe supports both phonepe:// and upi://
                return `phonepe://pay?${upiParams}`;
            case 'gpay':
                // Google Pay uses tez:// or upi://
                return `tez://pay?${upiParams}`;
            case 'paytm':
                // Paytm uses paytmmp:// or upi://
                return `paytmmp://pay?${upiParams}`;
            case 'bhim':
                // BHIM UPI uses standard upi://
                return `upi://pay?${upiParams}`;
            default:
                // Fallback to standard UPI link
                return `upi://pay?${upiParams}`;
        }
    };

    // Function to handle UPI payment
    const handleUpiPayment = async (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim') => {
        // First validate form
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() ||
            !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() ||
            !formData.state.trim() || !formData.pincode.trim()) {
            setAlertModal({
                isOpen: true,
                title: 'Validation Error',
                message: 'Please fill all required fields before proceeding to payment.',
                type: 'warning',
            });
            return;
        }

        // Validate shipping address
        const shipping = getTotalPrice() >= 500 ? 0 : 50;
        const total = getTotalPrice() + shipping;

        if (total <= 0) {
            setAlertModal({
                isOpen: true,
                title: 'Empty Cart',
                message: 'Your cart is empty. Please add items to cart.',
                type: 'warning',
            });
            return;
        }

        // Generate deep link
        const deepLink = generateUpiDeepLink(app, total);

        // Store payment info for verification when user returns
        sessionStorage.setItem('pending-upi-payment', JSON.stringify({
            app,
            total,
            timestamp: Date.now(),
        }));

        // Directly open UPI app for payment (like Amazon/Flipkart)
        // Try multiple methods to open the UPI app
        const openUpiApp = () => {
            try {
                // Method 1: Try window.open first (works better for deep links)
                const newWindow = window.open(deepLink, '_blank');

                // If window.open fails, try window.location
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    // Fallback: Use window.location
                    window.location.href = deepLink;
                }
            } catch (error) {
                // Fallback: Create a temporary anchor and click it
                try {
                    const link = document.createElement('a');
                    link.href = deepLink;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {
                    console.error('Error opening UPI app:', e);
                    setAlertModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Unable to open UPI app. Please make sure the app is installed on your device, or try using the UPI ID field below.',
                        type: 'error',
                    });
                    sessionStorage.removeItem('pending-upi-payment');
                    return;
                }
            }

            // After user returns from UPI app, show payment verification
            // This will be triggered when page regains focus
            const handleFocus = () => {
                setTimeout(() => {
                    const pendingPayment = sessionStorage.getItem('pending-upi-payment');
                    if (pendingPayment) {
                        const paymentData = JSON.parse(pendingPayment);
                        // Check if payment was initiated recently (within 5 minutes)
                        if (Date.now() - paymentData.timestamp < 5 * 60 * 1000) {
                            setConfirmModal({
                                isOpen: true,
                                title: 'Payment Verification',
                                message: `Did you complete the payment of ₹${paymentData.total}?\n\nIf yes, your order will be placed. If no, you can try again.`,
                                onConfirm: () => {
                                    handleOrderPlacement('upi', '');
                                    sessionStorage.removeItem('pending-upi-payment');
                                    setConfirmModal({ ...confirmModal, isOpen: false });
                                    window.removeEventListener('focus', handleFocus);
                                },
                            });
                        } else {
                            sessionStorage.removeItem('pending-upi-payment');
                        }
                    }
                    window.removeEventListener('focus', handleFocus);
                }, 1000);
            };

            // Listen for when user returns to the page
            window.addEventListener('focus', handleFocus);

            // Also listen for visibility change (when tab becomes visible)
            const handleVisibilityChange = () => {
                if (!document.hidden) {
                    handleFocus();
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
        };

        // Open UPI app
        openUpiApp();
    };

    // Function to handle order placement (extracted from handleSubmit)
    const handleOrderPlacement = async (paymentMethod: string, upiId: string) => {
        const shipping = getTotalPrice() >= 500 ? 0 : 50;
        const total = getTotalPrice() + shipping;

        const orderData: any = {
            orderId: `ORD-${Date.now()}`,
            ...(user?.id && { userId: user.id }),
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
            paymentMethod: paymentMethod,
            ...(paymentMethod === 'upi' && upiId && { upiId: upiId }),
            subtotal: getTotalPrice(),
            shipping: shipping,
            total: total,
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            trackingNumber: `TRK${Date.now()}`,
            statusHistory: [
                {
                    status: 'confirmed',
                    date: new Date().toISOString(),
                    message: 'Order confirmed and payment received',
                },
            ],
        };

        try {
            const { saveOrderToFirebase } = await import('@/lib/firebaseOrders');
            const result = await saveOrderToFirebase(orderData);

            if (result.success) {
                setAlertModal({
                    isOpen: true,
                    title: 'Order Placed Successfully!',
                    message: `Order ID: ${orderData.orderId}\nTotal: ₹${total}\n\nOrder has been saved.`,
                    type: 'success',
                });
                clearCart();
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to store order');
            }
        } catch (error) {
            console.error('Error storing order:', error);
            const existingOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
            existingOrders.push(orderData);
            localStorage.setItem('taruvae-orders', JSON.stringify(existingOrders));
            setAlertModal({
                isOpen: true,
                title: 'Order Placed Successfully!',
                message: `Order ID: ${orderData.orderId}\nTotal: ₹${total}\n\nNote: Order saved locally.`,
                type: 'success',
            });
            clearCart();
            setTimeout(() => {
                router.push('/');
            }, 2000);
        }
    };

    // Prefill form - for logged in users and guests (using email/phone from previous orders)
    useEffect(() => {
        // Check if form is already filled
        const isFormFilled = formData.firstName || formData.address || formData.city;
        if (isFormFilled) return; // Don't overwrite if user has already filled

        if (user) {
            // Logged in user - use saved addresses
            const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;

            if (defaultAddress) {
                setFormData(prev => ({
                    firstName: defaultAddress.firstName || '',
                    lastName: defaultAddress.lastName || '',
                    email: defaultAddress.email || user.email || '',
                    phone: defaultAddress.phone || user.phone || '',
                    address: defaultAddress.address || '',
                    city: defaultAddress.city || '',
                    state: defaultAddress.state || '',
                    pincode: defaultAddress.pincode || '',
                    paymentMethod: prev.paymentMethod || 'cod',
                    upiId: prev.upiId || '',
                }));
            } else {
                // Fill basic info from user account
                const nameParts = user.name ? user.name.split(' ') : [];
                setFormData(prev => ({
                    ...prev,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    email: user.email || prev.email || '',
                    phone: user.phone || prev.phone || '',
                }));
            }
        } else {
            // Guest user - check for previous guest addresses
            // This will be filled when user enters email/phone
        }
    }, [user?.id, user?.email, user?.phone, addresses.length]); // Depend on user ID, email, phone, and addresses count

    // Auto-fill for guests when they enter email or phone
    useEffect(() => {
        if (!user && (formData.email || formData.phone)) {
            const guestKey = formData.email.toLowerCase() || formData.phone;
            const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
            const savedAddresses = guestAddresses[guestKey] || [];

            if (savedAddresses.length > 0 && !formData.address) {
                // Use the most recent or default address
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
        }
    }, [formData.email, formData.phone, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
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

        // Validate UPI ID if UPI payment is selected
        if (formData.paymentMethod === 'upi') {
            if (!formData.upiId.trim()) {
                newErrors.upiId = 'UPI ID is required';
            } else if (!/^[\w.-]+@[\w]+$/.test(formData.upiId.trim())) {
                newErrors.upiId = 'Invalid UPI ID format (e.g., yourname@paytm)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const shippingCost = getTotalPrice() >= 500 ? 0 : 50;
            const totalCost = getTotalPrice() + shippingCost;

            // Prepare order data
            const orderData: any = {
                orderId: `ORD-${Date.now()}`,
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
                paymentMethod: formData.paymentMethod,
                subtotal: getTotalPrice(),
                shipping: shippingCost,
                total: totalCost,
                orderDate: new Date().toISOString(),
                status: 'confirmed',
                trackingNumber: `TRK${Date.now()}`,
                statusHistory: [
                    {
                        status: 'confirmed',
                        date: new Date().toISOString(),
                        message: 'Order confirmed and payment received',
                    },
                ],
            };

            // Only add userId if it exists (Firebase doesn't allow undefined)
            if (user?.id || user?.email) {
                orderData.userId = user.id || user.email;
            }

            // Add UPI ID if UPI payment method is selected
            if (formData.paymentMethod === 'upi' && formData.upiId) {
                orderData.upiId = formData.upiId.trim();
            }

            // Save address for both logged in users and guests (using email/phone as identifier)
            try {
                if (user) {
                    // Save to user profile if logged in
                    await addAddress({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        email: formData.email,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        isDefault: addresses.length === 0, // Make first address default
                    });
                } else {
                    // Save guest address using email/phone as identifier
                    const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                    const guestKey = formData.email.toLowerCase() || formData.phone;

                    if (guestKey) {
                        if (!guestAddresses[guestKey]) {
                            guestAddresses[guestKey] = [];
                        }

                        const newAddress = {
                            id: `guest-addr-${Date.now()}`,
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            phone: formData.phone,
                            email: formData.email,
                            address: formData.address,
                            city: formData.city,
                            state: formData.state,
                            pincode: formData.pincode,
                            isDefault: guestAddresses[guestKey].length === 0,
                            createdAt: new Date().toISOString(),
                        };

                        guestAddresses[guestKey].push(newAddress);
                        localStorage.setItem('taruvae-guest-addresses', JSON.stringify(guestAddresses));
                    }
                }
            } catch (error) {
                console.error('Error saving address:', error);
            }

            try {
                // Store order in Firebase
                const { saveOrderToFirebase } = await import('@/lib/firebaseOrders');
                const result = await saveOrderToFirebase(orderData);

                if (result.success) {
                    console.log('Order stored successfully:', result);
                    console.log('Order data:', {
                        orderId: orderData.orderId,
                        customer: orderData.customer,
                        total: orderData.total
                    });
                    setAlertModal({
                        isOpen: true,
                        title: 'Order Placed Successfully!',
                        message: `Order ID: ${orderData.orderId}\nTotal: ₹${totalCost}\n\nOrder has been saved to Firebase.`,
                        type: 'success',
                    });
                    clearCart();
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                } else {
                    throw new Error(result.message || 'Failed to store order');
                }
            } catch (error) {
                console.error('Error storing order:', error);
                // Fallback: Store in localStorage only
                const existingOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                existingOrders.push(orderData);
                localStorage.setItem('taruvae-orders', JSON.stringify(existingOrders));

                console.log('Order saved to localStorage:', {
                    orderId: orderData.orderId,
                    customer: orderData.customer,
                    totalOrders: existingOrders.length
                });

                setAlertModal({
                    isOpen: true,
                    title: 'Order Placed Successfully!',
                    message: `Order ID: ${orderData.orderId}\nTotal: ₹${totalCost}\n\nNote: Order saved locally.`,
                    type: 'success',
                });
                clearCart();
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            }
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-black mb-4">Your cart is empty</h2>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                        >
                            Continue Shopping
                        </button>
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
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-8" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        Checkout
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                {/* Saved Addresses - For logged in users */}
                                {user && addresses.length > 0 && (
                                    <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                                            <h2 className="text-lg sm:text-xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                                Saved Addresses
                                            </h2>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3">
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
                                                    className={`w-full text-left p-3 sm:p-4 border-2 rounded-lg transition-all ${addr.isDefault
                                                        ? 'border-[#D4AF37] bg-[#FFF8E7]'
                                                        : 'border-gray-200 hover:border-[#2D5016]'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            {addr.isDefault && (
                                                                <span className="inline-block px-2 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded mb-2">
                                                                    Default
                                                                </span>
                                                            )}
                                                            <p className="font-semibold text-black text-sm sm:text-base">{addr.firstName} {addr.lastName}</p>
                                                            <p className="text-xs sm:text-sm text-gray-600">{addr.address}</p>
                                                            <p className="text-xs sm:text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                            <p className="text-xs sm:text-sm text-gray-600">{addr.phone}</p>
                                                        </div>
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
                                            className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white font-bold rounded-lg hover:from-[#4A7C2A] hover:to-[#2D5016] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add New Address
                                        </button>
                                    </div>
                                )}

                                {/* Guest Saved Addresses - Show if not logged in but has previous addresses */}
                                {!user && (() => {
                                    const guestKey = formData.email?.toLowerCase() || formData.phone;
                                    if (!guestKey) return null;
                                    const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                                    const savedAddresses = guestAddresses[guestKey] || [];
                                    if (savedAddresses.length === 0) return null;

                                    return (
                                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                                            <h2 className="text-xl font-bold text-black mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                                Your Previous Addresses
                                            </h2>
                                            <div className="space-y-3">
                                                {savedAddresses.map((addr: any) => (
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
                                                        className={`w-full text-left p-4 border-2 rounded-lg transition-all ${addr.isDefault
                                                            ? 'border-[#D4AF37] bg-[#FFF8E7]'
                                                            : 'border-gray-200 hover:border-[#2D5016]'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                {addr.isDefault && (
                                                                    <span className="inline-block px-2 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded mb-2">
                                                                        Default
                                                                    </span>
                                                                )}
                                                                <p className="font-semibold text-black">{addr.firstName} {addr.lastName}</p>
                                                                <p className="text-sm text-gray-600">{addr.address}</p>
                                                                <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                                <p className="text-sm text-gray-600">{addr.phone}</p>
                                                            </div>
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
                                                className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white font-bold rounded-lg hover:from-[#4A7C2A] hover:to-[#2D5016] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add New Address
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* Personal Information */}
                                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                                        <h2 className="text-lg sm:text-xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                            {user && addresses.length > 0 ? 'Or Enter New Address' : (!user && formData.email ? 'Or Enter New Address' : 'Personal Information')}
                                        </h2>
                                        {user && (
                                            <span className="text-xs px-2 sm:px-3 py-1 bg-green-50 text-green-700 rounded-full font-semibold whitespace-nowrap">
                                                ✓ Auto-filled from your account
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] text-sm sm:text-base ${errors.firstName ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] text-sm sm:text-base ${errors.lastName ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email <span className="text-red-500">*</span>
                                                {user && formData.email === user.email && (
                                                    <span className="ml-2 text-xs text-green-600 font-normal">(from your account)</span>
                                                )}
                                                {!user && formData.email && (() => {
                                                    const guestKey = formData.email.toLowerCase();
                                                    const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                                                    const hasSavedAddress = guestAddresses[guestKey] && guestAddresses[guestKey].length > 0;
                                                    return hasSavedAddress ? (
                                                        <span className="ml-2 text-xs text-blue-600 font-normal">(previous address found)</span>
                                                    ) : null;
                                                })()}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={(e) => {
                                                        handleInputChange(e);
                                                        // Auto-fill guest address when email is entered
                                                        if (!user && e.target.value) {
                                                            const guestKey = e.target.value.toLowerCase();
                                                            const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                                                            const savedAddresses = guestAddresses[guestKey] || [];

                                                            if (savedAddresses.length > 0 && !formData.address) {
                                                                const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault) || savedAddresses[savedAddresses.length - 1];
                                                                if (defaultAddress) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        firstName: prev.firstName || defaultAddress.firstName || '',
                                                                        lastName: prev.lastName || defaultAddress.lastName || '',
                                                                        phone: prev.phone || defaultAddress.phone || '',
                                                                        address: prev.address || defaultAddress.address || '',
                                                                        city: prev.city || defaultAddress.city || '',
                                                                        state: prev.state || defaultAddress.state || '',
                                                                        pincode: prev.pincode || defaultAddress.pincode || '',
                                                                    }));
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className={`w-full px-4 py-3 pr-24 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${errors.email ? 'border-red-500' : user && formData.email === user.email ? 'border-green-300 bg-green-50' : 'border-gray-200'
                                                        }`}
                                                    placeholder={user ? user.email : "Enter your email"}
                                                />
                                                {user && formData.email !== user.email && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, email: user.email || '' }));
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-[#2D5016] text-white rounded hover:bg-[#4A7C2A] transition-colors"
                                                    >
                                                        Use My Email
                                                    </button>
                                                )}
                                            </div>
                                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone Number <span className="text-red-500">*</span>
                                                {!user && formData.phone && (() => {
                                                    const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                                                    const hasSavedAddress = guestAddresses[formData.phone] && guestAddresses[formData.phone].length > 0;
                                                    return hasSavedAddress ? (
                                                        <span className="ml-2 text-xs text-blue-600 font-normal">(previous address found)</span>
                                                    ) : null;
                                                })()}
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const phoneValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    setFormData(prev => ({ ...prev, phone: phoneValue }));

                                                    // Auto-fill guest address when phone is entered
                                                    if (!user && phoneValue.length === 10 && !formData.email) {
                                                        const guestAddresses = JSON.parse(localStorage.getItem('taruvae-guest-addresses') || '{}');
                                                        const savedAddresses = guestAddresses[phoneValue] || [];

                                                        if (savedAddresses.length > 0 && !formData.address) {
                                                            const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault) || savedAddresses[savedAddresses.length - 1];
                                                            if (defaultAddress) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    firstName: prev.firstName || defaultAddress.firstName || '',
                                                                    lastName: prev.lastName || defaultAddress.lastName || '',
                                                                    email: prev.email || defaultAddress.email || '',
                                                                    phone: phoneValue,
                                                                    address: prev.address || defaultAddress.address || '',
                                                                    city: prev.city || defaultAddress.city || '',
                                                                    state: prev.state || defaultAddress.state || '',
                                                                    pincode: prev.pincode || defaultAddress.pincode || '',
                                                                }));
                                                            }
                                                        }
                                                    }

                                                    // Clear error
                                                    if (errors.phone) {
                                                        setErrors(prev => ({ ...prev, phone: '' }));
                                                    }
                                                }}
                                                maxLength={10}
                                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${errors.phone ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                                    <h2 className="text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        Shipping Address
                                    </h2>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                Address <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] text-sm sm:text-base ${errors.address ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    City <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${errors.city ? 'border-red-500' : 'border-gray-200'
                                                        }`}
                                                />
                                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    State <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${errors.state ? 'border-red-500' : 'border-gray-200'
                                                        }`}
                                                />
                                                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Pincode <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    maxLength={6}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${errors.pincode ? 'border-red-500' : 'border-gray-200'
                                                        }`}
                                                />
                                                {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                                    <h2 className="text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        Payment Method
                                    </h2>
                                    <div className="space-y-3 sm:space-y-4">
                                        {/* Cash on Delivery */}
                                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-[#2D5016] bg-[#F5F1EB] shadow-md' : 'border-gray-200 hover:border-[#2D5016]'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <div className="ml-3 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    💵
                                                </div>
                                                <div>
                                                    <span className="font-bold text-base">Cash on Delivery (COD)</span>
                                                    <p className="text-xs text-gray-600 mt-0.5">Pay when you receive</p>
                                                </div>
                                            </div>
                                        </label>

                                        {/* UPI Payment */}
                                        <div>
                                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'upi' ? 'border-[#2D5016] bg-[#F5F1EB] shadow-md' : 'border-gray-200 hover:border-[#2D5016]'}`}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="upi"
                                                    checked={formData.paymentMethod === 'upi'}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                                />
                                                <div className="ml-3 flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#2D5016] to-[#4A7C2A] rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                                        UPI
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="font-bold text-base">UPI Payment</span>
                                                        <p className="text-xs text-gray-600 mt-0.5">PhonePe, Google Pay, Paytm, BHIM UPI</p>
                                                    </div>
                                                </div>
                                            </label>
                                            {formData.paymentMethod === 'upi' && (
                                                <div className="mt-4 ml-12 p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-[#2D5016]/20 shadow-lg">
                                                    {/* Payment Info */}
                                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div className="text-xs text-blue-800">
                                                                <p className="font-semibold mb-1">Payment Information:</p>
                                                                <p>• Payment will be sent to: <span className="font-bold">{MERCHANT_UPI_ID}</span></p>
                                                                <p>• Click any UPI app button below to open the app directly</p>
                                                                <p>• Amount ₹{total} will be pre-filled in the UPI app</p>
                                                                <p className="mt-1 text-blue-600">💡 Works on mobile devices with UPI apps installed</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <label className="block text-sm font-bold text-gray-800 mb-3">
                                                        Your UPI ID (Optional) <span className="text-gray-500 text-xs font-normal">(for order tracking)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="upiId"
                                                        value={formData.upiId}
                                                        onChange={handleInputChange}
                                                        placeholder="yourname@paytm / yourname@phonepe / yourname@ybl"
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] text-sm font-medium ${errors.upiId ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
                                                    />
                                                    {errors.upiId && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.upiId}</p>}
                                                    <div className="mt-4">
                                                        <p className="text-xs text-gray-700 mb-3 font-semibold uppercase tracking-wide">Click to Pay via UPI App:</p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpiPayment('phonepe')}
                                                                className="flex flex-col items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#5B21B6] hover:bg-purple-50 transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-95"
                                                            >
                                                                <div className="w-10 h-10 bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-110 transition-transform">
                                                                    📱
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 group-hover:text-[#5B21B6]">PhonePe</span>
                                                                <span className="text-[10px] text-gray-500 font-medium">₹{total}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpiPayment('gpay')}
                                                                className="flex flex-col items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-95"
                                                            >
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-110 transition-transform">
                                                                    💳
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600">Google Pay</span>
                                                                <span className="text-[10px] text-gray-500 font-medium">₹{total}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpiPayment('paytm')}
                                                                className="flex flex-col items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#00BA9D] hover:bg-[#00BA9D]/10 transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-95"
                                                            >
                                                                <div className="w-10 h-10 bg-gradient-to-br from-[#00BA9D] to-[#00D4AA] rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-110 transition-transform">
                                                                    💸
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 group-hover:text-[#00BA9D]">Paytm</span>
                                                                <span className="text-[10px] text-gray-500 font-medium">₹{total}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpiPayment('bhim')}
                                                                className="flex flex-col items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#2D5016] hover:bg-[#F5F1EB] transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-95"
                                                            >
                                                                <div className="w-10 h-10 bg-gradient-to-br from-[#2D5016] to-[#4A7C2A] rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-110 transition-transform">
                                                                    🏦
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 group-hover:text-[#2D5016]">BHIM UPI</span>
                                                                <span className="text-[10px] text-gray-500 font-medium">₹{total}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Payment */}
                                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'card' ? 'border-[#2D5016] bg-[#F5F1EB] shadow-md' : 'border-gray-200 hover:border-[#2D5016]'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <div className="ml-3 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                    💳
                                                </div>
                                                <div>
                                                    <span className="font-bold text-base">Debit/Credit Card</span>
                                                    <p className="text-xs text-gray-600 mt-0.5">Visa, Mastercard, RuPay</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#2D5016] text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-[#4A7C2A] transition-colors"
                                >
                                    Place Order
                                </button>
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#F5F1EB] rounded-xl p-4 sm:p-6 sticky top-20 sm:top-24">
                                <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    Order Summary
                                </h2>

                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-300">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                {(() => {
                                                    const placeholderImage = '/images/all/products image available soon.png';
                                                    let imageSrc = (item.image && item.image.trim() !== '') ? item.image.trim() : placeholderImage;

                                                    // Fix old/wrong image paths
                                                    if (imageSrc === '/images/products/ghee.jpg') {
                                                        imageSrc = '/images/products/GHEE.png';
                                                    }
                                                    if (imageSrc === '/images/products/sunflower-oil.jpg' ||
                                                        imageSrc === '/images/products/coconut-oil.jpg' ||
                                                        imageSrc === '/images/products/olive-oil.jpg') {
                                                        imageSrc = placeholderImage;
                                                    }
                                                    if (imageSrc === '/images/all/IMG-20251019-WA0015.jpg') {
                                                        imageSrc = placeholderImage;
                                                    }

                                                    // For base64 images, use directly
                                                    if (imageSrc.startsWith('data:image/')) {
                                                        return (
                                                            <img
                                                                src={imageSrc}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        );
                                                    }

                                                    // For HTTP URLs, use directly
                                                    if (imageSrc.startsWith('http')) {
                                                        return (
                                                            <img
                                                                src={imageSrc}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = placeholderImage.replace(/ /g, '%20');
                                                                }}
                                                            />
                                                        );
                                                    }

                                                    // For local paths, encode spaces
                                                    const encodedSrc = imageSrc.replace(/ /g, '%20');
                                                    const placeholderEncoded = placeholderImage.replace(/ /g, '%20');

                                                    return (
                                                        <img
                                                            src={encodedSrc}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                if (!e.currentTarget.src.includes('products%20image%20available%20soon')) {
                                                                    e.currentTarget.src = placeholderEncoded;
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-xs sm:text-sm text-black line-clamp-2">{item.name}</h3>
                                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                                <p className="text-xs sm:text-sm font-bold text-[#D4AF37] mt-1">₹{item.price * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                    <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                        <span>Subtotal ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})</span>
                                        <span className="font-semibold">₹{getTotalPrice()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                        <span>Shipping</span>
                                        <span className="font-semibold">
                                            {shipping === 0 ? <span className="text-green-600">Free</span> : `₹${shipping}`}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 sm:pt-3">
                                        <div className="flex justify-between text-lg sm:text-xl font-bold text-black">
                                            <span>Total</span>
                                            <span>₹{total}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium UPI Modal */}
            {showUpiModal && upiModalData && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn border-2 border-gray-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] px-6 py-4 rounded-t-2xl flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Enter {upiModalData.appName} UPI ID
                            </h3>
                            <button
                                onClick={() => {
                                    setShowUpiModal(false);
                                    setTempUpiId('');
                                    setUpiModalData(null);
                                }}
                                className="text-white hover:text-gray-200 transition-colors text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    UPI ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={tempUpiId}
                                    onChange={(e) => setTempUpiId(e.target.value)}
                                    placeholder={upiModalData.placeholder}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016] text-sm font-medium"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (tempUpiId.trim()) {
                                                setFormData(prev => ({ ...prev, upiId: tempUpiId.trim() }));
                                                setShowUpiModal(false);
                                                setTempUpiId('');
                                                setUpiModalData(null);
                                            }
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Example: <span className="font-semibold text-[#2D5016]">{upiModalData.example}</span>
                                </p>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUpiModal(false);
                                        setTempUpiId('');
                                        setUpiModalData(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (tempUpiId.trim()) {
                                            setFormData(prev => ({ ...prev, upiId: tempUpiId.trim() }));
                                            setShowUpiModal(false);
                                            setTempUpiId('');
                                            setUpiModalData(null);
                                        }
                                    }}
                                    disabled={!tempUpiId.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white font-bold rounded-lg hover:from-[#4A7C2A] hover:to-[#2D5016] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModal.isOpen}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                type="info"
            />

            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}

