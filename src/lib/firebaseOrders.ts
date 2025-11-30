import { ref, set, get, onValue, off, push, update, remove, DataSnapshot } from 'firebase/database';
import { database } from './firebase';

// User Profile Interface
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    provider?: 'email' | 'google';
    photoURL?: string;
    lastLogin?: string;
}

export interface Order {
    orderId: string;
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
        id: number;
        name: string;
        price: number;
        quantity: number;
        total: number;
        image?: string;
    }>;
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    orderDate: string;
    status?: string;
    trackingNumber?: string;
    statusHistory?: Array<{
        status: string;
        date: string;
        message: string;
    }>;
    userId?: string | null;
}

// Save order to Firebase
export async function saveOrderToFirebase(order: Order): Promise<{ success: boolean; message: string }> {
    try {
        // Check if database is properly initialized
        if (!database || typeof database === 'object' && Object.keys(database).length === 0) {
            // Fallback to localStorage
            const existingOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
            const orderIndex = existingOrders.findIndex((o: Order) => o.orderId === order.orderId);
            if (orderIndex >= 0) {
                existingOrders[orderIndex] = order;
            } else {
                existingOrders.push(order);
            }
            localStorage.setItem('taruvae-orders', JSON.stringify(existingOrders));
            return { success: true, message: 'Order saved to localStorage (Firebase not configured)' };
        }

        const orderRef = ref(database, `orders/${order.orderId}`);
        await set(orderRef, order);
        
        // Also save to localStorage as backup
        const existingOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        const orderIndex = existingOrders.findIndex((o: Order) => o.orderId === order.orderId);
        if (orderIndex >= 0) {
            existingOrders[orderIndex] = order;
        } else {
            existingOrders.push(order);
        }
        localStorage.setItem('taruvae-orders', JSON.stringify(existingOrders));
        
        return { success: true, message: 'Order saved to Firebase successfully' };
    } catch (error: any) {
        console.error('Error saving order to Firebase:', error);
        // Fallback to localStorage
        const existingOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        existingOrders.push(order);
        localStorage.setItem('taruvae-orders', JSON.stringify(existingOrders));
        return { success: false, message: error.message || 'Failed to save order to Firebase' };
    }
}

// Get all orders from Firebase
export async function getAllOrdersFromFirebase(): Promise<Order[]> {
    try {
        // Check if database is properly initialized
        if (!database || typeof database === 'object' && Object.keys(database).length === 0) {
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        }

        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersArray: Order[] = Object.values(ordersData);
            return ordersArray;
        }
        
        return [];
    } catch (error: any) {
        console.error('Error fetching orders from Firebase:', error);
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
    }
}

// Listen to orders in real-time
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
    // Check if database is properly initialized
    if (!database || typeof database === 'object' && Object.keys(database).length === 0) {
        // Fallback: use localStorage and call callback once
        const orders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        callback(orders);
        return () => {}; // Return empty unsubscribe function
    }

    const ordersRef = ref(database, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersArray: Order[] = Object.values(ordersData);
            callback(ordersArray);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error('Error listening to orders:', error);
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        callback(orders);
    });

    return () => {
        off(ordersRef);
        unsubscribe();
    };
}

// Update order status in Firebase
export async function updateOrderStatusInFirebase(
    orderId: string, 
    newStatus: string, 
    message?: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Check if database is properly initialized
        if (!database || typeof database === 'object' && Object.keys(database).length === 0) {
            // Fallback to localStorage
            const orders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
            const orderIndex = orders.findIndex((o: Order) => o.orderId === orderId);
            if (orderIndex >= 0) {
                orders[orderIndex].status = newStatus;
                if (!orders[orderIndex].statusHistory) {
                    orders[orderIndex].statusHistory = [];
                }
                orders[orderIndex].statusHistory!.push({
                    status: newStatus,
                    date: new Date().toISOString(),
                    message: message || `Order status updated to ${newStatus}`,
                });
                localStorage.setItem('taruvae-orders', JSON.stringify(orders));
            }
            return { success: true, message: 'Order status updated in localStorage' };
        }

        const orderRef = ref(database, `orders/${orderId}`);
        const snapshot = await get(orderRef);
        
        if (snapshot.exists()) {
            const order = snapshot.val() as Order;
            const updatedOrder = {
                ...order,
                status: newStatus,
                statusHistory: [
                    ...(order.statusHistory || []),
                    {
                        status: newStatus,
                        date: new Date().toISOString(),
                        message: message || `Order status updated to ${newStatus}`,
                    },
                ],
            };
            
            await update(orderRef, updatedOrder);
            
            // Also update localStorage
            const orders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
            const orderIndex = orders.findIndex((o: Order) => o.orderId === orderId);
            if (orderIndex >= 0) {
                orders[orderIndex] = updatedOrder;
                localStorage.setItem('taruvae-orders', JSON.stringify(orders));
            }
            
            return { success: true, message: 'Order status updated successfully' };
        }
        
        return { success: false, message: 'Order not found' };
    } catch (error: any) {
        console.error('Error updating order status:', error);
        return { success: false, message: error.message || 'Failed to update order status' };
    }
}

// Get unique customers from orders
export async function getCustomersFromFirebase(): Promise<Array<{
    email: string;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    isRegisteredOnly: boolean; // true if user is registered but hasn't placed any orders
}>> {
    try {
        let orders: Order[] = [];
        
        // Try to get from Firebase first
        try {
            const firebaseOrders = await getAllOrdersFromFirebase();
            if (firebaseOrders && firebaseOrders.length > 0) {
                orders = firebaseOrders;
            }
        } catch (error) {
            console.log('Firebase not available, using localStorage');
        }
        
        // Always merge with localStorage orders to ensure we have all orders
        const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        
        // Merge orders, avoiding duplicates by orderId
        const orderMap = new Map<string, Order>();
        
        // Add Firebase orders first
        orders.forEach(order => {
            if (order.orderId) {
                orderMap.set(order.orderId, order);
            }
        });
        
        // Add localStorage orders (will overwrite if same orderId, but that's fine)
        localOrders.forEach(order => {
            if (order.orderId) {
                orderMap.set(order.orderId, order);
            }
        });
        
        // Convert back to array
        orders = Array.from(orderMap.values());
        
        console.log(`Total orders found: ${orders.length} (Firebase: ${orders.length - localOrders.length}, Local: ${localOrders.length})`);
        
        // Group by customer email from orders
        const customerMap = new Map<string, {
            email: string;
            name: string;
            phone: string;
            orders: Order[];
        }>();

        orders.forEach(order => {
            if (!order.customer || !order.customer.email) {
                console.warn('Order missing customer data:', order.orderId);
                return;
            }
            
            const email = order.customer.email.toLowerCase().trim();
            if (!email) {
                console.warn('Order missing email:', order.orderId);
                return;
            }
            
            const customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Guest Customer';
            
            if (!customerMap.has(email)) {
                customerMap.set(email, {
                    email: order.customer.email,
                    name: customerName,
                    phone: order.customer.phone || 'N/A',
                    orders: [],
                });
            }
            customerMap.get(email)!.orders.push(order);
        });

        // Also add registered users who haven't placed orders yet
        try {
            // Get localStorage users
            const localUsers = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
            localUsers.forEach((user: any) => {
                if (user.email) {
                    const email = user.email.toLowerCase().trim();
                    if (!email) return;
                    
                    if (!customerMap.has(email)) {
                        customerMap.set(email, {
                            email: user.email,
                            name: user.name || 'Guest Customer',
                            phone: user.phone || 'N/A',
                            orders: [],
                        });
                    }
                }
            });

            // Get Firebase email users
            const emailUsers = JSON.parse(localStorage.getItem('taruvae-email-users') || '[]');
            emailUsers.forEach((user: any) => {
                // Try to find email from Firebase auth or other sources
                // For now, we'll rely on orders for Firebase users
            });

            // Get currently logged in users from localStorage
            const currentUser = localStorage.getItem('taruvae-user');
            if (currentUser) {
                try {
                    const userData = JSON.parse(currentUser);
                    if (userData.email) {
                        const email = userData.email.toLowerCase().trim();
                        if (email && !customerMap.has(email)) {
                            customerMap.set(email, {
                                email: userData.email,
                                name: userData.name || 'Guest Customer',
                                phone: userData.phone || 'N/A',
                                orders: [],
                            });
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        } catch (error) {
            console.warn('Error loading registered users:', error);
        }

        // Convert to array with stats
        const customers = Array.from(customerMap.values()).map(customer => ({
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            totalOrders: customer.orders.length,
            totalSpent: customer.orders.reduce((sum, order) => sum + (order.total || 0), 0),
            lastOrderDate: customer.orders.length > 0 
                ? customer.orders.sort((a, b) => 
                    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                )[0].orderDate
                : customer.orders.length > 0 ? customer.orders[0].orderDate : new Date().toISOString(),
            isRegisteredOnly: customer.orders.length === 0, // true if no orders placed
        }));
        
        console.log(`Total customers found: ${customers.length} (with orders: ${customers.filter(c => c.totalOrders > 0).length}, without orders: ${customers.filter(c => c.totalOrders === 0).length})`);
        return customers;
    } catch (error: any) {
        console.error('Error getting customers:', error);
        // Fallback to localStorage only
        try {
            const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
            console.log(`Fallback: Loading ${localOrders.length} orders from localStorage`);
            
            const customerMap = new Map<string, {
                email: string;
                name: string;
                phone: string;
                orders: Order[];
            }>();

            localOrders.forEach(order => {
                if (!order.customer || !order.customer.email) {
                    console.warn('Order missing customer data:', order.orderId);
                    return;
                }
                
                const email = order.customer.email.toLowerCase().trim();
                if (!email) {
                    console.warn('Order missing email:', order.orderId);
                    return;
                }
                
                const customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Guest Customer';
                
                if (!customerMap.has(email)) {
                    customerMap.set(email, {
                        email: order.customer.email,
                        name: customerName,
                        phone: order.customer.phone || 'N/A',
                        orders: [],
                    });
                }
                customerMap.get(email)!.orders.push(order);
            });

            // Also add registered users who haven't placed orders
            try {
                const localUsers = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
                localUsers.forEach((user: any) => {
                    if (user.email) {
                        const email = user.email.toLowerCase().trim();
                        if (!email) return;
                        
                        if (!customerMap.has(email)) {
                            customerMap.set(email, {
                                email: user.email,
                                name: user.name || 'Guest Customer',
                                phone: user.phone || 'N/A',
                                orders: [],
                            });
                        }
                    }
                });

                const currentUser = localStorage.getItem('taruvae-user');
                if (currentUser) {
                    try {
                        const userData = JSON.parse(currentUser);
                        if (userData.email) {
                            const email = userData.email.toLowerCase().trim();
                            if (email && !customerMap.has(email)) {
                                customerMap.set(email, {
                                    email: userData.email,
                                    name: userData.name || 'Guest Customer',
                                    phone: userData.phone || 'N/A',
                                    orders: [],
                                });
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            } catch (userError) {
                console.warn('Error loading registered users in fallback:', userError);
            }

            const customers = Array.from(customerMap.values()).map(customer => ({
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                totalOrders: customer.orders.length,
                totalSpent: customer.orders.reduce((sum, order) => sum + (order.total || 0), 0),
                lastOrderDate: customer.orders.length > 0
                    ? customer.orders.sort((a, b) => 
                        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                    )[0].orderDate
                    : new Date().toISOString(),
                isRegisteredOnly: customer.orders.length === 0, // true if no orders placed
            }));
            
            console.log(`Fallback: Found ${customers.length} customers (with orders: ${customers.filter(c => c.totalOrders > 0).length}, without orders: ${customers.filter(c => c.totalOrders === 0).length})`);
            return customers;
        } catch (fallbackError) {
            console.error('Error in fallback:', fallbackError);
            return [];
        }
    }
}

// Save user profile to Firebase
export async function saveUserProfileToFirebase(userProfile: UserProfile): Promise<{ success: boolean; message: string }> {
    try {
        // Check if database is properly initialized
        if (!database || typeof database === 'object' && Object.keys(database).length === 0) {
            return { success: false, message: 'Firebase not configured' };
        }

        const userRef = ref(database, `users/${userProfile.id}`);
        await set(userRef, {
            ...userProfile,
            lastUpdated: new Date().toISOString(),
        });
        
        console.log(`User profile saved to Firebase: ${userProfile.email}`);
        return { success: true, message: 'User profile saved to Firebase successfully' };
    } catch (error: any) {
        console.error('Error saving user profile to Firebase:', error);
        return { success: false, message: error.message || 'Failed to save user profile to Firebase' };
    }
}

// Get all user profiles from Firebase
export async function getAllUserProfilesFromFirebase(): Promise<UserProfile[]> {
    try {
        // Check if database is properly initialized
        if (!database || typeof database === 'object' && Object.keys(database).length === 0) {
            return [];
        }

        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            return Object.values(usersData) as UserProfile[];
        }
        
        return [];
    } catch (error: any) {
        console.error('Error fetching user profiles from Firebase:', error);
        return [];
    }
}

