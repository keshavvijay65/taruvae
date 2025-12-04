'use client';

import { useState, useEffect, Suspense } from 'react';

// Skip static generation (uses Header with useSearchParams)
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';

interface Order {
    orderId: string;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    shippingAddress: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        id: number;
        name: string;
        price: number;
        quantity: number;
        total: number;
    }>;
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    orderDate: string;
    status?: string;
    trackingNumber?: string;
}

export default function AccountPage() {
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuth();
    const { addresses, deleteAddress, setDefaultAddress, addAddress } = useUserProfile();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [addressFormData, setAddressFormData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        phone: user?.phone || '',
        email: user?.email || '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
    });
    const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
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
        onConfirm: () => {},
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadUserOrders();
    }, [isAuthenticated, router]);

    const loadUserOrders = () => {
        if (!user) return;
        
        const allOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        // Filter orders by user ID or email
        const userOrders = allOrders.filter(order => {
            const orderUserId = (order as any).userId;
            return orderUserId === user.id || orderUserId === user.email || 
                   order.customer.email.toLowerCase() === user.email.toLowerCase();
        });
        
        userOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(userOrders);
        setLoading(false);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}>
                    <Header />
                </Suspense>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>
            <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            My Account
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-600 transition-colors whitespace-nowrap"
                        >
                            Logout
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            {user?.photoURL ? (
                                <img 
                                    src={user.photoURL} 
                                    alt={user.name} 
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 sm:border-4 border-[#2D5016]"
                                />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2D5016] flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    {user?.name}
                                </h2>
                                {user?.provider === 'google' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] sm:text-xs font-semibold mt-1">
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Google Account
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Email</p>
                                <p className="text-lg font-semibold text-black">{user?.email}</p>
                            </div>
                            {user?.phone && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                                    <p className="text-lg font-semibold text-black">{user.phone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Member Since</p>
                                <p className="text-lg font-semibold text-black">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }) : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Login Method</p>
                                <p className="text-lg font-semibold text-black capitalize">
                                    {user?.provider === 'google' ? 'Google Sign-In' : 'Email & Password'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Saved Addresses Section */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Saved Addresses ({addresses.length})
                            </h2>
                            <button
                                onClick={() => {
                                    setAddressFormData({
                                        firstName: user?.name?.split(' ')[0] || '',
                                        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                                        phone: user?.phone || '',
                                        email: user?.email || '',
                                        address: '',
                                        city: '',
                                        state: '',
                                        pincode: '',
                                        isDefault: addresses.length === 0,
                                    });
                                    setShowAddAddressForm(!showAddAddressForm);
                                    setAddressErrors({});
                                }}
                                className="px-4 py-2 bg-[#2D5016] text-white rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {showAddAddressForm ? 'Cancel' : 'Add New Address'}
                            </button>
                        </div>

                        {/* Add Address Form */}
                        {showAddAddressForm && (
                            <div className="bg-gray-50 border-2 border-[#2D5016] rounded-lg p-6 mb-6">
                                <h3 className="text-xl font-bold text-black mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    Add New Address
                                </h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setAddressErrors({});
                                    
                                    // Validate
                                    const newErrors: Record<string, string> = {};
                                    if (!addressFormData.firstName.trim()) newErrors.firstName = 'Required';
                                    if (!addressFormData.lastName.trim()) newErrors.lastName = 'Required';
                                    if (!addressFormData.email.trim()) {
                                        newErrors.email = 'Required';
                                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressFormData.email)) {
                                        newErrors.email = 'Invalid email';
                                    }
                                    if (!addressFormData.phone.trim()) {
                                        newErrors.phone = 'Required';
                                    } else if (!/^[0-9]{10}$/.test(addressFormData.phone)) {
                                        newErrors.phone = 'Must be 10 digits';
                                    }
                                    if (!addressFormData.address.trim()) newErrors.address = 'Required';
                                    if (!addressFormData.city.trim()) newErrors.city = 'Required';
                                    if (!addressFormData.state.trim()) newErrors.state = 'Required';
                                    if (!addressFormData.pincode.trim()) {
                                        newErrors.pincode = 'Required';
                                    } else if (!/^[0-9]{6}$/.test(addressFormData.pincode)) {
                                        newErrors.pincode = 'Must be 6 digits';
                                    }
                                    
                                    if (Object.keys(newErrors).length > 0) {
                                        setAddressErrors(newErrors);
                                        return;
                                    }
                                    
                                    const result = await addAddress(addressFormData);
                                    if (result.success) {
                                        setAlertModal({
                                            isOpen: true,
                                            title: 'Success',
                                            message: 'Address added successfully!',
                                            type: 'success',
                                        });
                                        setShowAddAddressForm(false);
                                        setAddressFormData({
                                            firstName: user?.name?.split(' ')[0] || '',
                                            lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                                            phone: user?.phone || '',
                                            email: user?.email || '',
                                            address: '',
                                            city: '',
                                            state: '',
                                            pincode: '',
                                            isDefault: false,
                                        });
                                    } else {
                                        setAlertModal({
                                            isOpen: true,
                                            title: 'Error',
                                            message: result.message || 'Failed to add address',
                                            type: 'error',
                                        });
                                    }
                                }} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressFormData.firstName}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, firstName: e.target.value })}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.firstName && <p className="text-red-500 text-xs mt-1">{addressErrors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressFormData.lastName}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, lastName: e.target.value })}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.lastName && <p className="text-red-500 text-xs mt-1">{addressErrors.lastName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={addressFormData.email}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, email: e.target.value })}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.email ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.email && <p className="text-red-500 text-xs mt-1">{addressErrors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={addressFormData.phone}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                maxLength={10}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.phone && <p className="text-red-500 text-xs mt-1">{addressErrors.phone}</p>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Address <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={addressFormData.address}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                                                rows={2}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.address ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.address && <p className="text-red-500 text-xs mt-1">{addressErrors.address}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressFormData.city}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.city ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.city && <p className="text-red-500 text-xs mt-1">{addressErrors.city}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                State <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressFormData.state}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.state ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.state && <p className="text-red-500 text-xs mt-1">{addressErrors.state}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Pincode <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={addressFormData.pincode}
                                                onChange={(e) => setAddressFormData({ ...addressFormData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                maxLength={6}
                                                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] ${addressErrors.pincode ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {addressErrors.pincode && <p className="text-red-500 text-xs mt-1">{addressErrors.pincode}</p>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={addressFormData.isDefault}
                                                    onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                                                    className="w-4 h-4 text-[#2D5016] focus:ring-[#2D5016]"
                                                />
                                                <span className="text-sm font-semibold text-gray-700">Set as default address</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-[#2D5016] text-white rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                                        >
                                            Save Address
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddAddressForm(false);
                                                setAddressErrors({});
                                            }}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {addresses.length === 0 && !showAddAddressForm ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">No saved addresses yet.</p>
                                <p className="text-sm text-gray-500 mb-4">You can add an address manually or it will be saved automatically when you place an order.</p>
                            </div>
                        ) : addresses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`border-2 rounded-lg p-4 ${
                                            addr.isDefault
                                                ? 'border-[#D4AF37] bg-[#FFF8E7]'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                {addr.isDefault && (
                                                    <span className="inline-block px-2 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded mb-2">
                                                        Default
                                                    </span>
                                                )}
                                                <p className="font-bold text-black">{addr.firstName} {addr.lastName}</p>
                                                <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                                                <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                <p className="text-sm text-gray-600 mt-1">{addr.phone}</p>
                                                <p className="text-sm text-gray-600">{addr.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            {!addr.isDefault && (
                                                <button
                                                    onClick={async () => {
                                                        const result = await setDefaultAddress(addr.id);
                                                        if (result.success) {
                                                            setAlertModal({
                                                                isOpen: true,
                                                                title: 'Success',
                                                                message: 'Default address updated!',
                                                                type: 'success',
                                                            });
                                                        }
                                                    }}
                                                    className="text-xs px-3 py-1 bg-[#2D5016] text-white rounded hover:bg-[#4A7C2A] transition-colors"
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        title: 'Delete Address',
                                                        message: 'Are you sure you want to delete this address?',
                                                        onConfirm: async () => {
                                                            const result = await deleteAddress(addr.id);
                                                            if (result.success) {
                                                                setAlertModal({
                                                                    isOpen: true,
                                                                    title: 'Success',
                                                                    message: 'Address deleted!',
                                                                    type: 'success',
                                                                });
                                                            }
                                                        },
                                                    });
                                                }}
                                                className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Orders Section */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            My Orders ({orders.length})
                        </h2>

                        {orders.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mb-4">
                                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-2">No Orders Yet</h3>
                                <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
                                <Link
                                    href="/products"
                                    className="inline-block bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div
                                        key={order.orderId}
                                        className="border-2 border-gray-100 rounded-lg p-4 hover:border-[#D4AF37] transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-black">Order #{order.orderId}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="mt-2 md:mt-0 flex items-center gap-3">
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                                                    {order.status || 'Confirmed'}
                                                </span>
                                                <span className="text-lg font-bold text-[#2D5016]">₹{order.total}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">
                                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                            </p>
                                            <Link
                                                href={`/orders/track?id=${order.orderId}`}
                                                className="text-[#2D5016] hover:text-[#D4AF37] font-semibold text-sm transition-colors"
                                            >
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                type="danger"
            />

            <Footer />
        </div>
    );
}

