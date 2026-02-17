'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart, Product } from '@/context/CartContext';
import { subscribeToProducts, getProductReviewsFromFirebase, subscribeToProductReviews, saveReviewToFirebase, ProductReview } from '@/lib/firebaseProducts';
import type { Product as FirebaseProduct } from '@/lib/firebaseProducts';
import ProductCard from '@/components/ProductCard';
import AlertModal from '@/components/AlertModal';

// Helper function to infer weight from price for common products
function inferWeightFromPrice(price: number, productName: string): string {
    // Common price-to-weight mappings for oils
    const priceMap: { [key: number]: string } = {
        430: '1 KG', // Groundnut Oil 1000ml
        250: '500 ml',
        140: '250 ml',
        70: '100 ml',
        460: '1 KG', // Mustard Oil 1000ml
        260: '500 ml',
        150: '250 ml',
        80: '100 ml',
        450: '1 KG', // Sunflower/Coconut Oil 1000ml
        320: '500 ml',
        180: '250 ml',
        90: '100 ml',
        590: '1 KG', // Coconut Oil premium
        510: '1 KG', // Sesame Oil
        280: '500 ml',
        160: '250 ml',
    };

    // Check exact price match first
    if (priceMap[price]) {
        return priceMap[price];
    }

    // Check for approximate matches (within ₹10)
    for (const [priceKey, weight] of Object.entries(priceMap)) {
        if (Math.abs(price - parseInt(priceKey)) <= 10) {
            return weight;
        }
    }

    return '';
}

// Helper function to convert Firebase Product to CartContext Product
function convertToCartProduct(firebaseProduct: FirebaseProduct): Product {
    // Handle weight properly - check if it exists and is not empty
    let weight = firebaseProduct.weight;
    let size = (weight !== undefined && weight !== null && String(weight).trim().length > 0)
        ? String(weight).trim()
        : '';

    // If weight is missing, try to infer from price
    if (!size && firebaseProduct.price) {
        const inferredWeight = inferWeightFromPrice(firebaseProduct.price, firebaseProduct.name || '');
        if (inferredWeight) {
            size = inferredWeight;
        }
    }

    return {
        id: typeof firebaseProduct.id === 'string' ? parseInt(firebaseProduct.id) || 0 : firebaseProduct.id,
        name: firebaseProduct.name || '',
        price: firebaseProduct.price || 0,
        image: firebaseProduct.image || '',
        rating: firebaseProduct.rating || 4.0,
        reviews: 0, // Default reviews
        inStock: firebaseProduct.stock !== undefined ? firebaseProduct.stock > 0 : true,
        category: firebaseProduct.category || '',
        size: size,
        description: firebaseProduct.description || '',
        // Preserve all boolean flags and optional fields from Firebase
        // Properly convert boolean values (handle string "true"/"false", numbers 1/0, and actual booleans)
        isNew: (firebaseProduct as any).isNew === true || (firebaseProduct as any).isNew === 'true' || (firebaseProduct as any).isNew === 1,
        isBestseller: (firebaseProduct as any).isBestseller === true || (firebaseProduct as any).isBestseller === 'true' || (firebaseProduct as any).isBestseller === 1,
        isPrime: (firebaseProduct as any).isPrime === true || (firebaseProduct as any).isPrime === 'true' || (firebaseProduct as any).isPrime === 1,
        // CRITICAL: Strict boolean conversion - handle string "true"/"false" and actual booleans
        showOnHome: (() => {
            const value = (firebaseProduct as any).showOnHome;
            if (value === true || value === 'true') return true;
            if (value === false || value === 'false') return false;
            return false; // Default to false if undefined/null
        })(),
        originalPrice: (firebaseProduct as any).originalPrice,
        discount: (firebaseProduct as any).discount,
        features: (firebaseProduct as any).features,
        benefits: (firebaseProduct as any).benefits,
        includedProducts: (firebaseProduct as any).includedProducts,
    };
}


// Fake reviews pool - varied and "organic" feeling (updated for 20+ reviews)
const FAKE_REVIEW_POOL: Omit<ProductReview, 'id' | 'productId'>[] = [
    { userName: 'Anjali S.', rating: 5, comment: 'Absolutely pure! Reminds me of the homemade ghee my grandmother used to make. The aroma is distinct and tells you it\'s genuine.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, verified: true },
    { userName: 'Rahul Mehta', rating: 5, comment: 'I was skeptical at first, but the quality speaks for itself. Best organic purchase I\'ve made this year.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12, verified: true },
    { userName: 'Priya K.', rating: 4, comment: 'Good product, very nice packaging. Delivery took a day longer than expected but worth the wait for this quality.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8, verified: true },
    { userName: 'Suresh Reddy', rating: 5, comment: 'Authentic taste. We use this daily now. Highly improved our health and immunity.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20, verified: true },
    { userName: 'Meera Nair', rating: 5, comment: 'Finally found a brand that doesn\'t compromise on purity. 100% recommended for families.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25, verified: true },
    { userName: 'Vikram Singh', rating: 4.5, comment: 'A bit pricey compared to market, but you pay for what you get. Premium quality indeed.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15, verified: false },
    { userName: 'Neha Gupta', rating: 5, comment: 'The texture and smell are just perfect. You can feel the difference from store-bought chemical stuff.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, verified: true },
    { userName: 'Arjun Das', rating: 5, comment: 'Superb! Will definitely subscribe for monthly delivery. Keep up the good work.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, verified: true },
    { userName: 'Kavita W.', rating: 3.5, comment: 'Product is great, but packaging could be slightly more eco-friendly. Otherwise happy.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45, verified: true },
    { userName: 'Dr. Rohan', rating: 5, comment: 'As a doctor, I recommend this for its nutritional value. No additives, just pure goodness.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10, verified: true },
    { userName: 'Sneha P.', rating: 5, comment: 'Just wow! The flavor it adds to food is unmatched. My kids love it too.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60, verified: true },
    { userName: 'Amitabh J.', rating: 4, comment: 'Genuine organic product. Passed my home purity test. satisfied customer.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, verified: true },
    { userName: 'Rashmi T.', rating: 5, comment: 'Repeat order for me. Consistent quality every time.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18, verified: true },
    { userName: 'Karan L.', rating: 5, comment: 'Excellent service and even better product. The natural color and consistency are proof of its purity.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 22, verified: true },
    { userName: 'Deepa M.', rating: 4.5, comment: 'Very refreshing and natural. Love the fact that it is ethically sourced.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 28, verified: true },
    { userName: 'Sanjay B.', rating: 5, comment: 'Top class. Better than any international brand I have tried.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35, verified: false },
    { userName: 'Pooja H.', rating: 5, comment: 'My mother recommended this brand and she was right. Absolutely pure.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40, verified: true },
    { userName: 'Vivek K.', rating: 4, comment: 'Good quality, reasonable price for organic. Will buy again.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14, verified: true },
    { userName: 'Riya Sen', rating: 5, comment: 'Packaging was secure and delivery was prompt. Product quality is A+.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50, verified: true },
    { userName: 'Nitin G.', rating: 5, comment: 'I can blindly trust this brand now. The difference in health is visible.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 55, verified: true },
    { userName: 'Aisha R.', rating: 4.5, comment: 'Natural and fresh. The best part is no preservatives.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, verified: true },
    { userName: 'Manoj T.', rating: 5, comment: 'Ordered for my parents and they loved it. Authentic traditional taste.', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 65, verified: true }
];

// Generate deterministic fake reviews based on product ID
function getFakeReviews(productId: number): ProductReview[] {
    // Simple seeded random function to pick a subset or shuffle
    const seed = productId;
    const shuffled = [...FAKE_REVIEW_POOL].sort(() => 0.5 - Math.random()); // Ideally use a seeded random, but basic shuffle is okay for client-side diversity

    // Select 15-20 reviews consistently (mocking randomness with ID)
    const count = 15 + (productId % 6); // 15 to 20 reviews

    // Create a deterministic subset based on ID to make it "stable" during navigation if we wanted, 
    // but here we just want "some" reviews. 
    // To make them fixed per product (so they don't change on refresh), we should use a stronger seed strategy,
    // but for now let's just rotate the list based on ID.
    const start = productId % FAKE_REVIEW_POOL.length;
    const rotated = [...FAKE_REVIEW_POOL.slice(start), ...FAKE_REVIEW_POOL.slice(0, start)];

    return rotated.slice(0, count).map((review, index) => ({
        ...review,
        id: `fake-${productId}-${index}`,
        productId: productId,
        // Add some variation to dates based on index so they aren't all same day
        createdAt: Date.now() - (1000 * 60 * 60 * 24 * (index * 2 + 1)) - (productId * 100000)
    }));
}

const COMMON_FAQS = [
    {
        question: 'Is this product 100% natural and organic?',
        answer: 'Yes, all our products are 100% natural, organic, and free from any chemicals, preservatives, or additives. We source directly from trusted farmers and use traditional methods to ensure purity and authenticity.'
    },
    {
        question: 'What is the shelf life of this product?',
        answer: 'Our products have a shelf life of 12-18 months when stored in a cool, dry place away from direct sunlight. Please check the manufacturing date on the package for exact details. Once opened, consume within 3-6 months for best quality.'
    },
    {
        question: 'Do you offer free delivery?',
        answer: 'Yes, we offer free delivery on all orders above ₹500. For orders below ₹500, a nominal delivery charge applies. Prime members get free fast delivery on all orders. Delivery typically takes 3-7 business days depending on your location.'
    },
    {
        question: 'What is your return/refund policy?',
        answer: 'We offer a 7-day hassle-free return policy. If you are not satisfied with the product quality, you can return it within 7 days of delivery for a full refund or replacement. The product must be unopened and in original packaging. Refunds are processed within 5-7 business days.'
    },
    {
        question: 'How is the product packaged?',
        answer: 'All our products are carefully packaged in food-grade, airtight containers to maintain freshness and prevent contamination. We use eco-friendly packaging materials wherever possible. Each product is sealed to ensure quality and safety during transit.'
    },
    {
        question: 'Can I track my order?',
        answer: 'Yes, once your order is confirmed, you will receive a tracking number via email and SMS. You can track your order status in real-time through our order tracking page or by contacting our customer support team.'
    },
    {
        question: 'Do you offer bulk discounts?',
        answer: 'Yes, we offer special discounts on bulk orders. For orders above 10 units, you can avail up to 15% discount. Please contact our customer support team for bulk pricing and customized orders. Corporate orders are also welcome.'
    },
    {
        question: 'Is the product suitable for daily use?',
        answer: 'Absolutely! Our products are made for daily consumption and are safe for all age groups. They are rich in nutrients and can be incorporated into your daily diet for better health. However, we recommend consulting with a healthcare professional for specific dietary needs.'
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major payment methods including Credit/Debit cards, UPI, Net Banking, and Cash on Delivery (COD). All online payments are secured through our payment gateway partners. COD is available for orders up to ₹5000.'
    },
    {
        question: 'How do I store this product?',
        answer: 'Store the product in a cool, dry place away from direct sunlight and heat sources. Keep the container tightly closed after each use. Refrigeration is not required but can help extend shelf life. Avoid storing near strong-smelling items.'
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

        const fakeReviews = getFakeReviews(productId);

        const loadReviews = async () => {
            try {
                const productReviews = await getProductReviewsFromFirebase(productId);
                // Combine real reviews + fake reviews
                // Real reviews first, then fake reviews
                setReviews([...productReviews, ...fakeReviews]);
            } catch (error) {
                console.error('Error loading reviews:', error);
                // Fallback to fake reviews
                setReviews(fakeReviews);
            }
        };

        loadReviews();

        // Subscribe to real-time review updates
        const unsubscribe = subscribeToProductReviews(productId, (updatedReviews) => {
            // Keep fake reviews merged
            setReviews([...updatedReviews, ...fakeReviews]);
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
                    <svg key={i} className={`${sizeClasses[size]} text-gold fill-current`} viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {hasHalfStar && (
                    <svg className={`${sizeClasses[size]} text-gold fill-current`} viewBox="0 0 20 20">
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
                <div className="pt-[calc(var(--header-height,80px)+2rem)] pb-8">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <div className="text-center py-20">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
                            <Link
                                href="/products"
                                className="px-6 py-3 rounded-lg font-extrabold transition-all shadow-md hover:shadow-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #2F5D3A 0%, #1F3D2B 100%)',
                                    color: '#FFFFFF'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #1F3D2B 0%, #2F5D3A 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #2F5D3A 0%, #1F3D2B 100%)';
                                }}
                            >
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
        if (!imgPath) return '/placeholder.png';

        // Fix old/wrong image paths
        if (imgPath === '/images/products/ghee.jpg') {
            return '/images/products/GHEE.png';
        }
        if (imgPath === '/images/products/sunflower-oil.jpg' ||
            imgPath === '/images/products/coconut-oil.jpg' ||
            imgPath === '/images/products/olive-oil.jpg') {
            return '/placeholder.png';
        }
        if (imgPath === '/images/all/IMG-20251019-WA0015.jpg') {
            return '/placeholder.png';
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


    // Function to convert ml to litres for better readability
    const formatSize = (sizeValue: string): string => {
        if (!sizeValue) return '';
        const trimmed = sizeValue.trim();
        // Check if it contains ml (case insensitive)
        if (trimmed.toLowerCase().includes('ml')) {
            const mlValue = parseInt(trimmed.replace(/[^0-9]/g, ''));
            if (!isNaN(mlValue)) {
                if (mlValue >= 1000) {
                    const litres = mlValue / 1000;
                    return `${litres} ${litres === 1 ? 'Litre' : 'Litres'}`;
                }
                return `${mlValue} ml`;
            }
        }
        // Check if it's already in Litres
        if (trimmed.toLowerCase().includes('litre') || trimmed.toLowerCase().includes(' l')) {
            return trimmed;
        }
        return trimmed;
    };

    const fixedProductImage = fixProductImage(product.image);
    const fixedHoverImage = product.hoverImage ? fixProductImage(product.hoverImage) : undefined;

    const productImages = [fixedProductImage, fixedHoverImage].filter(Boolean);
    if (productImages.length === 0) productImages.push('/placeholder.png');

    // Debug logging (remove in production)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`Product: ${product.name}, Original Image: ${product.image}, Fixed Image: ${fixedProductImage}`);
    }

    const averageRating = calculateAverageRating();
    const ratingDistribution = getRatingDistribution();
    // Ensure totalReviews is a number
    const totalReviews = reviews.length > 0 ? reviews.length : (product.reviews || 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb - Refined */}
            <nav className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold">
                    <Link href="/" className="text-gray-500 hover:text-brand-forest transition-colors">Home</Link>
                    <span className="text-gray-300">/</span>
                    <Link href="/products" className="text-gray-500 hover:text-brand-forest transition-colors">Collection</Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-brand-forest truncate max-w-[200px]">{product.name}</span>
                </div>
            </nav>

            {/* Product Details Section - Organic Premium */}
            <div className="card-premium overflow-hidden mb-12 sm:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Product Images - Immersive Gallery */}
                    <div className="lg:col-span-7 bg-gradient-to-br from-cream via-white to-cream/50 p-4 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-beige">
                        <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-premium border border-beige/50 group/img">
                            <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
                                <img
                                    src={(() => {
                                        let imgSrc = productImages[selectedImage] || '/placeholder.png';
                                        if (!imgSrc.startsWith('http')) {
                                            imgSrc = imgSrc.replace(/ /g, '%20');
                                            if (!imgSrc.startsWith('/')) imgSrc = '/' + imgSrc;
                                        }
                                        return imgSrc;
                                    })()}
                                    alt={product.name}
                                    className="w-full h-full object-contain transition-all duration-700 ease-premium group-hover/img:scale-105 drop-shadow-2xl"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder.png';
                                    }}
                                />
                            </div>

                            {/* Organic Floating Badges */}
                            <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                                {product.isBestseller && (
                                    <span className="px-4 py-2 bg-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-gold ring-4 ring-white/20">
                                        Bestseller
                                    </span>
                                )}
                                {/* New Arrival Badge - REMOVED per user request */}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {productImages.length > 1 && (
                            <div className="flex gap-4 mt-8 justify-center">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative w-24 h-24 rounded-2xl overflow-hidden transition-all duration-300 ${selectedImage === idx
                                            ? 'ring-2 ring-gold shadow-premium border-2 border-white'
                                            : 'border border-beige hover:border-gold/50 bg-white/50 hover:bg-white'
                                            }`}
                                    >
                                        <img
                                            src={(() => {
                                                let imgSrc = img || '/placeholder.png';
                                                if (!imgSrc.startsWith('http')) {
                                                    imgSrc = imgSrc.replace(/ /g, '%20');
                                                }
                                                return imgSrc;
                                            })()}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-contain p-2"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info - Sophisticated Details */}
                    <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col bg-white">
                        <div className="flex-1">
                            {/* Organic Metadata */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-brand-light text-brand-forest text-[10px] font-bold uppercase tracking-widest rounded-full">
                                    {product.category || 'Pure Organic'}
                                </span>
                                {product.size && (
                                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                        {formatSize(product.size)}
                                    </span>
                                )}
                            </div>

                            <h1 className="heading-xl text-brand-forest mb-4 leading-tight">
                                {product.name}
                            </h1>

                            {/* Refined Rating */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-2">
                                    {renderStars(averageRating, 'md')}
                                    <span className="text-sm font-bold text-brand-forest mt-0.5">{averageRating.toFixed(1)}</span>
                                </div>
                                <div className="h-4 w-px bg-beige" />
                                <button
                                    onClick={() => {
                                        setActiveTab('reviews');
                                        document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-text-secondary hover:text-gold transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    {totalReviews} Trusted Reviews
                                </button>
                            </div>

                            {/* Pricing - Premium Display */}
                            <div className="mb-8 p-6 rounded-3xl bg-cream border border-beige shadow-premium-sm">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-bold text-brand-forest">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <div className="flex flex-col">
                                            <span className="text-sm text-text-secondary line-through opacity-60">
                                                ₹{product.originalPrice.toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
                                                Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% Today
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-beige/50 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                        <span className="text-[10px] font-bold text-brand-forest uppercase tracking-widest">In Stock</span>
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-beige" />
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Ships within 24 Hours</span>
                                </div>
                            </div>

                            {/* Quantity Selector - Minimal & Refined */}
                            <div className="flex items-center gap-6 mb-10">
                                <span className="text-xs font-bold text-brand-forest uppercase tracking-widest">Quantity</span>
                                <div className="flex items-center bg-white rounded-xl border border-beige shadow-premium-sm">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-cream transition-colors text-brand-forest"
                                        disabled={quantity <= 1}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="w-10 text-center font-bold text-brand-forest">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-cream transition-colors text-brand-forest"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Order Actions - Prominent */}
                        <div className="space-y-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all duration-500 shadow-premium hover:shadow-premium-lg flex items-center justify-center gap-3 ${product.inStock
                                    ? cart.some(item => item.id === product.id)
                                        ? 'bg-success text-white border-none'
                                        : 'bg-brand-forest text-white hover:bg-brand-dark'
                                    : 'bg-beige text-text-secondary cursor-not-allowed border-none'
                                    }`}
                            >
                                {cart.some(item => item.id === product.id) ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Selection Added
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        Add to Collection
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleBuyNow}
                                disabled={!product.inStock}
                                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all duration-500 flex items-center justify-center gap-3 ${product.inStock
                                    ? 'bg-gold text-white hover:bg-gold-dark shadow-gold hover:shadow-gold-lg'
                                    : 'hidden'
                                    }`}
                            >
                                Buy Selection Now
                            </button>
                        </div>

                        {/* Organic Trust Seals */}
                        <div className="grid grid-cols-2 gap-4 mt-10">
                            {[
                                { icon: 'M5 13l4 4L19 7', label: 'Free Express Shipping', color: 'text-brand-forest' },
                                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: '100% Purity Certified', color: 'text-gold' },
                                { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: '7-Day Organic Return', color: 'text-brand-forest' },
                                { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Ethically Sourced', color: 'text-gold' }
                            ].map((seal, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-2xl bg-cream border border-beige/50">
                                    <svg className={`w-4 h-4 ${seal.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={seal.icon} />
                                    </svg>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary leading-tight">{seal.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section - Organic & Immersive */}
            <div id="tabs-section" className="mb-20">
                <div className="flex justify-center border-b border-beige mb-10">
                    <div className="flex gap-8 sm:gap-16">
                        {[
                            { id: 'description', label: 'Description' },
                            { id: 'reviews', label: `Reviews (${totalReviews})` },
                            { id: 'faq', label: 'Organic FAQ' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-6 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id
                                    ? 'text-brand-forest'
                                    : 'text-text-secondary hover:text-gold'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gold animate-in fade-in slide-in-from-bottom-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-premium p-8 sm:p-12 lg:p-16">
                    {/* Description Tab */}
                    {activeTab === 'description' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Included Products (for Combo/Deal) - Refined */}
                            {product.includedProducts && product.includedProducts.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-brand-forest mb-6 flex items-center gap-3">
                                        <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        What's Inside This Collection
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {product.includedProducts.map((included: any, index: number) => (
                                            <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-cream border border-beige/50 hover:shadow-premium-sm transition-all duration-300">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-beige/30">
                                                    <img
                                                        src={included.image || '/placeholder.png'}
                                                        alt={included.name}
                                                        className="w-full h-full object-contain p-2"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-brand-forest text-sm truncate">{included.name}</h4>
                                                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mt-1">
                                                        {included.size || 'Standard Size'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="prose prose-brand max-w-none">
                                <h3 className="heading-md text-brand-forest mb-6">The Story of {product.name}</h3>
                                <p className="text-text-secondary leading-relaxed text-lg italic mb-8">
                                    "{product.description || `Our premium ${product.name} is carefully crafted using traditional methods to ensure maximum purity and nutritional value. This product is 100% natural, organic, and ethically sourced from local farmers.`}"
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                                    {/* Purity Standards */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-6">Purity Standards</h4>
                                        <ul className="space-y-4">
                                            {(product.features?.length ? product.features : ['100% Pure Organic', 'Cold Pressed Tradition', 'Zero Additives', 'Ethically Sourced']).map((f, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-brand-forest font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {/* Benefits */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-6">Wholesome Benefits</h4>
                                        <ul className="space-y-4">
                                            {(product.benefits?.length ? product.benefits : ['Boosts Immunity', 'Natural Energy Source', 'Rich in Antioxidants', 'Heart Healthy']).map((b, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-brand-forest font-medium">
                                                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {b}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Rating Summary */}
                                <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                                    <div className="p-8 rounded-3xl bg-cream border border-beige text-center">
                                        <div className="text-6xl font-bold text-brand-forest mb-4">{averageRating.toFixed(1)}</div>
                                        <div className="flex justify-center mb-4">
                                            {renderStars(averageRating, 'lg')}
                                        </div>
                                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Based on {totalReviews} Trusted Reviews</p>

                                        <button
                                            onClick={() => setShowReviewForm(true)}
                                            className="mt-8 w-full py-4 bg-brand-forest text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all shadow-premium"
                                        >
                                            Write Experience
                                        </button>
                                    </div>
                                </div>

                                {/* Reviews List */}
                                <div className="lg:col-span-8 space-y-8">
                                    {showReviewForm && (
                                        <form onSubmit={handleSubmitReview} className="p-8 rounded-3xl bg-white border-2 border-beige shadow-premium-lg animate-in zoom-in-95 duration-500 mb-12">
                                            <h4 className="heading-sm text-brand-forest mb-2">Share Your Experience</h4>
                                            <p className="text-sm text-text-secondary mb-8">How was the purity of {product.name}?</p>

                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3 block">Your Name</label>
                                                    <input
                                                        type="text"
                                                        value={reviewForm.userName}
                                                        onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                                                        className="w-full px-6 py-4 rounded-2xl bg-cream border border-beige focus:border-gold outline-none transition-colors font-medium text-brand-forest"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3 block">Rating</label>
                                                    <div className="flex gap-3">
                                                        {[1, 2, 3, 4, 5].map((rating) => (
                                                            <button
                                                                key={rating}
                                                                type="button"
                                                                onClick={() => setReviewForm({ ...reviewForm, rating })}
                                                                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${reviewForm.rating >= rating ? 'bg-gold text-white shadow-gold' : 'bg-cream text-beige hover:text-gold-light'}`}
                                                            >
                                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                                </svg>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3 block">Your Thoughts</label>
                                                    <textarea
                                                        value={reviewForm.comment}
                                                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                        rows={4}
                                                        className="w-full px-6 py-4 rounded-2xl bg-cream border border-beige focus:border-gold outline-none transition-colors font-medium text-brand-forest resize-none"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-4 pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={submittingReview}
                                                        className="flex-1 py-4 bg-brand-forest text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark disabled:opacity-50 transition-all"
                                                    >
                                                        {submittingReview ? 'Submitting...' : 'Post Experience'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowReviewForm(false)}
                                                        className="px-8 py-4 text-text-secondary font-bold uppercase tracking-widest text-[10px] hover:text-gold transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}

                                    <div className="space-y-6">
                                        {reviews.length === 0 ? (
                                            <div className="text-center py-20 bg-cream rounded-3xl border border-beige border-dashed">
                                                <p className="text-text-secondary italic">No reviews yet. Share your experience with {product.name}!</p>
                                            </div>
                                        ) : (
                                            reviews.map((review) => (
                                                <div key={review.id} className="p-8 rounded-3xl bg-white border border-beige shadow-premium-sm hover:shadow-premium-md transition-all duration-300">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h4 className="font-bold text-brand-forest">{review.userName}</h4>
                                                                {review.verified && (
                                                                    <span className="flex items-center gap-1 text-[8px] font-bold text-success uppercase tracking-widest bg-success/5 px-2 py-0.5 rounded-full border border-success/20">
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Purity Verified
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {renderStars(review.rating, 'sm')}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-text-secondary leading-relaxed italic">"{review.comment}"</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center mb-12">
                                <span className="text-gold font-bold tracking-widest text-xs uppercase mb-3 block">Organic Knowledge</span>
                                <h3 className="heading-md text-brand-forest">Purity Questions</h3>
                            </div>
                            <div className="space-y-4">
                                {COMMON_FAQS.map((faq, index) => (
                                    <div key={index} className="rounded-2xl border border-beige overflow-hidden bg-white hover:border-gold/30 transition-colors">
                                        <button
                                            onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                            className="w-full p-6 flex items-center justify-between text-left group"
                                        >
                                            <span className="font-bold text-brand-forest group-hover:text-gold transition-colors">{faq.question}</span>
                                            <svg className={`w-5 h-5 text-beige transition-transform duration-500 ${openFaqIndex === index ? 'rotate-180 text-gold' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {openFaqIndex === index && (
                                            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                                                <div className="pt-4 border-t border-beige/30">
                                                    <p className="text-sm text-text-secondary leading-relaxed italic">{faq.answer}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products - Premium cards */}
            {relatedProducts.length > 0 && (
                <div className="section-padding-sm mb-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
                        <div>
                            <span className="text-gold font-bold tracking-widest text-xs uppercase mb-3 block">Complementary Care</span>
                            <h2 className="heading-lg text-brand-forest">Related Products</h2>
                        </div>
                        <Link
                            href="/products"
                            className="group flex items-center gap-2 text-brand-forest font-bold text-sm hover:text-gold transition-colors"
                        >
                            View All Collection
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                        {relatedProducts.map((relatedProduct, idx) => (
                            <ProductCard
                                key={relatedProduct.id}
                                product={relatedProduct}
                                index={idx}
                            />
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
        </div>
    );
}



