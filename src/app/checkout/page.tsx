'use client';

import { useState, useEffect, Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Prepare order data
            const orderData = {
                orderId: `ORD-${Date.now()}`,
                userId: user?.id || user?.email || undefined, // Link order to user
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
                    alert(`Order placed successfully!\nOrder ID: ${orderData.orderId}\nTotal: ₹${total}\n\nOrder has been saved to Firebase.`);
                    clearCart();
                    router.push('/');
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

                alert(`Order placed successfully!\nOrder ID: ${orderData.orderId}\nTotal: ₹${total}\n\nNote: Order saved locally.`);
                clearCart();
                router.push('/');
            }
        }
    };

    const shipping = getTotalPrice() >= 500 ? 0 : 50;
    const total = getTotalPrice() + shipping;

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
            <div className="py-8 md:py-12">
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
                                        <h2 className="text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                            Saved Addresses
                                        </h2>
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
                                    <div className="space-y-2 sm:space-y-3">
                                        <label className="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#2D5016] transition-colors">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="ml-2 sm:ml-3 font-semibold text-sm sm:text-base">Cash on Delivery (COD)</span>
                                        </label>
                                        <label className="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#2D5016] transition-colors">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="online"
                                                checked={formData.paymentMethod === 'online'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="ml-2 sm:ml-3 font-semibold text-sm sm:text-base">Online Payment (UPI/Card)</span>
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
                                                {item.image && item.image.trim() !== '' ? (
                                                    item.image.startsWith('http') ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={64}
                                                            height={64}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )
                                                ) : (
                                                    <Image
                                                        src="/images/all/products image available soon.png"
                                                        alt={item.name}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-contain p-1"
                                                    />
                                                )}
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
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}

