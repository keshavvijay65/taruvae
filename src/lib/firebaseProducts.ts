export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
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
        id: number;
        name: string;
        price: number;
        image: string;
        size?: string;
    }>;
}


import { ref, set, get, onValue, off, DataSnapshot } from 'firebase/database';
import { firebaseDb } from './firebase/config';

// SSR-SAFE: Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// SSR-SAFE localStorage helpers
function getLocalStorage(key: string): string | null {
    if (!isBrowser) return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setLocalStorage(key: string, value: string): void {
    if (!isBrowser) return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // Silently fail
    }
}

function dispatchStorageEvent(eventName: string): void {
    if (!isBrowser) return;
    try {
        window.dispatchEvent(new Event(eventName));
    } catch {
        // Silently fail
    }
}

// Helper function to remove undefined values from objects (Firebase doesn't allow undefined)
function removeUndefinedValues(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
                cleaned[key] = removeUndefinedValues(obj[key]);
            }
        }
        return cleaned;
    }
    return obj;
}


// Save products to Firebase
export async function saveProductsToFirebase(products: Product[]): Promise<{ success: boolean; message: string }> {
    console.log('[FirebaseProducts] 💾 Attempting to save products to Firebase...', products.length);
    try {
        const db = firebaseDb;
        if (!db) {
            console.error('[FirebaseProducts] ❌ Firebase Database instance is NULL. Falling back to localStorage.');
            // Fallback to localStorage (SSR-SAFE)
            setLocalStorage('taruvae-admin-products', JSON.stringify(products));
            dispatchStorageEvent('taruvae-products-updated');
            return { success: true, message: 'Products saved to localStorage (Firebase not configured)' };
        }

        console.log('[FirebaseProducts] ✅ Database instance found. Writing to "products" node...');

        // Clean products by removing undefined values (Firebase doesn't allow undefined)
        const cleanedProducts = removeUndefinedValues(products);

        const productsRef = ref(db, 'products');

        // Save products to Firebase
        await set(productsRef, cleanedProducts);
        console.log('[FirebaseProducts] 🚀 Write operation to Firebase completed successfully.');

        // Also save to localStorage as backup (SSR-SAFE)
        setLocalStorage('taruvae-admin-products', JSON.stringify(products));
        dispatchStorageEvent('taruvae-products-updated');

        return { success: true, message: 'Products saved to Firebase successfully' };
    } catch (error: any) {
        console.error('[FirebaseProducts] ❌ Error saving products to Firebase:', error);
        // Fallback to localStorage (SSR-SAFE)
        setLocalStorage('taruvae-admin-products', JSON.stringify(products));
        dispatchStorageEvent('taruvae-products-updated');
        return { success: false, message: error.message || 'Failed to save products to Firebase' };
    }
}

import { DEFAULT_PRODUCTS } from './defaultProducts';

// Seed default products to Firebase (Idempotent)
export async function seedProductsToFirebase(): Promise<{ success: boolean; message: string; added: number; updated: number }> {
    console.log('[FirebaseProducts] 🌱 Seeding default products to Firebase...');
    try {
        const db = firebaseDb;
        if (!db) {
            return { success: false, message: 'Firebase not configured', added: 0, updated: 0 };
        }

        let updatedCount = 0;
        let addedCount = 0;

        // Iterate and Upsert (Overwrite to ensure sync with Excel sheet)
        for (const product of DEFAULT_PRODUCTS) {
            if (!product.id) continue;

            const productRef = ref(db, `products/${product.id}`);
            const snapshot = await get(productRef);

            if (snapshot.exists()) {
                updatedCount++;
            } else {
                addedCount++;
            }

            // Force update to ensure data integrity
            await set(productRef, product);
        }

        console.log(`[FirebaseProducts] ✅ Seed complete. Added: ${addedCount}, Updated: ${updatedCount}`);

        // Update localStorage as fallback
        setLocalStorage('taruvae-admin-products', JSON.stringify(DEFAULT_PRODUCTS));
        dispatchStorageEvent('taruvae-products-updated');

        return {
            success: true,
            message: `Successfully synced products. Added ${addedCount} new, Updated ${updatedCount} existing.`,
            added: addedCount,
            updated: updatedCount
        };

    } catch (error: any) {
        console.error('[FirebaseProducts] ❌ Seed error:', error);
        return { success: false, message: error.message || 'Failed to seed products', added: 0, updated: 0 };
    }
}

// Get all products from Firebase
export async function getAllProductsFromFirebase(): Promise<Product[]> {
    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback to localStorage (SSR-SAFE)
            const savedProducts = getLocalStorage('taruvae-admin-products');
            if (savedProducts) {
                try {
                    return JSON.parse(savedProducts);
                } catch {
                    return [];
                }
            }
            return [];
        }

        const productsRef = ref(db, 'products');
        let snapshot: DataSnapshot;
        try {
            snapshot = await get(productsRef);
        } catch (error) {
            console.warn('[FirebaseProducts] Fetch error, falling back to local storage');
            // On timeout or error, fallback to localStorage
            const savedProducts = getLocalStorage('taruvae-admin-products');
            if (savedProducts) {
                try {
                    const products = JSON.parse(savedProducts);
                    return Array.isArray(products) ? products : Object.values(products);
                } catch {
                    return [];
                }
            }
            return [];
        }

        if (snapshot.exists()) {
            const productsData = snapshot.val();
            // If it's an array, return it directly
            if (Array.isArray(productsData)) {
                return productsData;
            }
            // If it's an object, convert to array
            return Object.values(productsData);
        }

        // If no products in Firebase, check localStorage (SSR-SAFE)
        const savedProducts = getLocalStorage('taruvae-admin-products');
        if (savedProducts) {
            return JSON.parse(savedProducts);
        }

        return [];
    } catch (error: any) {
        console.warn('Error fetching products from Firebase:', error);
        // Fallback to localStorage (SSR-SAFE)
        const savedProducts = getLocalStorage('taruvae-admin-products');
        if (savedProducts) {
            return JSON.parse(savedProducts);
        }
        return [];
    }
}

// Listen to products in real-time (client-only function)
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
    // SSR-SAFE: Only run on client
    if (!isBrowser) {
        callback([]);
        return () => { };
    }

    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback: listen to localStorage changes
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'taruvae-admin-products') {
                    try {
                        const products = e.newValue ? JSON.parse(e.newValue) : [];
                        callback(products);
                    } catch (error) {
                        console.error('Error parsing products from storage event:', error);
                    }
                }
            };

            const handleCustomEvent = () => {
                try {
                    const savedProducts = getLocalStorage('taruvae-admin-products');
                    const products = savedProducts ? JSON.parse(savedProducts) : [];
                    callback(products);
                } catch (error) {
                    console.error('Error parsing products from custom event:', error);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('taruvae-products-updated', handleCustomEvent);

            // Load initial data
            const savedProducts = getLocalStorage('taruvae-admin-products');
            if (savedProducts) {
                try {
                    const products = JSON.parse(savedProducts);
                    callback(products);
                } catch (error) {
                    console.error('Error parsing initial products:', error);
                }
            }

            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('taruvae-products-updated', handleCustomEvent);
            };
        }

        const productsRef = ref(db, 'products');

        const handleSnapshot = (snapshot: DataSnapshot) => {
            try {
                if (snapshot.exists()) {
                    const productsData = snapshot.val();
                    let products: Product[];

                    // If it's an array, use it directly
                    if (Array.isArray(productsData)) {
                        products = productsData;
                    } else {
                        // If it's an object, convert to array
                        products = Object.values(productsData);
                    }

                    // Also update localStorage as backup
                    setLocalStorage('taruvae-admin-products', JSON.stringify(products));
                    callback(products);
                } else {
                    // If no products in Firebase, check localStorage
                    const savedProducts = getLocalStorage('taruvae-admin-products');
                    if (savedProducts) {
                        try {
                            const products = JSON.parse(savedProducts);
                            callback(products);
                        } catch (error) {
                            console.error('Error parsing products from localStorage:', error);
                            callback([]);
                        }
                    } else {
                        callback([]);
                    }
                }
            } catch (error) {
                console.warn('Error in handleSnapshot:', error);
                callback([]);
            }
        };

        // Set up real-time listener with error handler
        const handleError = (error: Error | Event | unknown) => {
            const errorMessage = error instanceof Error
                ? error.message
                : error instanceof Event
                    ? `Event: ${error.type}`
                    : String(error);
            console.warn('Firebase subscription error:', errorMessage, error);
            // Fallback to localStorage on error
            const savedProducts = getLocalStorage('taruvae-admin-products');
            if (savedProducts) {
                try {
                    callback(JSON.parse(savedProducts));
                } catch {
                    callback([]);
                }
            } else {
                callback([]);
            }
        };

        onValue(productsRef, handleSnapshot, handleError);

        // Return unsubscribe function
        return () => {
            try {
                off(productsRef);
            } catch {
                // Ignore cleanup errors
            }
        };
    } catch (error: any) {
        console.warn('Error setting up products subscription:', error);
        // Fallback: return empty unsubscribe function
        return () => { };
    }
}

// Category interface
export interface Category {
    id: string;
    value: string;
    label: string;
    icon?: string; // Optional icon identifier
    createdAt?: number;
}

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
    { id: 'oil', value: 'oil', label: 'Oil', createdAt: Date.now() },
    { id: 'ghee', value: 'ghee', label: 'Ghee', createdAt: Date.now() },
    { id: 'superfoods', value: 'superfoods', label: 'Spices/Superfoods', createdAt: Date.now() },
    { id: 'combo', value: 'combo', label: 'Combo', createdAt: Date.now() },
    { id: 'deals', value: 'deals', label: 'Deals', createdAt: Date.now() },
];

// Save categories to Firebase
export async function saveCategoriesToFirebase(categories: Category[]): Promise<{ success: boolean; message: string }> {
    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback to localStorage
            setLocalStorage('taruvae-categories', JSON.stringify(categories));
            dispatchStorageEvent('taruvae-categories-updated');
            return { success: true, message: 'Categories saved to localStorage (Firebase not configured)' };
        }

        const categoriesRef = ref(db, 'categories');
        await set(categoriesRef, categories);

        // Also save to localStorage as backup
        setLocalStorage('taruvae-categories', JSON.stringify(categories));
        dispatchStorageEvent('taruvae-categories-updated');

        return { success: true, message: 'Categories saved to Firebase successfully' };
    } catch (error: any) {
        console.warn('Error saving categories to Firebase:', error);
        // Fallback to localStorage
        setLocalStorage('taruvae-categories', JSON.stringify(categories));
        dispatchStorageEvent('taruvae-categories-updated');
        return { success: false, message: error.message || 'Failed to save categories to Firebase' };
    }
}

// Get all categories from Firebase
export async function getAllCategoriesFromFirebase(): Promise<Category[]> {
    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback to localStorage
            const savedCategories = getLocalStorage('taruvae-categories');
            if (savedCategories) {
                return JSON.parse(savedCategories);
            }
            // Return default categories if nothing in localStorage
            return DEFAULT_CATEGORIES;
        }

        const categoriesRef = ref(db, 'categories');
        const snapshot = await get(categoriesRef);

        if (snapshot.exists()) {
            const categoriesData = snapshot.val();
            // If it's an array, return it directly
            if (Array.isArray(categoriesData)) {
                return categoriesData;
            }
            // If it's an object, convert to array
            return Object.values(categoriesData);
        }

        // If no categories in Firebase, check localStorage
        const savedCategories = getLocalStorage('taruvae-categories');
        if (savedCategories) {
            return JSON.parse(savedCategories);
        }

        // Return default categories
        return DEFAULT_CATEGORIES;
    } catch (error: any) {
        console.warn('Error fetching categories from Firebase:', error);
        // Fallback to localStorage
        const savedCategories = getLocalStorage('taruvae-categories');
        if (savedCategories) {
            return JSON.parse(savedCategories);
        }
        return DEFAULT_CATEGORIES;
    }
}

// Listen to categories in real-time (client-only function)
export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
    // SSR-SAFE: Only run on client
    if (!isBrowser) {
        callback(DEFAULT_CATEGORIES);
        return () => { };
    }

    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback: listen to localStorage changes
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'taruvae-categories') {
                    try {
                        const categories = e.newValue ? JSON.parse(e.newValue) : DEFAULT_CATEGORIES;
                        callback(categories);
                    } catch (error) {
                        console.error('Error parsing categories from storage event:', error);
                    }
                }
            };

            const handleCustomEvent = () => {
                try {
                    const savedCategories = getLocalStorage('taruvae-categories');
                    const categories = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
                    callback(categories);
                } catch (error) {
                    console.error('Error parsing categories from custom event:', error);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('taruvae-categories-updated', handleCustomEvent);

            // Load initial data
            const savedCategories = getLocalStorage('taruvae-categories');
            if (savedCategories) {
                try {
                    const categories = JSON.parse(savedCategories);
                    callback(categories);
                } catch (error) {
                    console.error('Error parsing initial categories:', error);
                    callback(DEFAULT_CATEGORIES);
                }
            } else {
                callback(DEFAULT_CATEGORIES);
            }

            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('taruvae-categories-updated', handleCustomEvent);
            };
        }

        const categoriesRef = ref(db, 'categories');

        const handleSnapshot = (snapshot: DataSnapshot) => {
            try {
                if (snapshot.exists()) {
                    const categoriesData = snapshot.val();
                    let categories: Category[];

                    // If it's an array, use it directly
                    if (Array.isArray(categoriesData)) {
                        categories = categoriesData;
                    } else {
                        // If it's an object, convert to array
                        categories = Object.values(categoriesData);
                    }

                    // Also update localStorage as backup
                    setLocalStorage('taruvae-categories', JSON.stringify(categories));
                    callback(categories);
                } else {
                    // If no categories in Firebase, check localStorage
                    const savedCategories = getLocalStorage('taruvae-categories');
                    if (savedCategories) {
                        try {
                            const categories = JSON.parse(savedCategories);
                            callback(categories);
                        } catch (parseError) {
                            console.error('Error parsing categories from localStorage:', parseError);
                            callback(DEFAULT_CATEGORIES);
                        }
                    } else {
                        callback(DEFAULT_CATEGORIES);
                    }
                }
            } catch (error) {
                console.warn('Error in categories handleSnapshot:', error);
                callback(DEFAULT_CATEGORIES);
            }
        };

        // Error handler for Firebase subscription
        const handleError = (error: Error | Event | unknown) => {
            const errorMessage = error instanceof Error
                ? error.message
                : error instanceof Event
                    ? `Event: ${error.type}`
                    : String(error);
            console.warn('Firebase categories subscription error:', errorMessage, error);
            callback(DEFAULT_CATEGORIES);
        };

        // Set up real-time listener with error handler
        onValue(categoriesRef, handleSnapshot, handleError);

        // Return unsubscribe function
        return () => {
            try {
                off(categoriesRef);
            } catch {
                // Ignore cleanup errors
            }
        };
    } catch (error: any) {
        console.warn('Error setting up categories subscription:', error);
        // Fallback: return empty unsubscribe function
        return () => { };
    }
}

// Review interface
export interface ProductReview {
    id: string;
    productId: number;
    userName: string;
    rating: number;
    comment: string;
    createdAt: number;
    verified?: boolean;
}

// Save review to Firebase
export async function saveReviewToFirebase(review: ProductReview): Promise<{ success: boolean; message: string }> {
    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback to localStorage (SSR-SAFE)
            const savedReviews = getLocalStorage(`taruvae-reviews-${review.productId}`);
            const reviews = savedReviews ? JSON.parse(savedReviews) : [];
            reviews.push(review);
            setLocalStorage(`taruvae-reviews-${review.productId}`, JSON.stringify(reviews));
            dispatchStorageEvent(`taruvae-reviews-updated-${review.productId}`);
            return { success: true, message: 'Review saved to localStorage (Firebase not configured)' };
        }

        const reviewsRef = ref(db, `reviews/${review.productId}`);
        const snapshot = await get(reviewsRef);

        let reviews: ProductReview[] = [];
        if (snapshot.exists()) {
            const reviewsData = snapshot.val();
            reviews = Array.isArray(reviewsData) ? reviewsData : Object.values(reviewsData);
        }

        reviews.push(review);
        await set(reviewsRef, reviews);

        // Also save to localStorage as backup (SSR-SAFE)
        setLocalStorage(`taruvae-reviews-${review.productId}`, JSON.stringify(reviews));
        dispatchStorageEvent(`taruvae-reviews-updated-${review.productId}`);

        return { success: true, message: 'Review saved successfully' };
    } catch (error: any) {
        console.error('Error saving review to Firebase:', error);
        // Fallback to localStorage (SSR-SAFE)
        const savedReviews = getLocalStorage(`taruvae-reviews-${review.productId}`);
        const reviews = savedReviews ? JSON.parse(savedReviews) : [];
        reviews.push(review);
        setLocalStorage(`taruvae-reviews-${review.productId}`, JSON.stringify(reviews));
        dispatchStorageEvent(`taruvae-reviews-updated-${review.productId}`);
        return { success: false, message: error.message || 'Failed to save review' };
    }
}

// Get reviews for a product
export async function getProductReviewsFromFirebase(productId: number): Promise<ProductReview[]> {
    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback to localStorage (SSR-SAFE)
            const savedReviews = getLocalStorage(`taruvae-reviews-${productId}`);
            if (savedReviews) {
                return JSON.parse(savedReviews);
            }
            return [];
        }

        const reviewsRef = ref(db, `reviews/${productId}`);
        const snapshot = await get(reviewsRef);

        if (snapshot.exists()) {
            const reviewsData = snapshot.val();
            const reviews = Array.isArray(reviewsData) ? reviewsData : Object.values(reviewsData);
            // Sort by date (newest first)
            return reviews.sort((a: ProductReview, b: ProductReview) => b.createdAt - a.createdAt);
        }

        // If no reviews in Firebase, check localStorage (SSR-SAFE)
        const savedReviews = getLocalStorage(`taruvae-reviews-${productId}`);
        if (savedReviews) {
            return JSON.parse(savedReviews);
        }

        return [];
    } catch (error: any) {
        console.error('Error fetching reviews from Firebase:', error);
        // Fallback to localStorage (SSR-SAFE)
        const savedReviews = getLocalStorage(`taruvae-reviews-${productId}`);
        if (savedReviews) {
            return JSON.parse(savedReviews);
        }
        return [];
    }
}

// Subscribe to reviews for a product (client-only function)
export function subscribeToProductReviews(productId: number, callback: (reviews: ProductReview[]) => void): () => void {
    // SSR-SAFE: Only run on client
    if (!isBrowser) {
        callback([]);
        return () => { };
    }

    try {
        const db = firebaseDb;
        if (!db) {
            // Fallback: listen to localStorage changes
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === `taruvae-reviews-${productId}`) {
                    try {
                        const reviews = e.newValue ? JSON.parse(e.newValue) : [];
                        callback(reviews);
                    } catch (error) {
                        console.error('Error parsing reviews from storage event:', error);
                    }
                }
            };

            const handleCustomEvent = () => {
                try {
                    const savedReviews = getLocalStorage(`taruvae-reviews-${productId}`);
                    const reviews = savedReviews ? JSON.parse(savedReviews) : [];
                    callback(reviews);
                } catch (error) {
                    console.error('Error parsing reviews from custom event:', error);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener(`taruvae-reviews-updated-${productId}`, handleCustomEvent);

            // Load initial data
            const savedReviews = getLocalStorage(`taruvae-reviews-${productId}`);
            if (savedReviews) {
                try {
                    const reviews = JSON.parse(savedReviews);
                    callback(reviews);
                } catch (error) {
                    console.error('Error parsing initial reviews:', error);
                    callback([]);
                }
            } else {
                callback([]);
            }

            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener(`taruvae-reviews-updated-${productId}`, handleCustomEvent);
            };
        }

        const reviewsRef = ref(db, `reviews/${productId}`);

        const handleSnapshot = (snapshot: DataSnapshot) => {
            try {
                if (snapshot.exists()) {
                    const reviewsData = snapshot.val();
                    let reviews: ProductReview[];

                    if (Array.isArray(reviewsData)) {
                        reviews = reviewsData;
                    } else {
                        reviews = Object.values(reviewsData);
                    }

                    // Sort by date (newest first)
                    reviews.sort((a, b) => b.createdAt - a.createdAt);

                    // Also update localStorage as backup (SSR-SAFE)
                    setLocalStorage(`taruvae-reviews-${productId}`, JSON.stringify(reviews));
                    callback(reviews);
                } else {
                    // If no reviews in Firebase, check localStorage (SSR-SAFE)
                    const savedReviews = getLocalStorage(`taruvae-reviews-${productId}`);
                    if (savedReviews) {
                        try {
                            const reviews = JSON.parse(savedReviews);
                            callback(reviews);
                        } catch (error) {
                            console.error('Error parsing reviews from localStorage:', error);
                            callback([]);
                        }
                    } else {
                        callback([]);
                    }
                }
            } catch (error) {
                console.error('Error in reviews handleSnapshot:', error);
                callback([]);
            }
        };

        // Error handler for Firebase subscription
        const handleError = (error: Error | Event | unknown) => {
            const errorMessage = error instanceof Error
                ? error.message
                : error instanceof Event
                    ? `Event: ${error.type}`
                    : String(error);
            console.error('Firebase reviews subscription error:', errorMessage, error);
            callback([]);
        };

        // Set up real-time listener with error handler
        onValue(reviewsRef, handleSnapshot, handleError);

        // Return unsubscribe function
        return () => {
            try {
                off(reviewsRef);
            } catch {
                // Ignore cleanup errors
            }
        };
    } catch (error: any) {
        console.error('Error setting up reviews subscription:', error);
        return () => { };
    }
}
