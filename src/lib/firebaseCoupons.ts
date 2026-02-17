export interface Coupon {
    id: string;
    code: string; // Uppercase coupon code
    type: 'percentage' | 'fixed'; // Percentage discount or fixed amount
    value: number; // Discount value (percentage or amount)
    minAmount?: number; // Minimum order amount to apply coupon
    maxDiscount?: number; // Maximum discount amount (for percentage coupons)
    validFrom: string; // ISO date string
    validUntil: string; // ISO date string
    usageLimit?: number; // Total usage limit (optional)
    usedCount?: number; // Current usage count
    isActive: boolean; // Whether coupon is active
    showOnHome?: boolean; // Whether to show on the home page banner
    showOnCheckout?: boolean; // Whether to suggest on the checkout page
    description?: string; // Coupon description
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

import { ref, set, get, onValue, off, DataSnapshot, remove } from 'firebase/database';
import { getFirebaseDatabase } from './firebase';

// Helper to check if we're in browser environment
function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Helper function to remove undefined values
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

// Save coupons to Firebase
export async function saveCouponsToFirebase(coupons: Coupon[]): Promise<{ success: boolean; message: string }> {
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            // Fallback to localStorage (only in browser)
            if (isBrowser()) {
                localStorage.setItem('taruvae-admin-coupons', JSON.stringify(coupons));
                window.dispatchEvent(new Event('taruvae-coupons-updated'));
                return { success: true, message: 'Coupons saved to local storage' };
            }
            return { success: false, message: 'Firebase not configured and not in browser environment' };
        }

        const couponsRef = ref(db, 'coupons');
        const cleanedCoupons = removeUndefinedValues(coupons);

        // Convert array to object with coupon IDs as keys (Firebase-friendly format)
        const couponsObject: Record<string, Coupon> = {};
        cleanedCoupons.forEach(coupon => {
            if (coupon.id) {
                couponsObject[coupon.id] = coupon;
            }
        });

        await set(couponsRef, couponsObject);

        // Also save to localStorage as backup (only in browser)
        if (isBrowser()) {
            localStorage.setItem('taruvae-admin-coupons', JSON.stringify(coupons));
            window.dispatchEvent(new Event('taruvae-coupons-updated'));
        }

        return { success: true, message: 'Coupons saved successfully' };
    } catch (error: any) {
        console.error('Error saving coupons to Firebase:', error);
        // Fallback to localStorage (only in browser)
        if (isBrowser()) {
            try {
                localStorage.setItem('taruvae-admin-coupons', JSON.stringify(coupons));
                window.dispatchEvent(new Event('taruvae-coupons-updated'));
                return { success: true, message: 'Coupons saved to local storage (Firebase error)' };
            } catch (localError) {
                return { success: false, message: 'Failed to save coupons' };
            }
        }
        return { success: false, message: 'Failed to save coupons' };
    }
}

// Get coupons from Firebase
export async function getCouponsFromFirebase(): Promise<Coupon[]> {
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            console.warn('[FirebaseCoupons] Database not available, trying localStorage fallback');
            // Fallback to localStorage (only in browser)
            if (isBrowser()) {
                const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                if (localCoupons) {
                    console.log('[FirebaseCoupons] Using localStorage fallback, found', JSON.parse(localCoupons).length, 'coupons');
                    return JSON.parse(localCoupons);
                }
            }
            console.warn('[FirebaseCoupons] No database and no localStorage, returning empty array');
            return [];
        }

        const couponsRef = ref(db, 'coupons');
        let snapshot: DataSnapshot;
        try {
            snapshot = await get(couponsRef);
        } catch (error) {
            // If Firebase is offline or fails, fallback to localStorage
            console.warn('Firebase get failed, using localStorage:', error);
            if (isBrowser()) {
                const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                return localCoupons ? JSON.parse(localCoupons) : [];
            }
            return [];
        }

        if (snapshot.exists()) {
            const couponsData = snapshot.val();
            let coupons: Coupon[] = [];

            // Handle both array and object formats from Firebase
            if (Array.isArray(couponsData)) {
                // If it's an array, use it directly
                coupons = couponsData;
            } else if (typeof couponsData === 'object' && couponsData !== null) {
                // Convert object to array (Firebase stores as object with IDs as keys)
                coupons = Object.keys(couponsData).map(key => {
                    const coupon = couponsData[key];
                    // Ensure coupon has an id (use key if missing)
                    return {
                        id: coupon?.id || key,
                        ...coupon,
                    };
                }).filter(c => c && typeof c === 'object'); // Filter out null/undefined
            }

            console.log('[FirebaseCoupons] Fetched', coupons.length, 'coupons from Firebase:', coupons.map(c => c?.code || 'NO_CODE'));

            // Also save to localStorage as backup (only in browser)
            if (isBrowser()) {
                localStorage.setItem('taruvae-admin-coupons', JSON.stringify(coupons));
            }

            return coupons;
        } else {
            console.warn('[FirebaseCoupons] No coupons found in Firebase, checking localStorage');
            // Check localStorage as fallback (only in browser)
            if (isBrowser()) {
                const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                if (localCoupons) {
                    const parsed = JSON.parse(localCoupons);
                    console.log('[FirebaseCoupons] Found', parsed.length, 'coupons in localStorage');
                    return parsed;
                }
            }
            console.warn('[FirebaseCoupons] No coupons found in Firebase or localStorage');
            return [];
        }
    } catch (error: any) {
        console.error('Error fetching coupons from Firebase:', error);
        // Fallback to localStorage (only in browser)
        if (isBrowser()) {
            const localCoupons = localStorage.getItem('taruvae-admin-coupons');
            return localCoupons ? JSON.parse(localCoupons) : [];
        }
        return [];
    }
}

// Subscribe to coupons changes
export function subscribeToCoupons(callback: (coupons: Coupon[]) => void): () => void {
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            // Fallback to localStorage (only in browser)
            if (isBrowser()) {
                const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                const coupons = localCoupons ? JSON.parse(localCoupons) : [];
                callback(coupons);

                const handleStorageChange = () => {
                    const updatedCoupons = localStorage.getItem('taruvae-admin-coupons');
                    if (updatedCoupons) {
                        callback(JSON.parse(updatedCoupons));
                    }
                };
                window.addEventListener('taruvae-coupons-updated', handleStorageChange);
                return () => window.removeEventListener('taruvae-coupons-updated', handleStorageChange);
            }
            callback([]);
            return () => { };
        }

        const couponsRef = ref(db, 'coupons');

        const handleSnapshot = (snapshot: DataSnapshot) => {
            try {
                if (snapshot.exists()) {
                    const couponsData = snapshot.val();
                    let coupons: Coupon[] = [];

                    // Handle both array and object formats from Firebase
                    if (Array.isArray(couponsData)) {
                        coupons = couponsData;
                    } else if (typeof couponsData === 'object' && couponsData !== null) {
                        // Convert object to array (Firebase stores as object with IDs as keys)
                        coupons = Object.keys(couponsData).map(key => {
                            const coupon = couponsData[key];
                            return {
                                id: coupon?.id || key,
                                ...coupon,
                            };
                        }).filter(c => c && typeof c === 'object');
                    }

                    // Save to localStorage as backup (only in browser)
                    if (isBrowser()) {
                        localStorage.setItem('taruvae-admin-coupons', JSON.stringify(coupons));
                    }
                    callback(coupons);
                } else {
                    // Check localStorage if Firebase has no data
                    if (isBrowser()) {
                        const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                        callback(localCoupons ? JSON.parse(localCoupons) : []);
                    } else {
                        callback([]);
                    }
                }
            } catch (error) {
                console.error('Error in handleSnapshot:', error);
                // Fallback to localStorage on error
                if (isBrowser()) {
                    try {
                        const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                        callback(localCoupons ? JSON.parse(localCoupons) : []);
                    } catch (localError) {
                        callback([]);
                    }
                } else {
                    callback([]);
                }
            }
        };

        // Set up listener with error handling
        try {
            onValue(couponsRef, handleSnapshot, (error: Error | Event | unknown) => {
                const errorMessage = error instanceof Error
                    ? error.message
                    : error instanceof Event
                        ? `Event: ${error.type}`
                        : String(error);
                console.error('Firebase subscription error:', errorMessage, error);
                // Fallback to localStorage on subscription error
                if (isBrowser()) {
                    try {
                        const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                        callback(localCoupons ? JSON.parse(localCoupons) : []);
                    } catch (localError) {
                        callback([]);
                    }
                } else {
                    callback([]);
                }
            });
        } catch (onValueError) {
            console.error('Error setting up onValue listener:', onValueError);
            // Fallback to localStorage
            if (isBrowser()) {
                try {
                    const localCoupons = localStorage.getItem('taruvae-admin-coupons');
                    callback(localCoupons ? JSON.parse(localCoupons) : []);
                } catch (localError) {
                    callback([]);
                }
            } else {
                callback([]);
            }
        }

        // Return unsubscribe function
        return () => {
            off(couponsRef, 'value', handleSnapshot);
        };
    } catch (error: any) {
        console.warn('Error subscribing to coupons:', error);
        // Fallback to localStorage (only in browser)
        if (isBrowser()) {
            const coupons = localStorage.getItem('taruvae-coupons');
            if (coupons) {
                callback(JSON.parse(coupons));
            } else {
                callback([]);
            }
        } else {
            callback([]);
        }
        return () => { }; // Empty unsubscribe function
    }
}

// Validate coupon
export async function validateCoupon(code: string, orderAmount: number): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    error?: string;
}> {
    try {
        const coupons = await getCouponsFromFirebase();
        // Normalize coupon code: trim, uppercase, remove any special characters/spaces
        const couponCode = code.trim().toUpperCase().replace(/\s+/g, '');

        console.log('Validating coupon:', {
            code: couponCode,
            orderAmount,
            totalCoupons: coupons.length,
            couponCodes: coupons.map(c => c.code),
            allCoupons: coupons
        });

        // Find coupon by code - more robust comparison
        const coupon = coupons.find(c => {
            const storedCode = (c.code || '').trim().toUpperCase().replace(/\s+/g, '');
            return storedCode === couponCode;
        });

        if (!coupon) {
            console.log('Coupon not found:', {
                searchedCode: couponCode,
                availableCodes: coupons.map(c => (c.code || '').trim().toUpperCase())
            });
            return { valid: false, error: `Coupon code "${couponCode}" not found` };
        }

        console.log('Coupon found:', {
            code: coupon.code,
            isActive: coupon.isActive,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            minAmount: coupon.minAmount,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount
        });

        // Check if coupon is active
        if (!coupon.isActive) {
            return { valid: false, error: 'This coupon is not active' };
        }

        // Check validity dates
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now < validFrom) {
            return { valid: false, error: `This coupon will be valid from ${validFrom.toLocaleDateString('en-IN')}` };
        }

        if (now > validUntil) {
            return { valid: false, error: `This coupon expired on ${validUntil.toLocaleDateString('en-IN')}` };
        }

        // Check minimum order amount
        if (coupon.minAmount && orderAmount < coupon.minAmount) {
            return {
                valid: false,
                error: `Minimum order amount of ₹${coupon.minAmount} required. Your order is ₹${orderAmount}`,
            };
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usageLimit > 0) {
            const usedCount = coupon.usedCount || 0;
            if (usedCount >= coupon.usageLimit) {
                return { valid: false, error: 'This coupon has reached its usage limit' };
            }
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = Math.round((orderAmount * coupon.value) / 100);
            // Apply max discount limit if set
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            // Fixed amount
            discount = coupon.value;
            // Don't allow discount more than order amount
            if (discount > orderAmount) {
                discount = orderAmount;
            }
        }

        console.log('Coupon validated successfully:', {
            code: coupon.code,
            discount
        });

        return {
            valid: true,
            coupon,
            discount,
        };
    } catch (error: any) {
        console.error('Error validating coupon:', error);
        return { valid: false, error: `Failed to validate coupon: ${error.message || 'Unknown error'}` };
    }
}

// Increment coupon usage count
export async function incrementCouponUsage(couponId: string): Promise<void> {
    try {
        const coupons = await getCouponsFromFirebase();
        const couponIndex = coupons.findIndex(c => c.id === couponId);

        if (couponIndex !== -1) {
            coupons[couponIndex].usedCount = (coupons[couponIndex].usedCount || 0) + 1;
            coupons[couponIndex].updatedAt = new Date().toISOString();
            await saveCouponsToFirebase(coupons);
        }
    } catch (error: any) {
        console.error('Error incrementing coupon usage:', error);
    }
}

