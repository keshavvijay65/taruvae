'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/context/CartContext';

interface QuickEditModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    categories: string[];
}

export default function QuickEditModal({ product, isOpen, onClose, onSave, categories }: QuickEditModalProps) {
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            setFormData(product);
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 500));

        onSave({ ...product, ...formData });
        setIsSaving(false);
        onClose();
    };

    const handleChange = (field: keyof Product, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Quick Edit</h2>
                            <p className="text-sm text-gray-500 mt-1">{product.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Price */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Price (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.price || ''}
                                    onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all text-lg font-semibold"
                                    placeholder="Enter price"
                                />
                            </div>

                            {/* Original Price */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Original Price (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.originalPrice || ''}
                                    onChange={(e) => handleChange('originalPrice', parseFloat(e.target.value) || undefined)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                                    placeholder="Optional"
                                />
                            </div>

                            {/* Stock Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Stock Status
                                </label>
                                <select
                                    value={formData.inStock ? 'true' : 'false'}
                                    onChange={(e) => handleChange('inStock', e.target.value === 'true')}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                                >
                                    <option value="true">✅ In Stock</option>
                                    <option value="false">❌ Out of Stock</option>
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={formData.category || ''}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Product Badges
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'showOnHome', label: 'Show on Home Page', icon: '🏠' },
                                    { key: 'isBestseller', label: 'Bestseller', icon: '🏆' },
                                    { key: 'isNew', label: 'New Product', icon: '✨' },
                                    { key: 'isPrime', label: 'Prime Product', icon: '⭐' }
                                ].map((badge) => (
                                    <label
                                        key={badge.key}
                                        className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-brand-forest transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!(formData as any)[badge.key]}
                                            onChange={(e) => handleChange(badge.key as any, e.target.checked)}
                                            className="w-5 h-5 text-brand-forest border-gray-300 rounded focus:ring-brand-forest"
                                        />
                                        <span className="text-xl">{badge.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{badge.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-brand-forest text-white py-3 rounded-lg font-semibold hover:bg-brand-forest-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
