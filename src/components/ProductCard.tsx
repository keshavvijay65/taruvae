'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, Product } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductCardProps {
    product: Product;
    index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    const { addToCart, cart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const router = useRouter();
    const [addedToCart, setAddedToCart] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(false);

    const handleAddToCart = () => {
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        if (!product.inStock) return;
        addToCart(product);
        router.push('/checkout');
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation();
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
                    <svg key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {hasHalfStar && (
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id={`half-${product.id}`}>
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <path fill={`url(#half-${product.id})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                )}
                {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                    <svg key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div
            className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 hover:border-[#D4AF37]/50 flex flex-col h-full relative transition-all duration-300 hover:-translate-y-2 cursor-pointer w-full max-w-full"
            onMouseEnter={() => setHoveredProduct(true)}
            onMouseLeave={() => setHoveredProduct(false)}
            style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
            }}
        >
            {/* Premium Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 via-[#2D5016]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/10 group-hover:via-[#2D5016]/5 group-hover:to-[#D4AF37]/10 transition-all duration-500 pointer-events-none z-0 rounded-xl sm:rounded-2xl" />
            
            {/* Product Image Container - Compact */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden group/image rounded-t-xl">
                <Link href={`/products/${product.id}`} className="absolute inset-0 z-0">
                {/* Premium Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
                
                {/* Subtle Border Glow on Hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#D4AF37]/30 transition-all duration-300 rounded-t-xl z-5" />
                
                <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3 z-0">
                    {(() => {
                        const placeholderImage = '/images/all/products image available soon.png';
                        let imageSrc = (product.image && product.image !== '') ? product.image.trim() : placeholderImage;
                        
                        // Fix old/wrong image paths before encoding
                        if (imageSrc === '/images/products/ghee.jpg') {
                            imageSrc = '/images/products/GHEE.png';
                        }
                        if (imageSrc === '/images/products/sunflower-oil.jpg' || 
                            imageSrc === '/images/products/coconut-oil.jpg' || 
                            imageSrc === '/images/products/olive-oil.jpg') {
                            imageSrc = placeholderImage;
                        }
                        if (imageSrc === '/images/all/IMG-20251019-WA0015.jpg') {
                            imageSrc = placeholderImage;
                        }
                        // Fix Hing and Garam Masala paths
                        if (product.name && product.name.includes('Hing') && imageSrc !== '/images/products/Hing.png' && !imageSrc.includes('Hing.png')) {
                            imageSrc = '/images/products/Hing.png';
                        }
                        if (product.name && product.name.includes('Garam Masala')) {
                            if (imageSrc !== '/images/products/Garam Masala.jpeg' && 
                                !imageSrc.includes('Garam%20Masala') && 
                                !imageSrc.includes('Garam Masala') &&
                                !imageSrc.startsWith('data:image')) {
                                imageSrc = '/images/products/Garam Masala.jpeg';
                            }
                        }
                        
                        // For Next.js static export, we need to handle spaces in file names
                        // Encode spaces in the entire path (but not for base64/data URLs)
                        if (!imageSrc.startsWith('http') && !imageSrc.startsWith('data:image')) {
                            // Replace all spaces with %20 in the path
                            imageSrc = imageSrc.replace(/ /g, '%20');
                        }
                        
                        // Also encode placeholder
                        const placeholderEncoded = placeholderImage.replace(/ /g, '%20');
                        
                            return (
                                <img
                                    src={imageSrc}
                                    alt={product.name}
                                className="w-full h-full object-contain transition-all duration-500 group-hover/image:scale-105"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    }}
                                loading="lazy"
                                    onError={(e) => {
                                    // Fallback to placeholder immediately
                                    if (!e.currentTarget.src.includes('products%20image%20available%20soon') && 
                                        !e.currentTarget.src.includes('data:image')) {
                                        e.currentTarget.src = placeholderEncoded;
                                    }
                                    }}
                                />
                            );
                    })()}
                </div>
                </Link>

                {/* NEW Badge - Top Left */}
                {product.isNew && !product.isBestseller && (
                    <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-[#FF6F00] text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shadow-md z-30 flex items-center gap-0.5 sm:gap-1">
                        <span>NEW</span>
                    </div>
                )}

                {/* BESTSELLER Badge - Top Left - Premium Style */}
                {product.isBestseller && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-[#FF6F00] to-[#FF8F00] text-white px-2 sm:px-2.5 py-1 rounded-lg shadow-lg z-30 flex items-center gap-1 sm:gap-1.5 border border-white/20 backdrop-blur-sm">
                        <span className="text-xs sm:text-sm animate-pulse">⭐</span>
                        <span className="text-[10px] sm:text-xs font-extrabold tracking-wide">BESTSELLER</span>
                    </div>
                )}

                {/* Top Right Container - Wishlist + Discount Stacked - Premium Style */}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col items-end gap-2 z-40">
                    {/* Wishlist Button - Premium Style */}
                    <button
                        onClick={handleToggleWishlist}
                        className="p-2 sm:p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 hover:shadow-xl transition-all duration-300 group/wishlist flex-shrink-0 hover:scale-110"
                        aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${isInWishlist(product.id) ? 'text-red-500 fill-current scale-110' : 'text-gray-600 group-hover/wishlist:text-red-500'}`}
                            fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    
                    {/* Discount Badge - Premium Style */}
                    {product.discount && (
                        <div className="bg-gradient-to-r from-[#CC0C39] to-[#E91E63] text-white px-2 sm:px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap border border-white/20 backdrop-blur-sm">
                            <span className="text-[10px] sm:text-xs font-extrabold">{product.discount}% OFF</span>
                        </div>
                    )}
                </div>

                {/* Quick View Button - Center on Hover (Desktop Only) */}
                <Link href={`/products/${product.id}`} className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none hidden sm:flex">
                    <span className="bg-white text-[#2D5016] px-4 py-2 rounded-md text-xs font-semibold shadow-lg hover:bg-[#2D5016] hover:text-white transition-all duration-200 transform scale-90 group-hover:scale-100 pointer-events-auto">
                        Quick View
                    </span>
                </Link>

                {/* Fast Delivery Badge - Bottom Left on Hover (Desktop Only) */}
                <div className="absolute bottom-2 left-2 bg-[#232F3E] text-white px-2 py-0.5 rounded text-[9px] font-semibold shadow-md z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex">
                    <span>⚡</span>
                    <span>Fast Delivery</span>
                </div>

                {/* Out of Stock Overlay - Amazon Style */}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-30">
                        <span className="bg-gray-800 text-white px-4 py-2 rounded-md font-semibold text-xs sm:text-sm shadow-lg">Currently Unavailable</span>
                    </div>
                )}
            </div>

            {/* Product Info - Compact Style */}
            <div className="p-2 sm:p-2.5 flex flex-col flex-grow relative bg-white z-10">
                {/* Product Name - Compact */}
                <Link href={`/products/${product.id}`}>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2rem] group-hover:text-[#2D5016] hover:text-[#2D5016] transition-colors duration-200 leading-tight cursor-pointer">
                        {product.name}
                    </h3>
                </Link>

                {/* Rating - Compact */}
                <div className="flex items-center gap-1 mb-1">
                    <div className="flex items-center">
                        {renderStars(product.rating)}
                    </div>
                    <Link href={`/products/${product.id}#reviews`}>
                        <span className="text-[9px] sm:text-[10px] text-[#2D5016] hover:text-[#D4AF37] hover:underline cursor-pointer font-medium">
                            ({product.reviews})
                        </span>
                    </Link>
                </div>

                {/* Price - Compact */}
                <div className="mb-1.5 flex-grow">
                    <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-base sm:text-lg font-extrabold text-[#2D5016]">
                            ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && (
                            <>
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                    ₹{product.originalPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-green-600 font-bold bg-green-50 px-1 py-0.5 rounded">
                                    Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
                                </span>
                            </>
                        )}
                    </div>
                    {product.size && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">{product.size}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md text-[9px] sm:text-[10px] font-semibold border border-green-200">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Free Delivery
                        </span>
                        {(product.isPrime || product.price >= 500) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] sm:text-[10px] font-semibold border border-blue-200" title="Fast Priority Delivery">
                                <span className="text-xs">⚡</span>
                                <span>Prime</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons - Compact Style */}
                <div className="flex flex-col gap-1.5 sm:gap-2">
                    {/* Add to Cart Button - Compact */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!product.inStock}
                        className={`relative w-full py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md ${
                            product.inStock
                                ? addedToCart || cart.some(item => item.id === product.id)
                                    ? 'bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#FCD200]'
                                    : 'bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#FCD200]'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                        }`}
                    >
                        {addedToCart || cart.some(item => item.id === product.id) ? (
                            <>
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Added</span>
                            </>
                        ) : product.inStock ? (
                            <>
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>Add to Cart</span>
                            </>
                        ) : (
                            'Out of Stock'
                        )}
                    </button>

                    {/* Buy Now Button - Compact */}
                    <button
                        onClick={handleBuyNow}
                        disabled={!product.inStock}
                        className={`relative w-full py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                            product.inStock
                                ? 'bg-[#FFA41C] hover:bg-[#FA8900] text-white border border-[#FF8F00]'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                        }`}
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}

