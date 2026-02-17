'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Order } from '@/types';

type OrderStatus = Order['status'];

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'pending':
            return 'bg-brand-100 text-brand-dark';
        case 'processing':
            return 'bg-brand-200 text-brand-dark';
        case 'shipped':
            return 'bg-brand-200 text-brand-dark';
        case 'out_for_delivery':
            return 'bg-gold/20 text-gold-dark';
        case 'delivered':
            return 'bg-success/10 text-success';
        case 'cancelled':
        case 'failed':
            return 'bg-error/10 text-error';
        default:
            return 'bg-brand-100 text-brand-dark';
    }
};

const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'processing':
            return 'Processing';
        case 'shipped':
            return 'Shipped';
        case 'out_for_delivery':
            return 'Out for Delivery';
        case 'delivered':
            return 'Delivered';
        case 'cancelled':
            return 'Cancelled';
        case 'failed':
            return 'Failed';
        default:
            return 'Pending';
    }
};

const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
        case 'pending':
            return '⏳';
        case 'processing':
            return '⚙️';
        case 'shipped':
            return '📦';
        case 'out_for_delivery':
            return '🚚';
        case 'delivered':
            return '✅';
        case 'cancelled':
        case 'failed':
            return '❌';
        default:
            return '⏳';
    }
};

function OrderTrackingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id') || '';
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const statusesOrder: OrderStatus[] = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

    useEffect(() => {
        if (!orderId) {
            router.push('/orders');
            return;
        }
        loadOrder();
    }, [orderId, router]);

    useEffect(() => {
        if (order) {
            const orderStatus = (order.status || 'pending').toLowerCase();
            if (orderStatus === 'delivered') {
                setShowCelebration(true);
                // Hide celebration after 8 seconds
                const timer = setTimeout(() => {
                    setShowCelebration(false);
                }, 8000);
                return () => clearTimeout(timer);
            }
        }
    }, [order]);

    const loadOrder = () => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        // Try Firebase first
        try {
            const { getOrderByIdFromFirebase } = require('@/lib/firebaseOrders');
            getOrderByIdFromFirebase(orderId).then((foundOrder: Order | null) => {
                if (foundOrder) {
                    setOrderWithDefaults(foundOrder);
                } else {
                    loadFromLocalStorage();
                }
            }).catch(() => {
                loadFromLocalStorage();
            });
        } catch {
            loadFromLocalStorage();
        }
    };

    const loadFromLocalStorage = () => {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        const foundOrder = localOrders.find(o => o.orderId === orderId);

        if (foundOrder) {
            setOrderWithDefaults(foundOrder);
        } else {
            setLoading(false);
        }
    };

    const setOrderWithDefaults = (foundOrder: Order) => {
        const orderWithDefaults: Order = {
            ...foundOrder,
            status: (foundOrder.status as OrderStatus) || 'pending',
            trackingNumber: foundOrder.trackingNumber || `TRK${foundOrder.orderId.replace('ORD-', '')}`,
            statusHistory: foundOrder.statusHistory || [
                {
                    status: 'pending' as OrderStatus,
                    date: foundOrder.orderDate,
                    message: 'Order confirmed and payment received',
                },
            ],
        };
        setOrder(orderWithDefaults);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">

                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl pt-[calc(var(--header-height,80px)+2rem)] pb-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading order details...</p>
                    </div>
                </div>

            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-white">

                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl pt-[calc(var(--header-height,80px)+2rem)] pb-20">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-black mb-4">Order Not Found</h2>
                        <p className="text-gray-600 mb-8">The order you're looking for doesn't exist.</p>
                        <Link
                            href="/orders"
                            className="inline-block bg-brand text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
                        >
                            View All Orders
                        </Link>
                    </div>
                </div>

            </div>
        );
    }

    const status = (order.status || 'pending').toLowerCase() as OrderStatus;
    const statuses: string[] = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIndex = statusesOrder.indexOf(status);
    const isDelivered = status === 'delivered';

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">


            {/* Celebration Animation */}
            {showCelebration && isDelivered && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-2xl transform animate-scaleIn max-w-md mx-4">
                        <div className="text-6xl md:text-8xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">Order Delivered!</h2>
                        <p className="text-gray-600 text-lg">Thank you for shopping with us!</p>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl pt-[calc(var(--header-height,80px)+2rem)] pb-8 md:pb-12">
                {/* Back Button */}
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 text-brand-dark hover:text-gold mb-6 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                </Link>

                {/* Order Header */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-6 md:p-8 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Order Tracking
                            </h1>
                            <p className="text-text-secondary">Order ID: <span className="font-semibold text-brand-dark">{order.orderId}</span></p>
                            {order.trackingNumber && (
                                <p className="text-gray-600">Tracking: <span className="font-semibold text-brand-dark">{order.trackingNumber}</span></p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                                {getStatusIcon(status)} {getStatusLabel(status)}
                            </span>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-black mb-4">Order Status</h3>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                {statusesOrder.map((s, index) => {
                                    const isActive = index <= currentIndex;
                                    const isCurrent = index === currentIndex;

                                    return (
                                        <div key={s} className="flex flex-col items-center flex-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive
                                                ? 'bg-brand border-brand text-white'
                                                : 'bg-white border-border text-text-secondary'
                                                } ${isCurrent ? 'ring-4 ring-brand/20' : ''}`}>
                                                {isActive ? (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-xs font-bold">{index + 1}</span>
                                                )}
                                            </div>
                                            <span className={`text-xs mt-2 text-center ${isActive ? 'text-gold font-semibold' : 'text-text-secondary'}`}>
                                                {getStatusLabel(s)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="relative h-1 bg-gray-200 rounded-full -mt-8 mb-8">
                                <div
                                    className="absolute top-0 left-0 h-full bg-brand rounded-full transition-all duration-500"
                                    style={{ width: `${(currentIndex / (statusesOrder.length - 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status History */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-black mb-3">Status History</h3>
                            <div className="space-y-3">
                                {order.statusHistory.map((history, index) => (
                                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(history.status as OrderStatus).split(' ')[0]}`} />
                                        <div className="flex-1">
                                            <p className="font-medium text-black">{getStatusLabel(history.status as OrderStatus)}</p>
                                            <p className="text-sm text-gray-600">{history.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(history.date).toLocaleString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Order Items */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-black mb-4">Order Items</h3>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-black">{item.name}</p>
                                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                                    </div>
                                    <p className="font-semibold text-gold">₹{item.total.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer & Shipping Info */}
                    <div className="space-y-6">
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-4">Customer Details</h3>
                            <p className="text-gray-700">{order.customer.firstName} {order.customer.lastName}</p>
                            <p className="text-gray-700">{order.customer.email}</p>
                            <p className="text-gray-700">{order.customer.phone}</p>
                        </div>

                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-4">Shipping Address</h3>
                            <p className="text-gray-700">{order.shippingAddress.address}</p>
                            <p className="text-gray-700">
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-black mb-4">Order Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-semibold">₹{order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span className="font-semibold">{order.shipping === 0 ? 'Free' : `₹${order.shipping.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-black pt-3 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-brand-dark">₹{order.totalAmount}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 mt-3">
                            <p className="text-sm text-gray-600">
                                Payment Method: <span className="font-semibold">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Order Date: <span className="font-semibold">
                                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function OrderTrackingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white"><div className="container mx-auto px-6 py-20"><div className="text-center"><p className="text-gray-600">Loading...</p></div></div></div>}>
            <OrderTrackingContent />
        </Suspense>
    );
}


