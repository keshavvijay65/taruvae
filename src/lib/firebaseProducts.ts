import { ref, set, get, onValue, off, DataSnapshot } from 'firebase/database';
import { database } from './firebase';
import { Product } from '@/context/CartContext';

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
        return () => {};
    }
}

