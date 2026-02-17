'use client';

interface SearchFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    selectedStock: string;
    onStockChange: (value: string) => void;
    priceRange: { min: string; max: string };
    onPriceRangeChange: (range: { min: string; max: string }) => void;
    onClearFilters: () => void;
    categories: string[];
}

export default function SearchFilters({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedStock,
    onStockChange,
    priceRange,
    onPriceRangeChange,
    onClearFilters,
    categories
}: SearchFiltersProps) {
    const hasActiveFilters = searchTerm || selectedCategory || selectedStock || priceRange.min || priceRange.max;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="w-full lg:w-48">
                    <select
                        value={selectedCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Stock Filter */}
                <div className="w-full lg:w-48">
                    <select
                        value={selectedStock}
                        onChange={(e) => onStockChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                    >
                        <option value="">All Stock</option>
                        <option value="instock">✅ In Stock</option>
                        <option value="outofstock">❌ Out of Stock</option>
                    </select>
                </div>

                {/* Price Range */}
                <div className="flex gap-2 w-full lg:w-auto">
                    <input
                        type="number"
                        placeholder="Min ₹"
                        value={priceRange.min}
                        onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
                        className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                    />
                    <input
                        type="number"
                        placeholder="Max ₹"
                        value={priceRange.max}
                        onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
                        className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                    />
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
