import { ref, set, get, onValue, off, push, update, remove, DataSnapshot, serverTimestamp, query, orderByChild, equalTo } from 'firebase/database';
import { firebaseDb } from './firebase/config';
import { Order, User } from '@/types';

const isBrowser = typeof window !== 'undefined';

// Helper function to remove undefined values (Firebase doesn't allow undefined)
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

function getLocalStorageJson<T>(key: string, fallback: T): T {
    if (!isBrowser) return fallback;
    try {
        const value = localStorage.getItem(key);
        return value ? (JSON.parse(value) as T) : fallback;
    } catch {
        return fallback;
    }
}

function setLocalStorageJson(key: string, value: unknown): void {
    if (!isBrowser) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        return;
    }
}

// Save order to Firebase
export async function saveOrderToFirebase(order: Order): Promise<{ success: boolean; message: string }> {
    try {
        const db = firebaseDb;
        if (!db) {
            if (!isBrowser) {
                return { success: false, message: 'Firebase not configured' };
            }
            const existingOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
            const orderIndex = existingOrders.findIndex((o: Order) => o.orderId === order.orderId);
            if (orderIndex >= 0) {
                existingOrders[orderIndex] = order;
            } else {
                existingOrders.push(order);
            }
            setLocalStorageJson('taruvae-orders', existingOrders);
            return { success: true, message: 'Order saved to localStorage (Firebase not configured)' };
        }

        const cleanedOrder = removeUndefinedValues(order);
        const orderRef = ref(firebaseDb, `orders/${order.orderId}`);
        await set(orderRef, cleanedOrder);

        // Also save to localStorage as backup
        const existingOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
        const orderIndex = existingOrders.findIndex((o: Order) => o.orderId === order.orderId);
        if (orderIndex >= 0) {
            existingOrders[orderIndex] = order;
        } else {
            existingOrders.push(order);
        }
        setLocalStorageJson('taruvae-orders', existingOrders);

        return { success: true, message: 'Order saved to Firebase successfully' };
    } catch (error: any) {
        console.warn('Error saving order to Firebase:', error);
        // Fallback to localStorage
        const existingOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
        existingOrders.push(order);
        setLocalStorageJson('taruvae-orders', existingOrders);
        return { success: false, message: error.message || 'Failed to save order to Firebase' };
    }
}

// Get orders from Firebase (with optional filtering)
export async function getAllOrdersFromFirebase(userId?: string, email?: string): Promise<Order[]> {
    try {
        const db = firebaseDb;
        if (!db) {
            return getLocalStorageJson<Order[]>('taruvae-orders', []);
        }

        const ordersRef = ref(db, 'orders');
        let snapshot;

        if (userId) {
            const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
            snapshot = await get(userOrdersQuery);
        } else if (email) {
            const emailOrdersQuery = query(ordersRef, orderByChild('customer/email'), equalTo(email));
            snapshot = await get(emailOrdersQuery);
        } else {
            snapshot = await get(ordersRef);
        }

        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersArray: Order[] = Object.values(ordersData);
            return ordersArray;
        }

        return [];
    } catch (error: any) {
        console.warn('Error fetching orders from Firebase:', error);
        // Fallback to localStorage
        const allLocalOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
        if (userId) {
            return allLocalOrders.filter(o => o.userId === userId);
        }
        if (email) {
            return allLocalOrders.filter(o => o.customer.email === email);
        }
        return allLocalOrders;
    }
}

// Get a single order by ID
export async function getOrderByIdFromFirebase(orderId: string): Promise<Order | null> {
    try {
        const db = firebaseDb;
        if (!db) {
            const localOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
            return localOrders.find(o => o.orderId === orderId) || null;
        }

        const orderRef = ref(db, `orders/${orderId}`);
        const snapshot = await get(orderRef);

        if (snapshot.exists()) {
            return snapshot.val() as Order;
        }

        return null;
    } catch (error) {
        console.warn('Error fetching order by ID:', error);
        const localOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
        return localOrders.find(o => o.orderId === orderId) || null;
    }
}

// Listen to orders in real-time (with optional filtering)
export function subscribeToOrders(callback: (orders: Order[]) => void, userId?: string, email?: string): () => void {
    const db = firebaseDb;
    if (!db) {
        const orders = getLocalStorageJson<Order[]>('taruvae-orders', []);
        if (userId) {
            callback(orders.filter(o => o.userId === userId));
        } else if (email) {
            callback(orders.filter(o => o.customer.email === email));
        } else {
            callback(orders);
        }
        return () => { };
    }

    const ordersRef = ref(db, 'orders');
    let ordersQuery;

    if (userId) {
        ordersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
    } else if (email) {
        ordersQuery = query(ordersRef, orderByChild('customer/email'), equalTo(email));
    } else {
        ordersQuery = ordersRef;
    }

    const unsubscribe = onValue(ordersQuery, (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersArray: Order[] = Object.values(ordersData);
            callback(ordersArray);
        } else {
            callback([]);
        }
    }, (error) => {
        console.warn('Error listening to orders:', error);
        // Fallback to localStorage
        const allLocalOrders = getLocalStorageJson<Order[]>('taruvae-orders', []);
        if (userId) {
            callback(allLocalOrders.filter(o => o.userId === userId));
        } else if (email) {
            callback(allLocalOrders.filter(o => o.customer.email === email));
        } else {
            callback(allLocalOrders);
        }
    });

    return () => {
        off(ordersQuery);
        unsubscribe();
    };
}

// Update order status and other fields in Firebase
export async function updateOrderStatusInFirebase(
    orderId: string,
    newStatus: string,
    message?: string,
    extraData: Partial<Order> = {}
): Promise<{ success: boolean; message: string }> {
    try {
        const db = firebaseDb;
        if (!db) {
            if (!isBrowser) {
                return { success: false, message: 'Firebase not configured' };
            }
            const orders = getLocalStorageJson<Order[]>('taruvae-orders', []);
            const orderIndex = orders.findIndex((o: Order) => o.orderId === orderId);
            if (orderIndex >= 0) {
                orders[orderIndex].status = newStatus as Order['status'];
                if (!orders[orderIndex].statusHistory) {
                    orders[orderIndex].statusHistory = [];
                }
                orders[orderIndex].statusHistory!.push({
                    status: newStatus,
                    date: new Date().toISOString(),
                    message: message || `Order status updated to ${newStatus}`,
                });
                setLocalStorageJson('taruvae-orders', orders);
            }
            return { success: true, message: 'Order status updated in localStorage' };
        }

        const orderRef = ref(db, `orders/${orderId}`);
        const snapshot = await get(orderRef);

        if (snapshot.exists()) {
            const order = snapshot.val() as Order;
            const updatedOrder = {
                ...order,
                ...extraData,
                status: newStatus as Order['status'],
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
            const orders = getLocalStorageJson<Order[]>('taruvae-orders', []);
            const orderIndex = orders.findIndex((o: Order) => o.orderId === orderId);
            if (orderIndex >= 0) {
                orders[orderIndex] = updatedOrder;
                setLocalStorageJson('taruvae-orders', orders);
            }

            return { success: true, message: 'Order status updated successfully' };
        }

        return { success: false, message: 'Order not found' };
    } catch (error: any) {
        console.warn('Error updating order status:', error);
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
        const localOrders: Order[] = getLocalStorageJson<Order[]>('taruvae-orders', []);

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
            const localUsers = getLocalStorageJson<any[]>('taruvae-users', []);
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
            const emailUsers = getLocalStorageJson<any[]>('taruvae-email-users', []);
            emailUsers.forEach((user: any) => {
                // Try to find email from Firebase auth or other sources
                // For now, we'll rely on orders for Firebase users
            });

            // Get currently logged in users from localStorage
            const currentUser = getLocalStorageJson<any | null>('taruvae-user', null);
            if (currentUser) {
                try {
                    if (currentUser.email) {
                        const email = currentUser.email.toLowerCase().trim();
                        if (email && !customerMap.has(email)) {
                            customerMap.set(email, {
                                email: currentUser.email,
                                name: currentUser.name || 'Guest Customer',
                                phone: currentUser.phone || 'N/A',
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
            totalSpent: customer.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
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
        console.warn('Error getting customers:', error);
        // Fallback to localStorage only
        try {
            const localOrders: Order[] = getLocalStorageJson<Order[]>('taruvae-orders', []);
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
                const localUsers = getLocalStorageJson<any[]>('taruvae-users', []);
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

                const currentUser = getLocalStorageJson<any | null>('taruvae-user', null);
                if (currentUser) {
                    try {
                        if (currentUser.email) {
                            const email = currentUser.email.toLowerCase().trim();
                            if (email && !customerMap.has(email)) {
                                customerMap.set(email, {
                                    email: currentUser.email,
                                    name: currentUser.name || 'Guest Customer',
                                    phone: currentUser.phone || 'N/A',
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
                totalSpent: customer.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
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
export async function saveUserProfileToFirebase(userProfile: User): Promise<{ success: boolean; message: string }> {
    try {
        if (!firebaseDb) {
            return { success: false, message: 'Firebase not configured' };
        }

        const userRef = ref(firebaseDb, `users/${userProfile.uid}`);
        // Remove undefined values before saving (Firebase doesn't allow undefined)
        const cleanedProfile = removeUndefinedValues({
            ...userProfile,
            lastUpdated: new Date().toISOString(),
        });
        await set(userRef, cleanedProfile);

        console.log(`User profile saved to Firebase: ${userProfile.email}`);
        return { success: true, message: 'User profile saved to Firebase successfully' };
    } catch (error: any) {
        console.warn('Error saving user profile to Firebase:', error);
        return { success: false, message: error.message || 'Failed to save user profile to Firebase' };
    }
}

// Get all user profiles from Firebase
export async function getAllUserProfilesFromFirebase(): Promise<User[]> {
    try {
        if (!firebaseDb) {
            return [];
        }

        const usersRef = ref(firebaseDb, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            return Object.values(usersData) as User[];
        }

        return [];
    } catch (error: any) {
        console.warn('Error fetching user profiles from Firebase:', error);
        return [];
    }
}

