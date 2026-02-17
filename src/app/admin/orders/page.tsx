'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AlertModal from '@/components/AlertModal';
import { subscribeToOrders, updateOrderStatusInFirebase, getAllOrdersFromFirebase } from '@/lib/firebaseOrders';
import { Order } from '@/types';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminWrapper from '@/components/admin/AdminWrapper';
import Invoice from '@/components/Invoice';

// Order interface is now imported from firebaseOrders

export default function AdminOrdersPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
    const [showInvoice, setShowInvoice] = useState<Order | null>(null);
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    useEffect(() => {
        const initializePage = async () => {
            try {
                const auth = localStorage.getItem('admin-authenticated');
                if (auth === 'true') {
                    setIsAuthenticated(true);

                    // STEP 1: Load cached data IMMEDIATELY (no waiting)
                    try {
                        const cachedOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                        if (cachedOrders.length > 0) {
                            const ordersWithDefaults = cachedOrders.map(order => ({
                                ...order,
                                status: order.status || 'pending',
                                trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                            }));
                            ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                            setOrders(ordersWithDefaults);
                            setLoading(false); // Show UI immediately with cached data
                        }
                    } catch (cacheError) {
                        console.warn('Error loading cached orders:', cacheError);
                    }

                    // STEP 2: Fetch fresh data in background (non-blocking)
                    const fetchFreshData = async () => {
                        try {
                            const firebaseOrders = await Promise.race([
                                getAllOrdersFromFirebase(),
                                new Promise<Order[]>((_, reject) =>
                                    setTimeout(() => reject(new Error('Orders load timeout')), 3000)
                                )
                            ]).catch((error) => {
                                console.warn('Firebase load timeout, using cache:', error);
                                return null;
                            });

                            if (firebaseOrders) {
                                const ordersWithDefaults = firebaseOrders.map(order => ({
                                    ...order,
                                    status: order.status || 'pending',
                                    trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                                }));
                                ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                                setOrders(ordersWithDefaults);
                            }
                        } catch (error) {
                            console.error('Error fetching fresh orders:', error);
                        } finally {
                            setLoading(false); // Ensure loading is stopped after fresh fetch
                        }
                    };

                    fetchFreshData();

                    // STEP 3: Subscribe to real-time updates
                    const unsubscribe = subscribeToOrders((firebaseOrders) => {
                        const ordersWithDefaults = (firebaseOrders || []).map(order => ({
                            ...order,
                            status: (order.status as Order['status']) || 'pending',
                            trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                        }));
                        ordersWithDefaults.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                        setOrders(ordersWithDefaults);
                        setLoading(false); // Stop loading once first subscription data arrives
                    });

                    // Safety timeout to force loading to false after 5 seconds
                    const safetyTimeout = setTimeout(() => {
                        setLoading(false);
                    }, 5000);

                    return () => {
                        if (unsubscribe) unsubscribe();
                        clearTimeout(safetyTimeout);
                    };
                } else {
                    router.push('/admin/login');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing orders page:', error);
                setLoading(false);
            }
        };
        initializePage();
    }, [router]);

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

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

        // Normalize payment method for filtering
        const normalizedPaymentMethod = (order.paymentMethod?.toLowerCase() === 'cod') ? 'COD' : 'Online';
        const matchesPaymentMethod = filterPaymentMethod === 'all' || normalizedPaymentMethod === filterPaymentMethod;

        const matchesPaymentStatus = filterPaymentStatus === 'all' || order.paymentStatus === filterPaymentStatus;
        return matchesStatus && matchesPaymentMethod && matchesPaymentStatus;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-white">

                <div className="container mx-auto px-6 pt-[calc(var(--header-height,80px)+2rem)] pb-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>

            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <AdminWrapper>

            <div className="pt-[calc(var(--header-height,80px)+1rem)] sm:pt-[calc(var(--header-height,80px)+2rem)] pb-8 md:pb-12">
                <div className="container mx-auto max-w-7xl">
                    <AdminHeader
                        title="Orders Management"
                        subtitle={`Monitor and manage ${orders.length} customer orders.`}
                        showBackLink={true}
                    />

                    <div className="px-4 sm:px-6 lg:px-8">
                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-8">
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                                <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wider">Total Orders</h3>
                                <p className="text-xl sm:text-3xl font-bold text-brand-dark">{totalOrders}</p>
                            </div>
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                                <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wider">Total Revenue</h3>
                                <p className="text-xl sm:text-3xl font-bold text-gold">₹{totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm col-span-2 md:col-span-1">
                                <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wider">Pending Orders</h3>
                                <p className="text-xl sm:text-3xl font-bold text-orange-600">
                                    {orders.filter(o => o.status === 'pending' || o.status === 'processing').length}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark appearance-none bg-white text-sm font-medium"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="out_for_delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</label>
                                <select
                                    value={filterPaymentMethod}
                                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark appearance-none bg-white text-sm font-medium"
                                >
                                    <option value="all">All Methods</option>
                                    <option value="Online">Online Payment</option>
                                    <option value="COD">Cash on Delivery (COD)</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Status</label>
                                <select
                                    value={filterPaymentStatus}
                                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark appearance-none bg-white text-sm font-medium"
                                >
                                    <option value="all">All Payment Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
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
                                        className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 pb-4 border-b border-gray-200">
                                            <div className="mb-4 lg:mb-0">
                                                <div className="flex items-center justify-between lg:justify-start gap-3 mb-1">
                                                    <h3 className="text-base sm:text-lg font-bold text-black">Order ID: {order.orderId}</h3>
                                                    <span className="lg:hidden inline-block bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-bold text-xs">
                                                        ₹{order.totalAmount}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                                {order.trackingNumber && (
                                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                        Tracking: <span className="font-semibold text-brand-dark">{order.trackingNumber}</span>
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${(order.paymentMethod?.toLowerCase() === 'cod')
                                                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                        }`}>
                                                        {(order.paymentMethod?.toLowerCase() === 'cod') ? '💵 COD' : '💳 Online Payment'}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : order.paymentStatus === 'failed'
                                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                        }`}>
                                                        {order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus === 'failed' ? '✗ Failed' : '🕒 Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                                <div className="flex-1 sm:flex-none">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Update Status</label>
                                                    <select
                                                        value={order.status || 'pending'}
                                                        onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                                                        className="w-full sm:w-auto px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-dark bg-white"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="out_for_delivery">Out for Delivery</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="failed">Failed</option>
                                                    </select>
                                                </div>
                                                <div className="hidden lg:block">
                                                    <span className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-lg font-bold text-base">
                                                        ₹{order.totalAmount}
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
                                                        <p className="font-semibold text-gold">₹{item.total}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                            <div className="text-sm text-gray-600">
                                                <p>Subtotal: ₹{order.subtotal}</p>
                                                <p>Shipping: {order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</p>
                                                <p className="font-semibold text-black mt-1">
                                                    Payment: {(order.paymentMethod?.toLowerCase() === 'cod') ? 'Cash on Delivery' : 'Online Payment'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setShowInvoice(order)}
                                                    className="px-4 py-2 bg-brand-light text-brand-forest border-2 border-brand-forest/10 rounded-lg text-sm font-semibold hover:bg-brand-main/10 transition-colors flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Invoice
                                                </button>
                                                <button
                                                    onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                                                    className="px-4 py-2 bg-brand-dark text-white rounded-lg text-sm font-semibold hover:bg-brand transition-colors"
                                                >
                                                    {selectedOrder?.orderId === order.orderId ? 'Hide Details' : 'View Full Details'}
                                                </button>
                                            </div>
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
                                                            {(order.paymentMethod?.toLowerCase() === 'cod') ? 'Cash on Delivery' : 'Online Payment'}
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

                {/* Invoice Overlay */}
                {showInvoice && (
                    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                            <Invoice order={showInvoice} onClose={() => setShowInvoice(null)} />
                        </div>
                    </div>
                )}

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alertModal.isOpen}
                    title={alertModal.title}
                    message={alertModal.message}
                    type={alertModal.type}
                    onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                />


            </div>
        </AdminWrapper>
    );
}


