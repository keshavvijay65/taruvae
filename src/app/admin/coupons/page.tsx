'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Coupon, saveCouponsToFirebase, getCouponsFromFirebase, subscribeToCoupons } from '@/lib/firebaseCoupons';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminWrapper from '@/components/admin/AdminWrapper';

export default function AdminCouponsPage() {
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
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

    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: '',
        type: 'percentage',
        value: 0,
        minAmount: 0,
        maxDiscount: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        usageLimit: 0,
        usedCount: 0,
        isActive: true,
        showOnHome: false,
        showOnCheckout: false,
        description: '',
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize page and load coupons
    useEffect(() => {
        const initializePage = async () => {
            try {
                const auth = localStorage.getItem('admin-authenticated');
                if (auth === 'true') {
                    setIsAuthenticated(true);

                    // STEP 1: Load cached coupons IMMEDIATELY
                    try {
                        const cachedCoupons = localStorage.getItem('taruvae-admin-coupons');
                        if (cachedCoupons) {
                            const parsed = JSON.parse(cachedCoupons);
                            setCoupons(parsed);
                            setLoading(false); // Show UI immediately
                        }
                    } catch (cacheError) {
                        console.warn('Error loading cached coupons:', cacheError);
                    }

                    // STEP 2: Fetch fresh data in background
                    const fetchFreshData = async () => {
                        try {
                            const loadedCoupons = await Promise.race([
                                getCouponsFromFirebase(),
                                new Promise<Coupon[]>((_, reject) =>
                                    setTimeout(() => reject(new Error('Coupons load timeout')), 2000) // Reduced to 2s
                                )
                            ]).catch((error) => {
                                console.warn('Coupons load timeout, using cache:', error);
                                return null; // Keep cached data
                            });

                            if (loadedCoupons) {
                                setCoupons(loadedCoupons);
                            }
                        } catch (error) {
                            console.error('Error fetching fresh coupons:', error);
                            // Keep cached data
                        }
                    };

                    fetchFreshData();

                    // Subscribe to real-time updates (non-blocking)
                    try {
                        const unsubscribe = subscribeToCoupons((updatedCoupons) => {
                            if (updatedCoupons && Array.isArray(updatedCoupons)) {
                                setCoupons(updatedCoupons);
                            }
                        });
                        return () => {
                            if (unsubscribe && typeof unsubscribe === 'function') {
                                unsubscribe();
                            }
                        };
                    } catch (subError) {
                        console.error('Error setting up subscription:', subError);
                    }
                } else {
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error('Error initializing coupons page:', error);
            } finally {
                setLoading(false);
            }
        };

        initializePage();
    }, [router]);

    const resetForm = () => {
        setFormData({
            code: '',
            type: 'percentage',
            value: 0,
            minAmount: 0,
            maxDiscount: 0,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            usageLimit: 0,
            usedCount: 0,
            isActive: true,
            showOnHome: false,
            showOnCheckout: false,
            description: '',
        });
        setEditingId(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'value' || name === 'minAmount' || name === 'maxDiscount' || name === 'usageLimit' || name === 'usedCount'
                ? parseFloat(value) || 0
                : name === 'isActive' || name === 'showOnHome' || name === 'showOnCheckout'
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));
    };

    const handleAddCoupon = async () => {
        if (!formData.code?.trim()) {
            setToast({
                show: true,
                message: 'Coupon code is required',
                type: 'error',
            });
            return;
        }

        if (!formData.value || formData.value <= 0) {
            setToast({
                show: true,
                message: 'Discount value must be greater than 0',
                type: 'error',
            });
            return;
        }

        if (formData.type === 'percentage' && formData.value > 100) {
            setToast({
                show: true,
                message: 'Percentage discount cannot exceed 100%',
                type: 'error',
            });
            return;
        }

        // [FIX] Date validation
        if (formData.validFrom && formData.validUntil) {
            const start = new Date(formData.validFrom);
            const end = new Date(formData.validUntil);
            if (end < start) {
                setToast({
                    show: true,
                    message: 'Expiry date cannot be before the start date',
                    type: 'error',
                });
                return;
            }
        }

        try {
            const newCoupon: Coupon = {
                id: editingId || `coupon_${Date.now()}`,
                code: (formData.code || '').trim().toUpperCase().replace(/\s+/g, ''),
                type: formData.type || 'percentage',
                value: formData.value || 0,
                minAmount: formData.minAmount || 0,
                maxDiscount: formData.maxDiscount || 0,
                validFrom: new Date(formData.validFrom || new Date()).toISOString(),
                validUntil: new Date(formData.validUntil || new Date()).toISOString(),
                usageLimit: formData.usageLimit || 0,
                usedCount: formData.usedCount || 0,
                isActive: formData.isActive !== undefined ? formData.isActive : true,
                showOnHome: formData.showOnHome || false,
                showOnCheckout: formData.showOnCheckout || false,
                description: formData.description || '',
                createdAt: editingId
                    ? coupons.find((c) => c.id === editingId)?.createdAt || new Date().toISOString()
                    : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const updatedCoupons = editingId
                ? coupons.map((c) => (c.id === editingId ? newCoupon : c))
                : [...coupons, newCoupon];

            const result = await saveCouponsToFirebase(updatedCoupons);

            if (result.success) {
                setToast({
                    show: true,
                    message: editingId ? 'Coupon updated successfully' : 'Coupon added successfully',
                    type: 'success',
                });
                resetForm();
            } else {
                setToast({
                    show: true,
                    message: result.message || 'Failed to save coupon',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Error saving coupon:', error);
            setToast({
                show: true,
                message: 'Failed to save coupon',
                type: 'error',
            });
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minAmount: coupon.minAmount || 0,
            maxDiscount: coupon.maxDiscount || 0,
            validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
            validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
            usageLimit: coupon.usageLimit || 0,
            usedCount: coupon.usedCount || 0,
            isActive: coupon.isActive,
            showOnHome: coupon.showOnHome || false,
            showOnCheckout: coupon.showOnCheckout || false,
            description: coupon.description || '',
        });
        setEditingId(coupon.id);
    };

    const handleDelete = (couponId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Coupon',
            message: 'Are you sure you want to delete this coupon? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    const updatedCoupons = coupons.filter((c) => c.id !== couponId);
                    const result = await saveCouponsToFirebase(updatedCoupons);

                    if (result.success) {
                        setToast({
                            show: true,
                            message: 'Coupon deleted successfully',
                            type: 'success',
                        });
                    } else {
                        setToast({
                            show: true,
                            message: 'Failed to delete coupon',
                            type: 'error',
                        });
                    }
                } catch (error) {
                    console.error('Error deleting coupon:', error);
                    setToast({
                        show: true,
                        message: 'Failed to delete coupon',
                        type: 'error',
                    });
                }
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isExpired = (validUntil: string) => {
        return new Date(validUntil) < new Date();
    };



    return (
        <>
            <AdminWrapper>
                <div className="pt-[calc(var(--header-height,80px)+1rem)] sm:pt-[calc(var(--header-height,80px)+2rem)] pb-8 md:pb-12">
                    <AdminHeader
                        title="Manage Coupons"
                        subtitle={`Create and manage ${coupons.length} active discount codes.`}
                        showBackLink={true}
                    />

                    {/* Add/Edit Coupon Form */}
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 mb-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 text-brand-dark font-serif">
                                {editingId ? '📝 Edit Coupon' : '✨ Add New Coupon'}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Coupon Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        placeholder="WELCOME10"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Value <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                        placeholder={formData.type === 'percentage' ? '10' : '100'}
                                        min="0"
                                        max={formData.type === 'percentage' ? '100' : undefined}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.type === 'percentage'
                                            ? 'Enter percentage (e.g., 10 for 10%)'
                                            : 'Enter amount in ₹ (e.g., 100 for ₹100)'}
                                    </p>
                                </div>

                                {formData.type === 'percentage' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Discount (₹) <span className="text-gray-500">(Optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="maxDiscount"
                                            value={formData.maxDiscount}
                                            onChange={handleInputChange}
                                            placeholder="500"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum discount amount (e.g., ₹500)
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Order Amount (₹) <span className="text-gray-500">(Optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="minAmount"
                                        value={formData.minAmount}
                                        onChange={handleInputChange}
                                        placeholder="500"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valid From <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="validFrom"
                                        value={formData.validFrom}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valid Until <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="validUntil"
                                        value={formData.validUntil}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Usage Limit <span className="text-gray-500">(Optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="usageLimit"
                                        value={formData.usageLimit}
                                        onChange={handleInputChange}
                                        placeholder="100"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        0 = Unlimited usage
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-gray-500">(Optional)</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Get 10% off on your first order"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-brand-dark border-gray-300 rounded focus:ring-brand-dark"
                                    />
                                    <label className="ml-2 text-sm font-medium text-gray-700">
                                        Active
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="showOnHome"
                                        checked={formData.showOnHome}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-brand-dark border-gray-300 rounded focus:ring-brand-dark"
                                    />
                                    <label className="ml-2 text-sm font-medium text-gray-700">
                                        Show on Home
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="showOnCheckout"
                                        checked={formData.showOnCheckout}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-brand-dark border-gray-300 rounded focus:ring-brand-dark"
                                    />
                                    <label className="ml-2 text-sm font-medium text-gray-700">
                                        Show on Checkout
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={handleAddCoupon}
                                    className="flex-1 sm:flex-none px-8 py-3 bg-brand-forest text-white rounded-xl font-bold hover:bg-brand-dark transition-all shadow-md active:scale-95"
                                >
                                    {editingId ? 'Update Coupon' : 'Save Coupon'}
                                </button>
                                {editingId && (
                                    <button
                                        onClick={resetForm}
                                        className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Coupons List */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-brand-dark font-serif">Existing Coupons</h2>
                                <span className="bg-brand-50 text-brand-forest px-3 py-1 rounded-full text-xs font-bold ring-1 ring-brand-forest/10">
                                    {coupons.length} Total
                                </span>
                            </div>

                            {coupons.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">No coupons found. Add your first coupon above.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="grid grid-cols-1 gap-4 lg:hidden">
                                        {coupons.map((coupon) => (
                                            <div
                                                key={coupon.id}
                                                className={`p-4 rounded-xl border-2 transition-all ${isExpired(coupon.validUntil)
                                                    ? 'bg-red-50/30 border-red-100'
                                                    : coupon.isActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 grayscale'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-mono font-black text-lg text-brand-forest tracking-wider">
                                                        {coupon.code}
                                                    </span>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.isActive && !isExpired(coupon.validUntil)
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {isExpired(coupon.validUntil) ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Discount</p>
                                                        <p className="font-bold text-gray-900">
                                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Min Order</p>
                                                        <p className="font-bold text-gray-900">₹{coupon.minAmount || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Expiry</p>
                                                        <p className="font-bold text-gray-700">{formatDate(coupon.validUntil)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Usage</p>
                                                        <p className="font-bold text-gray-700">
                                                            {coupon.usageLimit ? `${coupon.usedCount || 0}/${coupon.usageLimit}` : `${coupon.usedCount || 0}/∞`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleEdit(coupon)}
                                                        className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon.id)}
                                                        className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50">
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Code</th>
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Type</th>
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Value</th>
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Min Amount</th>
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Valid Until</th>
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Usage</th>
                                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                                                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {coupons.map((coupon) => (
                                                    <tr
                                                        key={coupon.id}
                                                        className={`hover:bg-gray-50/50 transition-colors ${isExpired(coupon.validUntil) ? 'bg-red-50/20' : ''}`}
                                                    >
                                                        <td className="px-4 py-4 font-mono font-bold text-brand-forest">
                                                            {coupon.code}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600">
                                                            {coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="font-bold text-gray-900">
                                                                {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                                            </span>
                                                            {coupon.maxDiscount && coupon.type === 'percentage' && (
                                                                <span className="text-[10px] text-gray-400 block font-medium">
                                                                    Max ₹{coupon.maxDiscount}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600">
                                                            {coupon.minAmount ? `₹${coupon.minAmount}` : 'No limit'}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm">
                                                            <span className={isExpired(coupon.validUntil) ? 'text-red-500 font-medium' : 'text-gray-600'}>
                                                                {formatDate(coupon.validUntil)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600">
                                                            {coupon.usageLimit
                                                                ? `${coupon.usedCount || 0} / ${coupon.usageLimit}`
                                                                : `${coupon.usedCount || 0} / ∞`}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span
                                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.isActive && !isExpired(coupon.validUntil)
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                    }`}
                                                            >
                                                                {isExpired(coupon.validUntil) ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => handleEdit(coupon)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(coupon.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </AdminWrapper>

            <Toast
                isVisible={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                type="warning"
            />


        </>
    );
}

