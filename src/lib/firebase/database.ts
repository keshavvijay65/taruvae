import {
    ref,
    get,
    set,
    update,
    push,
    remove,
    onValue,
    off,
    query,
    limitToLast,
    orderByKey,
    DataSnapshot
} from 'firebase/database';
import { firebaseDb } from './config';

/**
 * Generic fetcher for RTDB paths
 */
export async function getFromDb<T>(path: string): Promise<T | null> {
    try {
        const snapshot = await get(ref(firebaseDb, path));
        return snapshot.exists() ? (snapshot.val() as T) : null;
    } catch (error) {
        console.error(`[FirebaseDB] Error fetching ${path}:`, error);
        return null;
    }
}

/**
 * Generic setter for RTDB paths
 */
export async function saveToDb<T>(path: string, data: T): Promise<{ success: boolean; error?: string }> {
    try {
        await set(ref(firebaseDb, path), data);
        return { success: true };
    } catch (error: any) {
        console.error(`[FirebaseDB] Error saving to ${path}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Optimized product fetch (paginated-style)
 */
export async function getRecentFromDb<T>(path: string, limit: number = 20): Promise<T[]> {
    try {
        const recentQuery = query(ref(firebaseDb, path), orderByKey(), limitToLast(limit));
        const snapshot = await get(recentQuery);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.values(data) as T[];
        }
        return [];
    } catch (error) {
        console.error(`[FirebaseDB] Pagination error for ${path}:`, error);
        return [];
    }
}

/**
 * Real-time listener helper
 */
export function listenToDb<T>(path: string, callback: (data: T | null) => void) {
    const dbRef = ref(firebaseDb, path);
    onValue(dbRef, (snapshot) => {
        callback(snapshot.exists() ? (snapshot.val() as T) : null);
    });
    return () => off(dbRef);
}
