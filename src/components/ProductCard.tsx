'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, Product } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductCardProps {
    product: Product;
    variants?: Product[]; // All variants of this product (same name, different sizes)
    index?: number;
}

// Function to convert ml to litres for better readability
const formatSize = (sizeValue: string): string => {
    const trimmed = sizeValue.trim();
    // Check if it contains ml (case insensitive)
    const mlMatch = trimmed.match(/^(\d+)\s*(ml|ML)$/i);
    if (mlMatch) {
        const mlValue = parseInt(mlMatch[1], 10);
        // Convert 1000ml or more to litres
        if (mlValue >= 1000 && mlValue % 1000 === 0) {
            const litres = mlValue / 1000;
            return `${litres} ${litres === 1 ? 'litre' : 'litres'}`;
        }
        // Keep smaller values as ml (500ml, 250ml, etc.)
        return trimmed;
    }
    // Return as-is for other formats (KG, GM, etc.)
    return trimmed;
};

export default function ProductCard({ product, variants = [], index = 0 }: ProductCardProps) {
    const { addToCart, cart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const router = useRouter();
    const [addedToCart, setAddedToCart] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Variant state - if variants provided, use them; otherwise use single product
    const allVariants = variants.length > 0 ? variants : [product];
    const [selectedVariant, setSelectedVariant] = useState<Product>(allVariants[0]);

    // Update selected variant when variants change
    useEffect(() => {
        if (allVariants.length > 0) {
            setSelectedVariant(allVariants[0]);
        }
    }, [variants]);

    // Stability rules: if critical fields are missing, skip rendering the card.
    const name = String(selectedVariant?.name || '').trim().replace(/Peanut Oil/gi, 'Ground Nut Oil');
    const price = Number(selectedVariant?.price);
    const image = String(selectedVariant?.image || '').trim();
    const hasRequiredData = Boolean(name) && Number.isFinite(price) && price > 0 && Boolean(image);

    // Skip products without valid data
    if (!hasRequiredData) return null;

    // Compute weight/size value
    const weightValue = (() => {
        const size = product.size;
        if (size !== undefined && size !== null) {
            const value = String(size).trim();
            if (value.length > 0) {
                return formatSize(value);
            }
        }
        return '';
    })();

    const hasWeight = weightValue.length > 0;

    // Calculate discount percentage
    const discountPercent = (() => {
        const originalPrice = Number(product.originalPrice) || 0;
        if (originalPrice > price && originalPrice > 0) {
            return Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        return 0;
    })();

    // Properly check boolean values
    const isBestseller = !!product.isBestseller;
    const isNew = !!product.isNew;
    const isPrime = !!product.isPrime;
    const hasFreeShipping = price >= 500;

    const handleAddToCart = () => {
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        if (!product.inStock) return;
        if (!isInCart) {
            addToCart(product);
        }
        router.push('/checkout');
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(fullStars)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-gold fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {hasHalfStar && (
                    <svg className="w-3 h-3 text-gold fill-current" viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id={`half-${product.id}`}>
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                        <path fill={`url(#half-${product.id})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                )}
                {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-gold/20 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
        );
    };

    const isInCart = cart.some(item => item.id === product.id);

    return (
        <div
            className="group product-card flex flex-col h-full bg-white relative overflow-hidden rounded-3xl border border-gray-100 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(31,61,43,0.15)] hover:-translate-y-1"
            style={{
                animation: `fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
            }}
        >
            {/* Wishlist - Top Right */}
            <button
                onClick={handleToggleWishlist}
                className={`absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${isInWishlist(product.id)
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm'
                    }`}
            >
                <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isInWishlist(product.id) ? 'fill-current scale-110' : 'group-hover:scale-110'}`}
                    fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>

            {/* Badges - Professional Stack */}
            <div className="absolute top-3 left-3 z-30 flex flex-col items-start gap-1.5 pointer-events-none">
                {/* 1. BEST SELLER */}
                {isBestseller && (
                    <span className="px-2.5 py-0.5 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-sm backdrop-blur-md flex items-center gap-1.5">
                        <svg className="w-2.5 h-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Best Seller
                    </span>
                )}

                {/* 2. DISCOUNT - REMOVED */}
            </div>

            {/* Image Section - Clean & Premium */}
            <Link href={`/products/${product.id}`} className="relative block w-full aspect-square bg-[#F9F9F7] overflow-hidden group-hover:bg-[#F2F4F2] transition-colors duration-500">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse z-10" />
                )}

                <div className="absolute inset-0 flex items-center justify-center p-4 transition-transform duration-700 ease-out group-hover:scale-105">
                    <img
                        src={image === '/placeholder.png' ? image : image.replace(/ /g, '%20')}
                        alt={name}
                        className={`w-full h-full object-contain mix-blend-multiply transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.currentTarget.src = '/placeholder.png';
                            setImageLoaded(true);
                        }}
                    />
                </div>
            </Link>

            {/* Info Section */}
            <div className="px-5 pb-5 pt-4 flex flex-col flex-grow bg-white relative z-10">
                {/* Meta: Rating & Weight */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 bg-[#F5F5F0] px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-[10px] font-bold text-gray-800">{product.rating || 4.5}</span>
                    </div>
                    {hasWeight && (
                        <span className="text-[10px] font-medium text-gray-500">
                            {weightValue}
                        </span>
                    )}
                </div>

                {/* Title */}
                <Link href={`/products/${product.id}`} className="mb-1 block">
                    <h3 className="text-[15px] font-bold text-brand-dark leading-snug font-display group-hover:text-brand-forest transition-colors">
                        {name}
                    </h3>
                </Link>

                {/* Price & Delivery Badges */}
                <div className="mb-14 sm:mb-12">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-base sm:text-lg font-bold text-brand-forest">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && product.originalPrice > price && (
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                ₹{product.originalPrice.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    {/* Delivery & Prime Badges */}
                    <div className="flex flex-wrap gap-2">
                        {isPrime && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                                </svg>
                                Prime
                            </span>
                        )}
                        {/* Free Shipping Badge - REMOVED per user request */}
                    </div>
                </div>

                {/* "Unified Glass-Pill" Action Bar - Always Visible */}
                <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-20">
                    <div className="flex items-center p-1 sm:p-1.5 bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.06)] rounded-xl sm:rounded-2xl">

                        {/* Add to Cart */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart();
                            }}
                            disabled={!product.inStock}
                            title={addedToCart || isInCart ? "Added" : "Add to Cart"}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 border border-transparent ${!product.inStock
                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                : (addedToCart || isInCart)
                                    ? 'bg-green-50 text-green-600 border-green-100'
                                    : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-brand-forest hover:border-gray-200'
                                }`}
                        >
                            {(addedToCart || isInCart) ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 sm:h-6 bg-gray-200 mx-1"></div>

                        {/* Buy Now - Main Trigger */}
                        <button
                            onClick={handleBuyNow}
                            disabled={!product.inStock}
                            className={`flex-1 h-9 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${!product.inStock
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-brand-forest text-white hover:bg-[#1a3c26] shadow-sm'
                                }`}
                        >
                            <span>Buy Now</span>
                            <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
