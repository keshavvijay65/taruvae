/**
 * Core User interface for Taruvae Ecommerce
 */
export interface User {
    uid: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    photoURL?: string | null;
    phone?: string | null;
    phoneVerified: boolean;
    provider: 'google' | 'password';
    createdAt: string | null;
    lastLoginAt: string | null;
    cannotUseCOD?: boolean;
}

/**
 * Product interface
 */
export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
    stock?: number;
    weight?: string;
    rating?: number;
    upiId?: string;
    isNew?: boolean;
    isBestseller?: boolean;
    isPrime?: boolean;
    showOnHome?: boolean;
    originalPrice?: number;
    discount?: number;
    features?: string[];
    benefits?: string[];
    includedProducts?: Array<{
        id: number | string;
        name: string;
        price: number;
        image: string;
        size?: string;
    }>;
}

/**
 * Order interface with Razorpay integration fields
 */
export interface Order {
    orderId: string;
    userId?: string | null;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    shippingAddress: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        id: number | string;
        name: string;
        price: number;
        quantity: number;
        total: number;
        image?: string;
    }>;
    paymentMethod: 'COD' | 'Online' | 'cod' | 'razorpay' | string;
    paymentStatus: 'pending' | 'paid' | 'failed';
    subtotal: number;
    discount?: number;
    taxableAmount?: number;
    gst?: number;
    shipping: number;
    total?: number;
    totalAmount: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    couponCode?: string;
    couponDiscount?: number;
    orderDate: string;
    createdAt: string;
    status: 'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed' | 'confirmed';
    trackingNumber?: string;
    statusHistory?: Array<{
        status: string;
        date: string;
        message: string;
    }>;
}

/**
 * Category interface
 */
export interface Category {
    id: string;
    name: string;
    image: string;
    description?: string;
    slug: string;
}

/**
 * Coupon interface
 */
export interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minAmount?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usedCount?: number;
    isActive: boolean;
    description?: string;
    showOnHome?: boolean;
    showOnCheckout?: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Blog Post interface
 */
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    category: string;
    image?: string;
    publishedAt: number;
    updatedAt?: number;
    published: boolean;
    tags?: string[];
    views?: number;
}
