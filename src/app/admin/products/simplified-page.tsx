'use client';

import { useState } from 'react';

export default function SimplifiedProductForm() {
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'seo'>('basic');
    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        price: '',
        size: '',
        category: 'oil',
        inStock: true,

        // Image
        image: '',

        // Advanced (optional)
        originalPrice: '',
        discount: '',
        description: '',
        features: '',

        // SEO & Display
        showOnHome: true,
        isBestseller: false,
        isNew: false,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1F3D2B] to-[#2F5D3A] p-6 text-white">
                    <h2 className="text-2xl font-bold">✨ Add New Product</h2>
                    <p className="text-sm opacity-90 mt-1">Fill in the details below</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => setActiveTab('basic')}
                            className={`px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'basic'
                                    ? 'border-[#1F3D2B] text-[#1F3D2B] bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📦 Basic Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('advanced')}
                            className={`px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'advanced'
                                    ? 'border-[#1F3D2B] text-[#1F3D2B] bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ⚙️ Advanced
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('seo')}
                            className={`px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'seo'
                                    ? 'border-[#1F3D2B] text-[#1F3D2B] bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            🚀 Display
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        {/* Basic Info Tab */}
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                {/* Product Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Product Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                        placeholder="e.g., A2 Cow Bilona Ghee"
                                        required
                                    />
                                </div>

                                {/* Price & Size */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Price (₹) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                            placeholder="299"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Size
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.size}
                                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                            placeholder="500 ml"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                    >
                                        <option value="oil">Oil</option>
                                        <option value="ghee">Ghee</option>
                                        <option value="superfoods">Superfoods</option>
                                        <option value="combo">Combo</option>
                                    </select>
                                </div>

                                {/* Stock Status */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Stock Status
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                                        className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all ${formData.inStock
                                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                                : 'bg-red-100 text-red-700 border-2 border-red-500'
                                            }`}
                                    >
                                        {formData.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                                    </button>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Product Image
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        {imagePreview ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-h-64 mx-auto rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className="text-red-600 font-semibold hover:underline"
                                                >
                                                    Remove Image
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <div className="space-y-2">
                                                    <div className="text-4xl">📸</div>
                                                    <p className="font-semibold text-gray-700">Click to upload image</p>
                                                    <p className="text-sm text-gray-500">Max 5MB</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advanced Tab */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6">
                                {/* Original Price & Discount */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Original Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                            placeholder="499"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Discount (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                            placeholder="40"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-base resize-none"
                                        placeholder="Describe your product..."
                                    />
                                </div>

                                {/* Features */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Key Features
                                        <span className="text-gray-500 font-normal ml-2">(Comma-separated)</span>
                                    </label>
                                    <textarea
                                        value={formData.features}
                                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-base resize-none"
                                        placeholder="100% Natural, No Preservatives, Rich in Nutrients"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SEO & Display Tab */}
                        {activeTab === 'seo' && (
                            <div className="space-y-6">
                                {/* Display Badges */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-4">
                                        Product Badges
                                    </label>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Show on Home */}
                                        <label className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">🏠</span>
                                                <div>
                                                    <p className="font-bold text-gray-900">Show on Homepage</p>
                                                    <p className="text-sm text-gray-500">Display this product on homepage</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.showOnHome}
                                                onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                                                className="w-6 h-6 text-[#1F3D2B] border-gray-300 rounded focus:ring-[#1F3D2B]"
                                            />
                                        </label>

                                        {/* Bestseller */}
                                        <label className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">⭐</span>
                                                <div>
                                                    <p className="font-bold text-gray-900">Bestseller</p>
                                                    <p className="text-sm text-gray-500">Mark as bestselling product</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.isBestseller}
                                                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                                                className="w-6 h-6 text-[#1F3D2B] border-gray-300 rounded focus:ring-[#1F3D2B]"
                                            />
                                        </label>

                                        {/* New Product */}
                                        <label className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">✨</span>
                                                <div>
                                                    <p className="font-bold text-gray-900">New Product</p>
                                                    <p className="text-sm text-gray-500">Show "NEW" badge</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.isNew}
                                                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                                className="w-6 h-6 text-[#1F3D2B] border-gray-300 rounded focus:ring-[#1F3D2B]"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-[#1F3D2B] to-[#2F5D3A] text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all"
                        >
                            💾 Save Product
                        </button>
                        <button
                            type="button"
                            className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
