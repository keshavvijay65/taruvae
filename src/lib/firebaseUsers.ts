import { ref, get, query, orderByChild } from 'firebase/database';
import { firebaseDb } from './firebase/config';
import { DbUser } from './authHelpers';

export interface UserDetails extends DbUser { }

// Get all users from Realtime Database
export async function getAllUsersFromFirebase(): Promise<UserDetails[]> {
    try {
        const db = firebaseDb;
        if (!db) {
            return getAllUsersFromLocalStorage();
        }

        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const users: UserDetails[] = Object.values(usersData);

            // Sort by lastLoginAt
            users.sort((a, b) => {
                const dateA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
                const dateB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
                return dateB - dateA;
            });

            // Sync to local storage
            if (typeof window !== 'undefined') {
                localStorage.setItem('taruvae-all-users', JSON.stringify(users));
            }

            return users;
        }

        return [];
    } catch (error) {
        console.warn('Error getting all users (RTDB):', error);
        return getAllUsersFromLocalStorage();
    }
}

// Get all users from localStorage
function getAllUsersFromLocalStorage(): UserDetails[] {
    try {
        if (typeof window === 'undefined') return [];

        // Check fallback data
        const users = JSON.parse(localStorage.getItem('taruvae-users-data') || '{}');
        return Object.values(users) as UserDetails[];
    } catch (error) {
        console.error('Error getting users from localStorage:', error);
        return [];
    }
}
