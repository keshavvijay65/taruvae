'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Address {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
    createdAt: string;
}

interface UserProfileContextType {
    addresses: Address[];
    addAddress: (address: Omit<Address, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
    updateAddress: (id: string, address: Partial<Address>) => Promise<{ success: boolean; message: string }>;
    deleteAddress: (id: string) => Promise<{ success: boolean; message: string }>;
    setDefaultAddress: (id: string) => Promise<{ success: boolean; message: string }>;
    getDefaultAddress: () => Address | null;
<<<<<<< HEAD
=======
    verifyPhone: (phone: string) => Promise<{ success: boolean; message: string; otp?: string }>;
    verifyEmail: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
>>>>>>> 5abc3959ee9218e068f1213a5e8b009a02a962d3
    loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    // Load user addresses when user logs in
    useEffect(() => {
        if (isAuthenticated && user) {
            loadAddresses();
        } else {
            setAddresses([]);
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    const loadAddresses = () => {
        if (!user) return;
        
        try {
            const userProfiles = JSON.parse(localStorage.getItem('taruvae-user-profiles') || '{}');
            const userProfile = userProfiles[user.id] || userProfiles[user.email] || {};
            setAddresses(userProfile.addresses || []);
        } catch (error) {
            console.error('Error loading addresses:', error);
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    };

    const saveUserProfile = (profileData: any) => {
        if (!user) return;
        
        const userProfiles = JSON.parse(localStorage.getItem('taruvae-user-profiles') || '{}');
        const userId = user.id || user.email;
        
        userProfiles[userId] = {
            ...userProfiles[userId],
            ...profileData,
            userId,
            lastUpdated: new Date().toISOString(),
        };
        
        localStorage.setItem('taruvae-user-profiles', JSON.stringify(userProfiles));
    };

    const addAddress = async (addressData: Omit<Address, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
        if (!user) {
            return { success: false, message: 'Please login to save address' };
        }

        try {
            const newAddress: Address = {
                ...addressData,
                id: `addr-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };

            // If this is the first address, make it default
            if (addresses.length === 0) {
                newAddress.isDefault = true;
            }

            // If this is set as default, remove default from others
            if (newAddress.isDefault) {
                addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }

            const updatedAddresses = [...addresses, newAddress];
            setAddresses(updatedAddresses);

            const userProfiles = JSON.parse(localStorage.getItem('taruvae-user-profiles') || '{}');
            const userId = user.id || user.email;
            userProfiles[userId] = {
                ...userProfiles[userId],
                addresses: updatedAddresses,
                userId,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem('taruvae-user-profiles', JSON.stringify(userProfiles));

            return { success: true, message: 'Address saved successfully!' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to save address' };
        }
    };

    const updateAddress = async (id: string, addressData: Partial<Address>): Promise<{ success: boolean; message: string }> => {
        if (!user) {
            return { success: false, message: 'Please login to update address' };
        }

        try {
            const updatedAddresses = addresses.map(addr => {
                if (addr.id === id) {
                    return { ...addr, ...addressData };
                }
                // If this address is being set as default, remove default from others
                if (addressData.isDefault && addr.id !== id) {
                    return { ...addr, isDefault: false };
                }
                return addr;
            });

            setAddresses(updatedAddresses);

            const userProfiles = JSON.parse(localStorage.getItem('taruvae-user-profiles') || '{}');
            const userId = user.id || user.email;
            userProfiles[userId] = {
                ...userProfiles[userId],
                addresses: updatedAddresses,
                userId,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem('taruvae-user-profiles', JSON.stringify(userProfiles));

            return { success: true, message: 'Address updated successfully!' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to update address' };
        }
    };

    const deleteAddress = async (id: string): Promise<{ success: boolean; message: string }> => {
        if (!user) {
            return { success: false, message: 'Please login to delete address' };
        }

        try {
            const addressToDelete = addresses.find(addr => addr.id === id);
            const updatedAddresses = addresses.filter(addr => addr.id !== id);

            // If deleted address was default, make first address default
            if (addressToDelete?.isDefault && updatedAddresses.length > 0) {
                updatedAddresses[0].isDefault = true;
            }

            setAddresses(updatedAddresses);

            const userProfiles = JSON.parse(localStorage.getItem('taruvae-user-profiles') || '{}');
            const userId = user.id || user.email;
            userProfiles[userId] = {
                ...userProfiles[userId],
                addresses: updatedAddresses,
                userId,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem('taruvae-user-profiles', JSON.stringify(userProfiles));

            return { success: true, message: 'Address deleted successfully!' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to delete address' };
        }
    };

    const setDefaultAddress = async (id: string): Promise<{ success: boolean; message: string }> => {
        return updateAddress(id, { isDefault: true });
    };

    const getDefaultAddress = (): Address | null => {
        return addresses.find(addr => addr.isDefault) || addresses[0] || null;
    };

<<<<<<< HEAD
=======
    // Simple OTP verification (for demo - in production, use SMS/Email service)
    const verifyPhone = async (phone: string): Promise<{ success: boolean; message: string; otp?: string }> => {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in localStorage with expiration (5 minutes)
        const otpData = {
            phone,
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        };
        
        const otps = JSON.parse(localStorage.getItem('taruvae-otps') || '[]');
        otps.push(otpData);
        localStorage.setItem('taruvae-otps', JSON.stringify(otps));

        // In production, send OTP via SMS service
        // For now, we'll return it (in production, don't return OTP)
        return {
            success: true,
            message: `OTP sent to ${phone}. For demo: OTP is ${otp}`,
            otp, // Remove this in production
        };
    };

    const verifyEmail = async (email: string): Promise<{ success: boolean; message: string; otp?: string }> => {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in localStorage with expiration (5 minutes)
        const otpData = {
            email,
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        };
        
        const otps = JSON.parse(localStorage.getItem('taruvae-otps') || '[]');
        otps.push(otpData);
        localStorage.setItem('taruvae-otps', JSON.stringify(otps));

        // In production, send OTP via Email service
        // For now, we'll return it (in production, don't return OTP)
        return {
            success: true,
            message: `OTP sent to ${email}. For demo: OTP is ${otp}`,
            otp, // Remove this in production
        };
    };

>>>>>>> 5abc3959ee9218e068f1213a5e8b009a02a962d3
    return (
        <UserProfileContext.Provider
            value={{
                addresses,
                addAddress,
                updateAddress,
                deleteAddress,
                setDefaultAddress,
                getDefaultAddress,
<<<<<<< HEAD
=======
                verifyPhone,
                verifyEmail,
>>>>>>> 5abc3959ee9218e068f1213a5e8b009a02a962d3
                loading,
            }}
        >
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
}

