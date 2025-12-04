'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart, Product } from '@/context/CartContext';
import { subscribeToProducts, getProductReviewsFromFirebase, subscribeToProductReviews, saveReviewToFirebase, ProductReview } from '@/lib/firebaseProducts';
import type { Product as FirebaseProduct } from '@/lib/firebaseProducts';

// Helper function to convert Firebase Product to CartContext Product
function convertToCartProduct(firebaseProduct: FirebaseProduct): Product {
    return {
        id: typeof firebaseProduct.id === 'string' ? parseInt(firebaseProduct.id) || 0 : firebaseProduct.id,
        name: firebaseProduct.name || '',
        price: firebaseProduct.price || 0,
        image: firebaseProduct.image || '',
        rating: firebaseProduct.rating || 4.0,
        reviews: 0, // Default reviews
        inStock: firebaseProduct.stock !== undefined ? firebaseProduct.stock > 0 : true,
        category: firebaseProduct.category || '',
        size: firebaseProduct.weight || '',
        description: firebaseProduct.description || '',
    };
}
import AlertModal from '@/components/AlertModal';

// Common FAQs for all products
const COMMON_FAQS = [
    {
        question: 'Is this product 100% natural and organic?',
        answer: 'Yes, all our products are 100% natural, organic, and free from any chemicals, preservatives, or additives. We source directly from trusted farmers and use traditional methods to ensure purity.'
    },
    {
        question: 'What is the shelf life of this product?',
        answer: 'Our products have a shelf life of 12-18 months when stored in a cool, dry place away from direct sunlight. Please check the manufacturing date on the package for exact details.'
    },
    {
        question: 'Do you offer free delivery?',
        answer: 'Yes, we offer free delivery on all orders. For orders above ₹500, you also get priority fast delivery. Delivery typically takes 3-7 business days depending on your location.'
    },
    {
        question: 'What is your return/refund policy?',
        answer: 'We offer a 7-day return policy. If you are not satisfied with the product quality, you can return it within 7 days of delivery for a full refund or replacement. The product must be unopened and in original packaging.'
    },
    {
        question: 'How is the product packaged?',
        answer: 'All our products are carefully packaged in food-grade, airtight containers to maintain freshness and prevent contamination. We use eco-friendly packaging materials wherever possible.'
    },
    {
        question: 'Can I track my order?',
        answer: 'Yes, once your order is confirmed, you will receive a tracking number via email and SMS. You can track your order status in real-time through our order tracking page.'
    },
    {
        question: 'Do you offer bulk discounts?',
        answer: 'Yes, we offer special discounts on bulk orders. Please contact our customer support team for bulk pricing and customized orders for quantities above 10 units.'
    },
    {
        question: 'Is the product suitable for daily use?',
        answer: 'Absolutely! Our products are made for daily consumption and are safe for all age groups. They are rich in nutrients and can be incorporated into your daily diet for better health.'
    }
];

interface ProductDetailClientProps {
    product: Product;
    products: Product[];
}

export default function ProductDetailClient({ product: initialProduct, products: initialProducts }: ProductDetailClientProps) {
    const params = useParams();
    const router = useRouter();
    const { addToCart, cart } = useCart();
    const productId = params?.id ? parseInt(params.id as string) : null;
    
    const [product, setProduct] = useState<Product | null>(initialProduct);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'faq'>('description');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    
    // Review states
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });
    const [reviewForm, setReviewForm] = useState({
        userName: '',
        rating: 5,
        comment: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);

    // Compute related products (stable, no random - prevents hydration mismatch)
    const relatedProducts = useMemo(() => {
        if (!product || !products.length) return [];
        
        // First, try to get products from the same category
        const sameCategory = products.filter(p => 
            p.id !== product.id && 
            p.category === product.category
        );
        
        // If we have enough same-category products, use them
        if (sameCategory.length >= 5) {
            return sameCategory.slice(0, 5);
        }
        
        // Otherwise, mix same category with other products
        const otherProducts = products.filter(p => 
            p.id !== product.id && 
            p.category !== product.category
        );
        
        // Combine: same category first, then others (deterministic, no random)
        return [...sameCategory, ...otherProducts].slice(0, 5);
    }, [product, products]);

    // Subscribe to real-time product updates
    useEffect(() => {
        if (!productId) return;

        const unsubscribe = subscribeToProducts((updatedProducts) => {
            // Convert Firebase Products to CartContext Products
            const cartProducts = updatedProducts.map(convertToCartProduct);
            setProducts(cartProducts);
            const foundProduct = cartProducts.find(p => p.id === productId);
            if (foundProduct) {
                // Fix image paths in real-time updates
                const fixedProduct = {
                    ...foundProduct,
                    image: fixProductImage(foundProduct.image)
                };
                setProduct(fixedProduct);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [productId]);

    // Load reviews
    useEffect(() => {
        if (!productId) return;

        const loadReviews = async () => {
            try {
                const productReviews = await getProductReviewsFromFirebase(productId);
                setReviews(productReviews);
            } catch (error) {
                console.error('Error loading reviews:', error);
            }
        };

        loadReviews();

        // Subscribe to real-time review updates
        const unsubscribe = subscribeToProductReviews(productId, (updatedReviews) => {
            setReviews(updatedReviews);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [productId]);

    const handleAddToCart = () => {
        if (!product) return;
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
    };

    const handleBuyNow = () => {
        if (!product) return;
        handleAddToCart();
        router.push('/checkout');
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !reviewForm.userName.trim() || !reviewForm.comment.trim()) return;

        setSubmittingReview(true);
        try {
            const newReview: ProductReview = {
                id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                productId,
                userName: reviewForm.userName.trim(),
                rating: reviewForm.rating,
                comment: reviewForm.comment.trim(),
                createdAt: Date.now(),
                verified: true
            };

            await saveReviewToFirebase(newReview);
            setReviewForm({ userName: '', rating: 5, comment: '' });
            setShowReviewForm(false);
        } catch (error) {
            console.error('Error submitting review:', error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to submit review. Please try again.',
                type: 'error',
            });
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClasses = {
            sm: 'w-3 h-3',
            md: 'w-4 h-4',
            lg: 'w-5 h-5'
        };
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(fullStars)].map((_, i) => (
                    <svg key={i} className={`${sizeClasses[size]} text-yellow-400 fill-current`} viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {hasHalfStar && (
                    <svg className={`${sizeClasses[size]} text-yellow-400 fill-current`} viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id={`half-${productId}-${rating}`}>
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <path fill={`url(#half-${productId}-${rating})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                )}
                {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                    <svg key={i} className={`${sizeClasses[size]} text-gray-300 fill-current`} viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
        );
    };

    const calculateAverageRating = () => {
        if (reviews.length === 0) return product?.rating || 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    };

    const getRatingDistribution = () => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            const rating = Math.round(review.rating);
            if (rating >= 1 && rating <= 5) {
                distribution[rating as keyof typeof distribution]++;
            }
        });
        return distribution;
    };

    if (!product) {
        return (
            <div className="min-h-screen rich-gradient">
                <div className="pt-20 sm:pt-24 pb-8">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <div className="text-center py-20">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
                            <Link href="/products" className="bg-[#2D5016] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors">
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fix product image paths (handle old cached data)
    const fixProductImage = (imgPath: string | undefined): string => {
        if (!imgPath) return '/images/all/products image available soon.png';
        
        // Fix old/wrong image paths
        if (imgPath === '/images/products/ghee.jpg') {
            return '/images/products/GHEE.png';
        }
        if (imgPath === '/images/products/sunflower-oil.jpg' || 
            imgPath === '/images/products/coconut-oil.jpg' || 
            imgPath === '/images/products/olive-oil.jpg') {
            return '/images/all/products image available soon.png';
        }
        if (imgPath === '/images/all/IMG-20251019-WA0015.jpg') {
            return '/images/all/products image available soon.png';
        }
        // Fix Hing and Garam Masala paths
        if (product.name && product.name.includes('Hing') && imgPath !== '/images/products/Hing.png') {
            return '/images/products/Hing.png';
        }
        if (product.name && product.name.includes('Garam Masala')) {
            if (imgPath !== '/images/products/Garam Masala.jpeg' && 
                !imgPath.includes('Garam%20Masala') && 
                !imgPath.includes('Garam Masala')) {
                return '/images/products/Garam Masala.jpeg';
            }
        }
        return imgPath;
    };

    const fixedProductImage = fixProductImage(product.image);
    const fixedHoverImage = product.hoverImage ? fixProductImage(product.hoverImage) : undefined;
    
    const productImages = [fixedProductImage, fixedHoverImage].filter(Boolean);
    if (productImages.length === 0) productImages.push('/images/all/products image available soon.png');
    
    // Debug logging (remove in production)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`Product: ${product.name}, Original Image: ${product.image}, Fixed Image: ${fixedProductImage}`);
    }

    const averageRating = calculateAverageRating();
    const ratingDistribution = getRatingDistribution();
    const totalReviews = reviews.length || product.reviews;

    return (
        <>
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <Link href="/" className="hover:text-[#2D5016]">Home</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-[#2D5016]">Products</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">{product.name}</span>
                </div>
            </nav>

            {/* Product Details Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
                    {/* Product Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden border-2 border-gray-100">
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <img
                                    src={(() => {
                                        let imgSrc = productImages[selectedImage] || '/images/all/products image available soon.png';
                                        // Replace all spaces with %20
                                        if (!imgSrc.startsWith('http')) {
                                            imgSrc = imgSrc.replace(/ /g, '%20');
                                        }
                                        return imgSrc;
                                    })()}
                                    alt={product.name}
                                    className="w-full h-full object-contain max-w-md"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = '/images/all/products%20image%20available%20soon.png';
                                    }}
                                />
                            </div>
                            {product.isBestseller && (
                                <div className="absolute top-4 left-4 bg-gradient-to-r from-[#FF6F00] to-[#FF8F00] text-white px-3 py-1.5 rounded-lg shadow-lg z-10 flex items-center gap-1.5">
                                    <span className="text-sm">⭐</span>
                                    <span className="text-xs font-extrabold">BESTSELLER</span>
                                </div>
                            )}
                            {product.isNew && !product.isBestseller && (
                                <div className="absolute top-4 left-4 bg-[#FF6F00] text-white px-3 py-1.5 rounded-lg shadow-lg z-10">
                                    <span className="text-xs font-bold">NEW</span>
                                </div>
                            )}
                        </div>
                        {productImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                            selectedImage === idx ? 'border-[#2D5016]' : 'border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={(() => {
                                                let imgSrc = img || '/images/all/products image available soon.png';
                                                // Replace all spaces with %20
                                                if (!imgSrc.startsWith('http')) {
                                                    imgSrc = imgSrc.replace(/ /g, '%20');
                                                }
                                                return imgSrc;
                                            })()}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/all/products%20image%20available%20soon.png';
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                {product.name}
                            </h1>
                            
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    {renderStars(averageRating, 'lg')}
                                    <span className="text-lg font-semibold text-gray-700">{averageRating.toFixed(1)}</span>
                                    <span className="text-gray-500">({totalReviews} reviews)</span>
                                </div>
                            </div>

                            {product.size && (
                                <p className="text-lg text-gray-600 mb-4">Size: <span className="font-semibold">{product.size}</span></p>
                            )}
                        </div>

                        {/* Price */}
                        <div className="border-t border-b border-gray-200 py-6">
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-extrabold text-[#2D5016]">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                {product.originalPrice && (
                                    <>
                                        <span className="text-2xl text-gray-400 line-through">
                                            ₹{product.originalPrice.toLocaleString('en-IN')}
                                        </span>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
                                            Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
                                        </span>
                                    </>
                                )}
                            </div>
                            {product.discount && (
                                <p className="text-green-600 font-semibold mt-2">{product.discount}% OFF</p>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {product.inStock ? (
                                <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold border border-green-200">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    In Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold border border-red-200">
                                    Out of Stock
                                </span>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <label className="font-semibold text-gray-700">Quantity:</label>
                            <div className="flex items-center gap-2 border-2 border-gray-200 rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                                    disabled={quantity <= 1}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <span className="px-4 py-2 font-semibold text-lg min-w-[3rem] text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                                className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                                    product.inStock
                                        ? cart.some(item => item.id === product.id)
                                            ? 'bg-[#FFD814] hover:bg-[#F7CA00] text-black'
                                            : 'bg-[#FFD814] hover:bg-[#F7CA00] text-black'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {cart.some(item => item.id === product.id) ? 'Added to Cart' : 'Add to Cart'}
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={!product.inStock}
                                className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                                    product.inStock
                                        ? 'bg-[#FFA41C] hover:bg-[#FA8900] text-white'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-green-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">Free Delivery</span>
                            </div>
                            {product.isPrime || product.price >= 500 ? (
                                <div className="flex items-center gap-2 text-blue-700">
                                    <span className="text-lg">⚡</span>
                                    <span className="font-semibold">Priority Fast Delivery Available</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                                activeTab === 'description'
                                    ? 'text-[#2D5016] border-b-2 border-[#2D5016]'
                                    : 'text-gray-600 hover:text-[#2D5016]'
                            }`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                                activeTab === 'reviews'
                                    ? 'text-[#2D5016] border-b-2 border-[#2D5016]'
                                    : 'text-gray-600 hover:text-[#2D5016]'
                            }`}
                        >
                            Reviews & Ratings ({totalReviews})
                        </button>
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                                activeTab === 'faq'
                                    ? 'text-[#2D5016] border-b-2 border-[#2D5016]'
                                    : 'text-gray-600 hover:text-[#2D5016]'
                            }`}
                        >
                            FAQs
                        </button>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {/* Description Tab */}
                    {activeTab === 'description' && (
                        <div className="space-y-8">
                            {/* Product Description */}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    About This Product
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    {product.description ? (
                                        <p className="text-gray-700 leading-relaxed text-base">
                                            {product.description}
                                        </p>
                                    ) : (
                                        <p className="text-gray-700 leading-relaxed text-base">
                                            Our premium {product.name} is carefully crafted using traditional methods to ensure maximum purity and nutritional value. 
                                            This product is 100% natural, organic, and free from any chemicals or preservatives.
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Key Features */}
                            {((product.features && product.features.length > 0) || (!product.features || product.features.length === 0)) && (
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        Key Features
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(product.features && product.features.length > 0 ? product.features : [
                                            '100% Natural and Organic',
                                            'No Chemicals or Preservatives',
                                            'Rich in Nutrients',
                                            'Traditional Processing Methods',
                                            'Directly Sourced from Trusted Farmers',
                                            'Eco-Friendly Packaging'
                                        ]).map((feature, index) => (
                                            <div key={index} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4 hover:border-[#2D5016]/30 transition-colors">
                                                <svg className="w-5 h-5 text-[#2D5016] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <p className="text-gray-700 text-sm flex-1">{feature}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Benefits */}
                            {((product.benefits && product.benefits.length > 0) || (!product.benefits || product.benefits.length === 0)) && (
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        Benefits
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(product.benefits && product.benefits.length > 0 ? product.benefits : [
                                            'Supports overall health and wellness',
                                            'Maintains natural flavor and aroma',
                                            'Preserves essential nutrients',
                                            'Safe for daily consumption'
                                        ]).map((benefit, index) => (
                                            <div key={index} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-[#2D5016]/30 transition-colors">
                                                <svg className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-gray-700 text-sm flex-1">{benefit}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-6" id="reviews">
                            {/* Rating Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <div className="text-center mb-6">
                                        <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating.toFixed(1)}</div>
                                        <div className="flex justify-center mb-2">
                                            {renderStars(averageRating, 'lg')}
                                        </div>
                                        <p className="text-gray-600">Based on {totalReviews} reviews</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) => {
                                        const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                        return (
                                            <div key={rating} className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-700 w-8">{rating}</span>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-400 transition-all duration-300"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add Review Button */}
                            {!showReviewForm && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="bg-[#2D5016] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                                >
                                    Write a Review
                                </button>
                            )}

                            {/* Review Form */}
                            {showReviewForm && (
                                <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-6 space-y-4">
                                    <h4 className="text-xl font-bold text-gray-900">Write a Review</h4>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            value={reviewForm.userName}
                                            onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                <button
                                                    key={rating}
                                                    type="button"
                                                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        reviewForm.rating >= rating
                                                            ? 'bg-yellow-400 text-yellow-900'
                                                            : 'bg-gray-200 text-gray-400'
                                                    }`}
                                                >
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
                                        <textarea
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="bg-[#2D5016] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors disabled:opacity-50"
                                        >
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowReviewForm(false);
                                                setReviewForm({ userName: '', rating: 5, comment: '' });
                                            }}
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Reviews List */}
                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this product!</p>
                                ) : (
                                    reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900">{review.userName}</span>
                                                        {review.verified && (
                                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                                Verified Purchase
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {renderStars(review.rating, 'sm')}
                                                        <span className="text-sm text-gray-600">
                                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <div className="space-y-4" id="faq">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                            {COMMON_FAQS.map((faq, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                        className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-semibold text-gray-900">{faq.question}</span>
                                        <svg
                                            className={`w-5 h-5 text-gray-600 transition-transform ${
                                                openFaqIndex === index ? 'rotate-180' : ''
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openFaqIndex === index && (
                                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        Related Products
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    href={`/products/${relatedProduct.id}`}
                                    className="group bg-white border-2 border-gray-100 rounded-xl overflow-hidden hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden group-hover:from-[#F5F1EB] group-hover:via-white group-hover:to-[#F5F1EB] transition-all duration-300">
                                        {(() => {
                                            // Fix image paths for related products too
                                            let imgSrc = relatedProduct.image || '/images/all/products image available soon.png';
                                            
                                            // Fix old/wrong image paths
                                            if (imgSrc === '/images/products/ghee.jpg') {
                                                imgSrc = '/images/products/GHEE.png';
                                            }
                                            if (imgSrc === '/images/products/sunflower-oil.jpg' || 
                                                imgSrc === '/images/products/coconut-oil.jpg' || 
                                                imgSrc === '/images/products/olive-oil.jpg') {
                                                imgSrc = '/images/all/products image available soon.png';
                                            }
                                            if (imgSrc === '/images/all/IMG-20251019-WA0015.jpg') {
                                                imgSrc = '/images/all/products image available soon.png';
                                            }
                                            // Fix Hing and Garam Masala paths
                                            if (relatedProduct.name && relatedProduct.name.includes('Hing') && imgSrc !== '/images/products/Hing.png') {
                                                imgSrc = '/images/products/Hing.png';
                                            }
                                            if (relatedProduct.name && relatedProduct.name.includes('Garam Masala')) {
                                                if (imgSrc !== '/images/products/Garam Masala.jpeg' && 
                                                    !imgSrc.includes('Garam%20Masala') && 
                                                    !imgSrc.includes('Garam Masala')) {
                                                    imgSrc = '/images/products/Garam Masala.jpeg';
                                                }
                                            }
                                            
                                            // Replace all spaces with %20 for URL encoding
                                            if (!imgSrc.startsWith('http')) {
                                                imgSrc = imgSrc.replace(/ /g, '%20');
                                            }
                                            
                                            const isPlaceholder = imgSrc.includes('products%20image%20available%20soon') || imgSrc.includes('products image available soon');
                                            
                                            return (
                                                <>
                                                    <img
                                                        src={imgSrc}
                                                        alt={relatedProduct.name}
                                                        className={`w-full h-full transition-all duration-300 group-hover:scale-105 ${
                                                            isPlaceholder 
                                                                ? 'object-contain p-4 opacity-60' 
                                                                : 'object-contain p-2'
                                                        }`}
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            // Debug error
                                                            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                                                                console.error(`Related product image failed: ${e.currentTarget.src} for ${relatedProduct.name}`);
                                                            }
                                                            // Fallback to placeholder
                                                            const placeholder = '/images/all/products%20image%20available%20soon.png';
                                                            if (!e.currentTarget.src.includes('products%20image%20available%20soon')) {
                                                                e.currentTarget.src = placeholder;
                                                                e.currentTarget.className = 'w-full h-full object-contain p-4 opacity-60 transition-all duration-300 group-hover:scale-105';
                                                            }
                                                        }}
                                                        onLoad={() => {
                                                            // Debug success
                                                            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                                                                console.log(`Related product image loaded: ${relatedProduct.name}`);
                                                            }
                                                        }}
                                                    />
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <div className="p-3 bg-white">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#2D5016] transition-colors duration-200 min-h-[2.5rem]">
                                            {relatedProduct.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-bold text-[#2D5016]">
                                                ₹{relatedProduct.price.toLocaleString('en-IN')}
                                            </p>
                                            {relatedProduct.rating && (
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                    </svg>
                                                    <span className="text-xs text-gray-600 font-medium">{relatedProduct.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
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
        </>
    );
}

