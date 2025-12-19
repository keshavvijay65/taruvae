'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AlertModal from '@/components/AlertModal';
import { subscribeToOrders, updateOrderStatusInFirebase, getAllOrdersFromFirebase, Order } from '@/lib/firebaseOrders';

// Order interface is now imported from firebaseOrders

export default function AdminOrdersPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    useEffect(() => {
        const auth = localStorage.getItem('admin-authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
<<<<<<< HEAD
            // Load orders and set loading to false after completion
            loadOrders().finally(() => {
                setLoading(false);
            });
=======
            loadOrders();
>>>>>>> 5abc3959ee9218e068f1213a5e8b009a02a962d3
            // Subscribe to real-time updates
            const unsubscribe = subscribeToOrders((firebaseOrders) => {
                console.log('Real-time orders update:', firebaseOrders.length);
                const ordersWithDefaults = (firebaseOrders || []).map(order => ({
                    ...order,
                    status: order.status || 'confirmed',
                    trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                }));
                ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                setOrders(ordersWithDefaults);
            });
            return () => {
                if (unsubscribe) unsubscribe();
            };
        } else {
            router.push('/admin/login');
<<<<<<< HEAD
            setLoading(false);
        }
    }, [router]);

    const loadOrders = async () => {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.warn('Order loading timeout, using localStorage only');
            try {
                const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                const ordersWithDefaults = (localOrders || []).map(order => ({
                    ...order,
                    status: order.status || 'confirmed',
                    trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                }));
                ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                setOrders(ordersWithDefaults);
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
                setOrders([]);
            }
        }, 5000); // 5 second timeout

        try {
            // Load from Firebase first
            const firebaseOrders = await getAllOrdersFromFirebase();
            clearTimeout(timeoutId);
=======
        }
        setLoading(false);
    }, [router]);

    const loadOrders = async () => {
        try {
            // Load from Firebase first
            const firebaseOrders = await getAllOrdersFromFirebase();
>>>>>>> 5abc3959ee9218e068f1213a5e8b009a02a962d3
            console.log('Loaded orders from Firebase:', firebaseOrders?.length || 0);
            const ordersWithDefaults = (firebaseOrders || []).map(order => ({
                ...order,
                status: order.status || 'confirmed',
                trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
            }));
            ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
            setOrders(ordersWithDefaults);
        } catch (error) {
<<<<<<< HEAD
            clearTimeout(timeoutId);
=======
>>>>>>> 5abc3959ee9218e068f1213a5e8b009a02a962d3
            console.error('Error loading orders from Firebase:', error);
            // Fallback to localStorage
            try {
                const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                console.log('Loaded orders from localStorage:', localOrders.length);
                const ordersWithDefaults = (localOrders || []).map(order => ({
                    ...order,
                    status: order.status || 'confirmed',
                    trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                }));
                ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                setOrders(ordersWithDefaults);
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
                setOrders([]);
            }
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const result = await updateOrderStatusInFirebase(orderId, newStatus);
            if (result.success) {
                setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Order status updated successfully!',
                    type: 'success',
                });
                // Real-time listener will automatically update the UI
            } else {
                setAlertModal({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to update order status: ${result.message}`,
                    type: 'error',
                });
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to update order status. Please try again.',
                type: 'error',
            });
        }
    };

    const filteredOrders = filterStatus === 'all' 
        ? orders 
        : orders.filter(order => order.status === filterStatus);

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center gap-2 text-[#2D5016] hover:text-[#D4AF37] mb-4 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Orders Management
                            </h1>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Orders</h3>
                            <p className="text-3xl font-bold text-[#2D5016]">{totalOrders}</p>
                        </div>
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Revenue</h3>
                            <p className="text-3xl font-bold text-[#D4AF37]">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">Pending Orders</h3>
                            <p className="text-3xl font-bold text-orange-600">
                                {orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length}
                            </p>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="mb-6">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                        >
                            <option value="all">All Orders</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-6">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-600">No orders found.</p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div
                                    key={order.orderId}
                                    className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-gray-200">
                                        <div>
                                            <h3 className="text-lg font-bold text-black mb-1">Order ID: {order.orderId}</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            {order.trackingNumber && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Tracking: <span className="font-semibold text-[#2D5016]">{order.trackingNumber}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 md:mt-0 flex items-center gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                                <select
                                                    value={order.status || 'confirmed'}
                                                    onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                                >
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="out_for_delivery">Out for Delivery</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                            <div>
                                                <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                                                    ₹{order.total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <h4 className="font-semibold text-black mb-2">Customer</h4>
                                            <p className="text-sm text-gray-600">
                                                {order.customer.firstName} {order.customer.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600">{order.customer.email}</p>
                                            <p className="text-sm text-gray-600">{order.customer.phone}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-black mb-2">Shipping Address</h4>
                                            <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
                                            <p className="text-sm text-gray-600">
                                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold text-black mb-3">Order Items ({order.items.length})</h4>
                                        <div className="space-y-2">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                    <div>
                                                        <p className="font-medium text-black">{item.name}</p>
                                                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                                                    </div>
                                                    <p className="font-semibold text-[#D4AF37]">₹{item.total}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            <p>Subtotal: ₹{order.subtotal}</p>
                                            <p>Shipping: {order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</p>
                                            <p className="font-semibold text-black mt-1">
                                                Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                                            className="px-4 py-2 bg-[#2D5016] text-white rounded-lg text-sm font-semibold hover:bg-[#4A7C2A] transition-colors"
                                        >
                                            {selectedOrder?.orderId === order.orderId ? 'Hide Details' : 'View Full Details'}
                                        </button>
                                    </div>

                                    {selectedOrder?.orderId === order.orderId && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-black mb-3">Complete Order Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="font-semibold text-gray-700">Order ID:</p>
                                                    <p className="text-gray-600">{order.orderId}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700">Order Date:</p>
                                                    <p className="text-gray-600">
                                                        {new Date(order.orderDate).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700">Customer Name:</p>
                                                    <p className="text-gray-600">
                                                        {order.customer.firstName} {order.customer.lastName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700">Email:</p>
                                                    <p className="text-gray-600">{order.customer.email}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700">Phone:</p>
                                                    <p className="text-gray-600">{order.customer.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-700">Payment Method:</p>
                                                    <p className="text-gray-600">
                                                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                                    </p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="font-semibold text-gray-700">Shipping Address:</p>
                                                    <p className="text-gray-600">{order.shippingAddress.address}</p>
                                                    <p className="text-gray-600">
                                                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
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

            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}


