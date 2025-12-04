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
}


import { ref, set, get, onValue, off, DataSnapshot } from 'firebase/database';
import { database } from './firebase';


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
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Fallback to localStorage
            localStorage.setItem('taruvae-admin-products', JSON.stringify(products));
            window.dispatchEvent(new Event('taruvae-products-updated'));
            return { success: true, message: 'Products saved to localStorage (Firebase not configured)' };
        }

        // Clean products by removing undefined values (Firebase doesn't allow undefined)
        const cleanedProducts = removeUndefinedValues(products);

        const productsRef = ref(database, 'products');
        await set(productsRef, cleanedProducts);

        // Also save to localStorage as backup
        localStorage.setItem('taruvae-admin-products', JSON.stringify(products));
        window.dispatchEvent(new Event('taruvae-products-updated'));

        return { success: true, message: 'Products saved to Firebase successfully' };
    } catch (error: any) {
        console.error('Error saving products to Firebase:', error);
        // Fallback to localStorage
        localStorage.setItem('taruvae-admin-products', JSON.stringify(products));
        window.dispatchEvent(new Event('taruvae-products-updated'));
        return { success: false, message: error.message || 'Failed to save products to Firebase' };
    }
}

// Get all products from Firebase
export async function getAllProductsFromFirebase(): Promise<Product[]> {
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Fallback to localStorage
            const savedProducts = localStorage.getItem('taruvae-admin-products');
            if (savedProducts) {
                return JSON.parse(savedProducts);
            }
            return [];
        }

        const productsRef = ref(database, 'products');
        const snapshot = await get(productsRef);

        if (snapshot.exists()) {
            const productsData = snapshot.val();
            // If it's an array, return it directly
            if (Array.isArray(productsData)) {
                return productsData;
            }
            // If it's an object, convert to array
            return Object.values(productsData);
        }

        // If no products in Firebase, check localStorage
        const savedProducts = localStorage.getItem('taruvae-admin-products');
        if (savedProducts) {
            return JSON.parse(savedProducts);
        }

        return [];
    } catch (error: any) {
        console.error('Error fetching products from Firebase:', error);
        // Fallback to localStorage
        const savedProducts = localStorage.getItem('taruvae-admin-products');
        if (savedProducts) {
            return JSON.parse(savedProducts);
        }
        return [];
    }
}

// Listen to products in real-time
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
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
                    const savedProducts = localStorage.getItem('taruvae-admin-products');
                    const products = savedProducts ? JSON.parse(savedProducts) : [];
                    callback(products);
                } catch (error) {
                    console.error('Error parsing products from custom event:', error);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('taruvae-products-updated', handleCustomEvent);

            // Load initial data
            const savedProducts = localStorage.getItem('taruvae-admin-products');
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

        const productsRef = ref(database, 'products');

        const handleSnapshot = (snapshot: DataSnapshot) => {
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
                localStorage.setItem('taruvae-admin-products', JSON.stringify(products));
                callback(products);
            } else {
                // If no products in Firebase, check localStorage
                const savedProducts = localStorage.getItem('taruvae-admin-products');
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
        };

        // Set up real-time listener
        onValue(productsRef, handleSnapshot);

        // Return unsubscribe function
        return () => {
            off(productsRef);
        };
    } catch (error: any) {
        console.error('Error setting up products subscription:', error);
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
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Fallback to localStorage
            localStorage.setItem('taruvae-categories', JSON.stringify(categories));
            window.dispatchEvent(new Event('taruvae-categories-updated'));
            return { success: true, message: 'Categories saved to localStorage (Firebase not configured)' };
        }

        const categoriesRef = ref(database, 'categories');
        await set(categoriesRef, categories);

        // Also save to localStorage as backup
        localStorage.setItem('taruvae-categories', JSON.stringify(categories));
        window.dispatchEvent(new Event('taruvae-categories-updated'));

        return { success: true, message: 'Categories saved to Firebase successfully' };
    } catch (error: any) {
        console.error('Error saving categories to Firebase:', error);
        // Fallback to localStorage
        localStorage.setItem('taruvae-categories', JSON.stringify(categories));
        window.dispatchEvent(new Event('taruvae-categories-updated'));
        return { success: false, message: error.message || 'Failed to save categories to Firebase' };
    }
}

// Get all categories from Firebase
export async function getAllCategoriesFromFirebase(): Promise<Category[]> {
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Fallback to localStorage
            const savedCategories = localStorage.getItem('taruvae-categories');
            if (savedCategories) {
                return JSON.parse(savedCategories);
            }
            // Return default categories if nothing in localStorage
            return DEFAULT_CATEGORIES;
        }

        const categoriesRef = ref(database, 'categories');
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
        const savedCategories = localStorage.getItem('taruvae-categories');
        if (savedCategories) {
            return JSON.parse(savedCategories);
        }

        // Return default categories
        return DEFAULT_CATEGORIES;
    } catch (error: any) {
        console.error('Error fetching categories from Firebase:', error);
        // Fallback to localStorage
        const savedCategories = localStorage.getItem('taruvae-categories');
        if (savedCategories) {
            return JSON.parse(savedCategories);
        }
        return DEFAULT_CATEGORIES;
    }
}

// Listen to categories in real-time
export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
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
                    const savedCategories = localStorage.getItem('taruvae-categories');
                    const categories = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
                    callback(categories);
                } catch (error) {
                    console.error('Error parsing categories from custom event:', error);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('taruvae-categories-updated', handleCustomEvent);

            // Load initial data
            const savedCategories = localStorage.getItem('taruvae-categories');
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

        const categoriesRef = ref(database, 'categories');

        const handleSnapshot = (snapshot: DataSnapshot) => {
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
                localStorage.setItem('taruvae-categories', JSON.stringify(categories));
                callback(categories);
            } else {
                // If no categories in Firebase, check localStorage
                const savedCategories = localStorage.getItem('taruvae-categories');
                if (savedCategories) {
                    try {
                        const categories = JSON.parse(savedCategories);
                        callback(categories);
                    } catch (error) {
                        console.error('Error parsing categories from localStorage:', error);
                        callback(DEFAULT_CATEGORIES);
                    }
                } else {
                    callback(DEFAULT_CATEGORIES);
                }
            }
        };

        // Set up real-time listener
        onValue(categoriesRef, handleSnapshot);

        // Return unsubscribe function
        return () => {
            off(categoriesRef);
        };
    } catch (error: any) {
        console.error('Error setting up categories subscription:', error);
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
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Fallback to localStorage
            const savedReviews = localStorage.getItem(`taruvae-reviews-${review.productId}`);
            const reviews = savedReviews ? JSON.parse(savedReviews) : [];
            reviews.push(review);
            localStorage.setItem(`taruvae-reviews-${review.productId}`, JSON.stringify(reviews));
            window.dispatchEvent(new Event(`taruvae-reviews-updated-${review.productId}`));
            return { success: true, message: 'Review saved to localStorage (Firebase not configured)' };
        }

        const reviewsRef = ref(database, `reviews/${review.productId}`);
        const snapshot = await get(reviewsRef);

        let reviews: ProductReview[] = [];
        if (snapshot.exists()) {
            const reviewsData = snapshot.val();
            reviews = Array.isArray(reviewsData) ? reviewsData : Object.values(reviewsData);
        }

        reviews.push(review);
        await set(reviewsRef, reviews);

        // Also save to localStorage as backup
        localStorage.setItem(`taruvae-reviews-${review.productId}`, JSON.stringify(reviews));
        window.dispatchEvent(new Event(`taruvae-reviews-updated-${review.productId}`));

        return { success: true, message: 'Review saved successfully' };
    } catch (error: any) {
        console.error('Error saving review to Firebase:', error);
        // Fallback to localStorage
        const savedReviews = localStorage.getItem(`taruvae-reviews-${review.productId}`);
        const reviews = savedReviews ? JSON.parse(savedReviews) : [];
        reviews.push(review);
        localStorage.setItem(`taruvae-reviews-${review.productId}`, JSON.stringify(reviews));
        window.dispatchEvent(new Event(`taruvae-reviews-updated-${review.productId}`));
        return { success: false, message: error.message || 'Failed to save review' };
    }
}

// Get reviews for a product
export async function getProductReviewsFromFirebase(productId: number): Promise<ProductReview[]> {
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Fallback to localStorage
            const savedReviews = localStorage.getItem(`taruvae-reviews-${productId}`);
            if (savedReviews) {
                return JSON.parse(savedReviews);
            }
            return [];
        }

        const reviewsRef = ref(database, `reviews/${productId}`);
        const snapshot = await get(reviewsRef);

        if (snapshot.exists()) {
            const reviewsData = snapshot.val();
            const reviews = Array.isArray(reviewsData) ? reviewsData : Object.values(reviewsData);
            // Sort by date (newest first)
            return reviews.sort((a: ProductReview, b: ProductReview) => b.createdAt - a.createdAt);
        }

        // If no reviews in Firebase, check localStorage
        const savedReviews = localStorage.getItem(`taruvae-reviews-${productId}`);
        if (savedReviews) {
            return JSON.parse(savedReviews);
        }

        return [];
    } catch (error: any) {
        console.error('Error fetching reviews from Firebase:', error);
        // Fallback to localStorage
        const savedReviews = localStorage.getItem(`taruvae-reviews-${productId}`);
        if (savedReviews) {
            return JSON.parse(savedReviews);
        }
        return [];
    }
}

// Subscribe to reviews for a product
export function subscribeToProductReviews(productId: number, callback: (reviews: ProductReview[]) => void): () => void {
    try {
        // Check if database is properly initialized
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
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
                    const savedReviews = localStorage.getItem(`taruvae-reviews-${productId}`);
                    const reviews = savedReviews ? JSON.parse(savedReviews) : [];
                    callback(reviews);
                } catch (error) {
                    console.error('Error parsing reviews from custom event:', error);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener(`taruvae-reviews-updated-${productId}`, handleCustomEvent);

            // Load initial data
            const savedReviews = localStorage.getItem(`taruvae-reviews-${productId}`);
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

        const reviewsRef = ref(database, `reviews/${productId}`);

        const handleSnapshot = (snapshot: DataSnapshot) => {
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

                // Also update localStorage as backup
                localStorage.setItem(`taruvae-reviews-${productId}`, JSON.stringify(reviews));
                callback(reviews);
            } else {
                // If no reviews in Firebase, check localStorage
                const savedReviews = localStorage.getItem(`taruvae-reviews-${productId}`);
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
        };

        // Set up real-time listener
        onValue(reviewsRef, handleSnapshot);

        // Return unsubscribe function
        return () => {
            off(reviewsRef);
        };
    } catch (error: any) {
        console.error('Error setting up reviews subscription:', error);
        return () => { };
    }
}

