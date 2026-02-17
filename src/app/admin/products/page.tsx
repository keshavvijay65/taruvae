'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import RichTextEditor from '@/components/RichTextEditor';
import { Product } from '@/context/CartContext';
import { saveProductsToFirebase, getAllProductsFromFirebase, getAllCategoriesFromFirebase, saveCategoriesToFirebase, subscribeToCategories, subscribeToProducts, Category, seedProductsToFirebase } from '@/lib/firebaseProducts';
import { DEFAULT_PRODUCTS } from '@/lib/defaultProducts';
import type { Product as FirebaseProduct } from '@/lib/firebaseProducts';
import { uploadProductImage, isBase64Image } from '@/lib/firebaseStorage';

// Helper function to infer weight from price for common products
function inferWeightFromPrice(price: number, productName: string): string {
    // Common price-to-weight mappings for oils
    const priceMap: { [key: number]: string } = {
        430: '1 KG', // Groundnut Oil 1000ml
        250: '500 ml',
        140: '250 ml',
        70: '100 ml',
        460: '1 KG', // Mustard Oil 1000ml
        260: '500 ml',
        150: '250 ml',
        80: '100 ml',
        450: '1 KG', // Sunflower/Coconut Oil 1000ml
        320: '500 ml',
        180: '250 ml',
        90: '100 ml',
        590: '1 KG', // Coconut Oil premium
        510: '1 KG', // Sesame Oil
        280: '500 ml',
        160: '250 ml',
    };

    // Check exact price match first
    if (priceMap[price]) {
        return priceMap[price];
    }

    // Check for approximate matches (within ₹10)
    for (const [priceKey, weight] of Object.entries(priceMap)) {
        if (Math.abs(price - parseInt(priceKey)) <= 10) {
            return weight;
        }
    }

    return '';
}

// Helper function to convert Firebase Product to CartContext Product
function convertToCartProduct(firebaseProduct: FirebaseProduct): Product {
    // Handle weight properly - check if it exists and is not empty
    let weight = firebaseProduct.weight;
    let size = (weight !== undefined && weight !== null && String(weight).trim().length > 0)
        ? String(weight).trim()
        : '';

    // If weight is missing, try to infer from price
    if (!size && firebaseProduct.price) {
        const inferredWeight = inferWeightFromPrice(firebaseProduct.price, firebaseProduct.name || '');
        if (inferredWeight) {
            size = inferredWeight;
        }
    }

    return {
        id: typeof firebaseProduct.id === 'string' ? parseInt(firebaseProduct.id) || 0 : firebaseProduct.id,
        name: (firebaseProduct.name || '').replace(/Peanut Oil/gi, 'Ground Nut Oil'),
        price: firebaseProduct.price || 0,
        image: firebaseProduct.image || '',
        rating: firebaseProduct.rating || 4.0,
        reviews: 0, // Default reviews
        inStock: firebaseProduct.stock !== undefined ? firebaseProduct.stock > 0 : true,
        category: firebaseProduct.category || '',
        size: size,
        description: firebaseProduct.description || '',
        // Preserve all boolean flags and optional fields from Firebase
        // Properly convert boolean values (handle string "true"/"false", numbers 1/0, and actual booleans)
        isNew: (firebaseProduct as any).isNew === true || (firebaseProduct as any).isNew === 'true' || (firebaseProduct as any).isNew === 1,
        isBestseller: (firebaseProduct as any).isBestseller === true || (firebaseProduct as any).isBestseller === 'true' || (firebaseProduct as any).isBestseller === 1,
        isPrime: (firebaseProduct as any).isPrime === true || (firebaseProduct as any).isPrime === 'true' || (firebaseProduct as any).isPrime === 1,
        // CRITICAL: Strict boolean conversion - handle string "true"/"false" and actual booleans
        showOnHome: (() => {
            const value = (firebaseProduct as any).showOnHome;
            if (value === true || value === 'true') return true;
            if (value === false || value === 'false') return false;
            return false; // Default to false if undefined/null
        })(),
        originalPrice: (firebaseProduct as any).originalPrice,
        discount: (firebaseProduct as any).discount,
        features: (firebaseProduct as any).features,
        benefits: (firebaseProduct as any).benefits,
        includedProducts: (firebaseProduct as any).includedProducts,
    };
}
import AdminWrapper from '@/components/admin/AdminWrapper';
import AdminHeader from '@/components/admin/AdminHeader';
import DashboardStats from '@/components/admin/products/DashboardStats';
import DragDropUpload from '@/components/admin/products/DragDropUpload';
import QuickEditModal from '@/components/admin/products/QuickEditModal';
import SearchFilters from '@/components/admin/products/SearchFilters';

// Categories will be loaded dynamically from Firebase

// Placeholder image for products without images
const PLACEHOLDER_IMAGE = '/images/all/products image available soon.png';

// Helper function to convert CartContext Product to Firebase Product
const convertToFirebaseProduct = (product: Product): FirebaseProduct => {
    const firebaseProduct: any = {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description || '',
        category: product.category || '',
        stock: product.inStock ? 100 : 0,
        rating: product.rating,
    };
    // Preserve size/weight exactly as entered - include even if empty string to clear old values
    if (product.size !== undefined && product.size !== null) {
        const sizeValue = String(product.size).trim();
        if (sizeValue.length > 0) {
            firebaseProduct.weight = sizeValue;
        } else {
            // If size is explicitly set to empty, don't include weight field (will use empty string on load)
            // This allows clearing the size field
        }
    }
    // Preserve all boolean flags and optional fields - ALWAYS include boolean fields (even if false)
    // This ensures they're saved to Firebase and can be read back properly
    // CRITICAL: Explicitly set boolean values to ensure Firebase stores them (even false)
    // Convert to strict boolean: true if value is truthy, false otherwise
    firebaseProduct.isNew = Boolean(product.isNew === true || (product.isNew as any) === 'true');
    firebaseProduct.isBestseller = Boolean(product.isBestseller === true || (product.isBestseller as any) === 'true');
    firebaseProduct.isPrime = Boolean(product.isPrime === true || (product.isPrime as any) === 'true');
    // CRITICAL: Always set showOnHome explicitly (true or false, never undefined)
    firebaseProduct.showOnHome = Boolean(product.showOnHome === true || (product.showOnHome as any) === 'true');
    if (product.originalPrice !== undefined && product.originalPrice !== null) firebaseProduct.originalPrice = product.originalPrice;
    if (product.discount !== undefined && product.discount !== null) firebaseProduct.discount = product.discount;
    if (product.features !== undefined && product.features !== null) firebaseProduct.features = product.features;
    if (product.benefits !== undefined && product.benefits !== null) firebaseProduct.benefits = product.benefits;
    if ((product as any).includedProducts !== undefined && (product as any).includedProducts !== null) {
        (firebaseProduct as any).includedProducts = (product as any).includedProducts;
    }
    return firebaseProduct;
};


// Helper function to save products to Firebase and localStorage
const saveProductsToStorage = async (products: Product[]) => {
    // Convert CartContext Products to Firebase Products
    const firebaseProducts = products.map(convertToFirebaseProduct);
    // Save to Firebase (this also saves to localStorage as backup)
    await saveProductsToFirebase(firebaseProducts);
};


// Removed getAllDefaultProducts - now using src/lib/defaultProducts.ts via seedProductsToFirebase
export default function AdminProductsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryFormData, setCategoryFormData] = useState({ value: '', label: '' });
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Quick Edit state
    const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
    const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

    // Search and Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStock, setFilterStock] = useState<string>('all');
    const [filterFlags, setFilterFlags] = useState<{
        isNew: boolean | null;
        isBestseller: boolean | null;
        isPrime: boolean | null;
        showOnHome: boolean | null;
    }>({
        isNew: null,
        isBestseller: null,
        isPrime: null,
        showOnHome: null,
    });
    const [selectedProductsForBulk, setSelectedProductsForBulk] = useState<number[]>([]);
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Price range state for filtering
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    // Upload progress state
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Quick Edit Save handler
    const handleQuickEditSave = async (updatedProduct: Product) => {
        try {
            setProducts(currentProducts => {
                const updatedProducts = currentProducts.map(p =>
                    p.id === updatedProduct.id ? updatedProduct : p
                );
                saveProductsToStorage(updatedProducts).catch(err => {
                    console.error('Error saving updated product:', err);
                    showToast('Error saving changes to Firebase', 'error');
                });
                return updatedProducts;
            });
            showToast('Product updated successfully!', 'success');
        } catch (error) {
            console.error('Error in handleQuickEditSave:', error);
            showToast('Failed to update product', 'error');
        }
    };

    // Combo/Deal creation state
    const [showComboDealModal, setShowComboDealModal] = useState<'combo' | 'deal' | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [comboDealData, setComboDealData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        discount: '',
        image: '',
        description: '',
        features: '',
        benefits: '',
        size: '',
    });

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false,
    });

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger',
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        discount: '',
        image: '',
        rating: '4.5',
        reviews: '0',
        inStock: true,
        category: 'oil',
        size: '',
        isNew: false,
        isBestseller: false,
        freeShipping: false,
        isPrime: false,
        showOnHome: true, // Default to true so products show on home page
        description: '',
        features: '',
        benefits: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        const initializePage = async () => {
            try {
                const auth = localStorage.getItem('admin-authenticated');
                if (auth === 'true') {
                    setIsAuthenticated(true);

                    // INSTANT LOAD: Show cached data immediately, no waiting
                    try {
                        const cachedProducts = localStorage.getItem('taruvae-admin-products');
                        if (cachedProducts) {
                            const parsed = JSON.parse(cachedProducts);
                            const converted = parsed.map((p: any) => convertToCartProduct(p));
                            setProducts(converted);
                        }
                    } catch (cacheError) {
                        console.warn('Error loading cached products:', cacheError);
                    }

                    // Load cached categories
                    try {
                        const cachedCategories = localStorage.getItem('taruvae-categories');
                        if (cachedCategories) {
                            const parsed = JSON.parse(cachedCategories);
                            setCategories(parsed);
                        } else {
                            // Set default categories immediately
                            const defaultCategories: Category[] = [
                                { id: 'oil', value: 'oil', label: 'Oil', createdAt: Date.now() },
                                { id: 'ghee', value: 'ghee', label: 'Ghee', createdAt: Date.now() },
                                { id: 'superfoods', value: 'superfoods', label: 'Superfoods', createdAt: Date.now() },
                                { id: 'combo', value: 'combo', label: 'Combo', createdAt: Date.now() },
                            ];
                            setCategories(defaultCategories);
                        }
                    } catch (cacheError) {
                        console.warn('Error loading cached categories:', cacheError);
                    }

                    // Show UI immediately
                    setLoading(false);

                    // BACKGROUND SYNC: Refresh from Firebase without blocking (no timeout race)
                    // The real-time subscription will handle updates automatically
                } else {
                    router.push('/admin/login');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing page:', error);
                setLoading(false);
            }
        };
        initializePage();
    }, [router]);

    const loadCategories = async () => {
        try {
            // Load categories with timeout protection (reduced to 2s)
            let loadedCategories: Category[] = [];
            try {
                loadedCategories = await Promise.race([
                    getAllCategoriesFromFirebase(),
                    new Promise<Category[]>((_, reject) =>
                        setTimeout(() => reject(new Error('Categories timeout')), 2000) // Reduced to 2s
                    )
                ]);
            } catch (firebaseError) {
                console.warn('Categories load timeout, using cache:', firebaseError);
                // Keep cached categories
                return;
            }

            // If no categories exist, initialize with default categories
            if (!loadedCategories || loadedCategories.length === 0) {
                const defaultCategories: Category[] = [
                    { id: 'oil', value: 'oil', label: 'Oil', createdAt: Date.now() },
                    { id: 'ghee', value: 'ghee', label: 'Ghee', createdAt: Date.now() },
                    { id: 'superfoods', value: 'superfoods', label: 'Superfoods', createdAt: Date.now() },
                    { id: 'combo', value: 'combo', label: 'Combo', createdAt: Date.now() },
                ];
                // Save in background, don't block
                saveCategoriesToFirebase(defaultCategories).catch(err =>
                    console.error('Error saving default categories:', err)
                );
                setCategories(defaultCategories);
            } else {
                setCategories(loadedCategories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to default categories
            const defaultCategories: Category[] = [
                { id: 'oil', value: 'oil', label: 'Oil', createdAt: Date.now() },
                { id: 'ghee', value: 'ghee', label: 'Ghee', createdAt: Date.now() },
                { id: 'superfoods', value: 'superfoods', label: 'Superfoods', createdAt: Date.now() },
                { id: 'combo', value: 'combo', label: 'Combo', createdAt: Date.now() },
            ];
            setCategories(defaultCategories);
        }
    };

    useEffect(() => {
        // Subscribe to real-time category updates
        const unsubscribeCategories = subscribeToCategories((updatedCategories) => {
            setCategories(updatedCategories);
        });
        return () => {
            if (unsubscribeCategories) unsubscribeCategories();
        };
    }, []);

    // CRITICAL: Subscribe to real-time product updates for admin-user sync
    useEffect(() => {
        console.log('[AdminProducts] Setting up real-time product subscription...');
        let isInitialLoad = true;
        const unsubscribeProducts = subscribeToProducts((updatedProducts) => {
            // Skip first callback to avoid overwriting initial load
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }
            console.log('[AdminProducts] Real-time update received:', updatedProducts.length, 'products');
            if (updatedProducts && updatedProducts.length > 0) {
                // Convert Firebase Products to CartContext Products
                const converted = updatedProducts.map(convertToCartProduct);
                // De-duplicate by ID
                const uniqueProducts = Array.from(new Map(converted.map(p => [p.id, p])).values());
                setProducts(uniqueProducts);
                console.log('[AdminProducts] Products updated via real-time subscription');
            }
        });
        return () => {
            console.log('[AdminProducts] Cleaning up product subscription');
            if (unsubscribeProducts) unsubscribeProducts();
        };
    }, []);

    const loadProducts = async () => {
        try {
            // First try to load from Firebase with timeout (reduced to 2s)
            let firebaseProducts: any[] = [];
            try {
                firebaseProducts = await Promise.race([
                    getAllProductsFromFirebase(),
                    new Promise<any[]>((_, reject) =>
                        setTimeout(() => reject(new Error('Firebase timeout')), 2000) // Reduced to 2s
                    )
                ]);
            } catch (firebaseError) {
                console.warn('Firebase load timeout, using cache:', firebaseError);
                // Return null to keep cached data
                return;
            }

            // Convert Firebase Products to CartContext Products
            let loadedProducts: Product[] = Array.isArray(firebaseProducts)
                ? firebaseProducts.map(convertToCartProduct)
                : [];

            // Check localStorage for existing products (migration scenario) - only if Firebase is empty
            if (!loadedProducts || loadedProducts.length === 0) {
                if (typeof window !== 'undefined') {
                    const localProductsStr = localStorage.getItem('taruvae-admin-products');
                    if (localProductsStr) {
                        try {
                            const parsed = JSON.parse(localProductsStr);
                            // Check if parsed products are Firebase format or CartContext format
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                if (typeof parsed[0].id === 'string') {
                                    // Firebase format - convert
                                    loadedProducts = parsed.map(convertToCartProduct);
                                } else {
                                    // CartContext format - use directly
                                    loadedProducts = parsed;
                                }
                                // Migrate to Firebase (non-blocking)
                                saveProductsToStorage(loadedProducts).catch(err =>
                                    console.error('Error saving products to storage:', err)
                                );
                            }
                        } catch (e) {
                            console.error('Error parsing localStorage products:', e);
                        }
                    }
                }
            }

            // If no products found anywhere, use defaults
            if (!loadedProducts || loadedProducts.length === 0) {
                loadedProducts = DEFAULT_PRODUCTS.map(convertToCartProduct);
                // Save defaults to Firebase (non-blocking)
                saveProductsToStorage(loadedProducts).catch(err =>
                    console.error('Error saving default products:', err)
                );
            }

            // Auto-mark products with price > 999 as bestseller (only update if needed)
            const updatedProducts = loadedProducts.map((product: Product) => {
                const shouldBeBestseller = product.price > 999;
                // Only update if bestseller flag needs to change
                if (shouldBeBestseller && !product.isBestseller) {
                    return {
                        ...product,
                        isBestseller: true,
                    };
                }
                return product;
            });

            // De-duplicate by ID before setting state
            const uniqueUpdatedProducts = Array.from(new Map(updatedProducts.map((p: Product) => [p.id, p])).values());
            setProducts(uniqueUpdatedProducts);

            // Update Firebase with bestseller flags if they changed (async, don't block)
            const hasChanges = updatedProducts.some((p, i) =>
                p.isBestseller !== loadedProducts[i]?.isBestseller
            );
            if (hasChanges) {
                // Don't await - let it save in background
                saveProductsToStorage(updatedProducts).catch(err =>
                    console.error('Error updating bestseller flags:', err)
                );
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to localStorage or defaults
            if (typeof window !== 'undefined') {
                const savedProducts = localStorage.getItem('taruvae-admin-products');
                if (savedProducts) {
                    try {
                        const parsed = JSON.parse(savedProducts);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            if (typeof parsed[0].id === 'string') {
                                setProducts(parsed.map(convertToCartProduct));
                            } else {
                                setProducts(parsed);
                            }
                            return; // Exit early on success
                        }
                    } catch (e) {
                        console.error('Error parsing localStorage:', e);
                    }
                }
            }
            // Final fallback to defaults
            // Final fallback to defaults
            const defaultProducts = DEFAULT_PRODUCTS.map(convertToCartProduct);
            setProducts(defaultProducts);
        }
    };

    const handleSeedProducts = () => {
        showConfirm(
            'Seed Default Products',
            'This will add missing default products to Firebase. Existing products will be skipped. Continue?',
            async () => {
                showToast('🌱 Seeding products...', 'info');
                const result = await seedProductsToFirebase();
                if (result.success) {
                    showToast(result.message, 'success');
                } else {
                    showToast(result.message, 'error');
                }
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            'info'
        );
    };

    // Function to auto-update bestseller flags based on price
    const updateBestsellerFlags = async () => {
        setProducts(currentProducts => {
            const updatedProducts = currentProducts.map(product => ({
                ...product,
                isBestseller: product.price > 999 ? true : (product.isBestseller || false),
            }));
            saveProductsToStorage(updatedProducts);
            return updatedProducts;
        });
        showToast('Bestseller flags updated! Products above â‚¹999 are now marked as bestseller.', 'success');
    };

    // Removed saveProducts - now using functional updates directly

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            originalPrice: '',
            discount: '',
            image: '',
            rating: '4.5',
            reviews: '0',
            inStock: true,
            category: 'oil',
            size: '',
            isNew: false,
            isBestseller: false,
            freeShipping: false,
            isPrime: false,
            showOnHome: true,
            description: '',
            features: '',
            benefits: '',
        });
        setImagePreview(null);
        setImageFile(null);
        setEditingProduct(null);
        setUploadProgress(0);
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields (Image is optional, will use placeholder)
        if (!formData.name.trim() || !formData.price.trim()) {
            showToast('Please fill in all required fields (Name, Price)', 'error');
            return;
        }

        const price = parseFloat(formData.price);
        const productId = Date.now().toString();

        // Upload image to Firebase Storage if file is selected
        // Default to placeholder, but use formData.image if it's a valid URL (not a file marker or base64)
        let imageUrl = PLACEHOLDER_IMAGE;
        const formImage = formData.image.trim();

        if (imageFile) {
            setIsUploadingImage(true);
            setUploadProgress(0);
            showToast('âš¡ Compressing image...', 'success');

            try {
                // Small delay to show compression message
                await new Promise(resolve => setTimeout(resolve, 300));

                const uploadResult = await uploadProductImage(imageFile, productId, (progress) => {
                    setUploadProgress(progress);
                });
                if (uploadResult.success && uploadResult.url) {
                    imageUrl = uploadResult.url;
                    showToast('âœ… Image uploaded successfully!', 'success');
                } else {
                    showToast(`âŒ Upload failed: ${uploadResult.error}. Using placeholder.`, 'error');
                    imageUrl = PLACEHOLDER_IMAGE;
                }
            } catch (error: any) {
                console.error('Image upload error:', error);
                showToast('âŒ Upload failed. Using placeholder.', 'error');
                imageUrl = PLACEHOLDER_IMAGE;
            } finally {
                setIsUploadingImage(false);
            }
        } else if (formImage && !formImage.startsWith('[FILE:') && !formImage.startsWith('data:image')) {
            imageUrl = formImage;
        } else if (isBase64Image(formData.image)) {
            // If base64 image in form, warn user and use placeholder
            showToast('Large base64 images not supported. Please use file upload.', 'error');
            imageUrl = PLACEHOLDER_IMAGE;
        }

        // Parse features and benefits from comma-separated strings
        const features = formData.features.trim()
            ? formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
            : undefined;
        const benefits = formData.benefits.trim()
            ? formData.benefits.split(',').map(b => b.trim()).filter(b => b.length > 0)
            : undefined;

        const newProduct: Product = {
            id: parseInt(productId),
            name: formData.name.trim(),
            price: price,
            originalPrice: formData.originalPrice && formData.originalPrice.trim() ? parseFloat(formData.originalPrice) : undefined,
            discount: formData.discount && formData.discount.trim() ? parseFloat(formData.discount) : undefined,
            // Use uploaded URL or placeholder
            image: imageUrl,
            rating: parseFloat(formData.rating) || 4.5,
            reviews: parseInt(formData.reviews) || 0,
            inStock: formData.inStock,
            category: formData.category,
            size: formData.size && formData.size.trim() ? formData.size.trim() : undefined,
            isNew: formData.isNew,
            // Auto-mark as bestseller if price > 999, otherwise use formData value
            isBestseller: price > 999 ? true : formData.isBestseller,
            isPrime: formData.isPrime,
            showOnHome: Boolean(formData.showOnHome), // Explicitly convert to boolean
            description: formData.description.trim() || undefined,
            features: features && features.length > 0 ? features : undefined,
            benefits: benefits && benefits.length > 0 ? benefits : undefined,
        };

        console.log('[Product Save] ðŸ’¾ Creating new product:', {
            id: newProduct.id,
            name: newProduct.name,
            price: newProduct.price,
            image: newProduct.image,
            category: newProduct.category
        });

        // Use functional update to ensure we have the latest products state
        setProducts(currentProducts => {
            const updatedProducts = [...currentProducts, newProduct];

            // Save to Firebase - await to ensure it's saved before returning
            saveProductsToStorage(updatedProducts).then(() => {
                console.log('[Product Save] âœ… Product saved to Firebase successfully');
                console.log('[Product Save] ðŸ“Š Total products:', updatedProducts.length);
            }).catch(err => {
                console.error('[Product Save] âŒ Error saving product:', err);
                showToast('Error saving product to Firebase', 'error');
            });
            return updatedProducts;
        });

        resetForm();
        setShowAddForm(false);

        showToast('âœ… Product added successfully!', 'success');
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            originalPrice: product.originalPrice?.toString() || '',
            discount: product.discount?.toString() || '',
            image: product.image,
            rating: product.rating.toString(),
            reviews: product.reviews.toString(),
            inStock: product.inStock,
            category: product.category || 'oil',
            size: product.size || '',
            isNew: product.isNew || false,
            isBestseller: product.isBestseller || false,
            freeShipping: false,
            isPrime: product.isPrime || false,
            showOnHome: product.showOnHome || false,
            description: product.description || '',
            features: product.features ? product.features.join(', ') : '',
            benefits: product.benefits ? product.benefits.join(', ') : '',
        });
        // Set preview if image exists
        if (product.image) {
            setImagePreview(product.image);
        } else {
            setImagePreview(null);
        }
        setImageFile(null);
        setShowAddForm(true);
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        // Store editingProduct in a local variable to avoid state issues
        const productToEdit = editingProduct;

        if (!productToEdit) {
            showToast('No product selected for editing', 'error');
            return;
        }

        // Validate required fields (Image is optional, will use placeholder)
        if (!formData.name.trim() || !formData.price.trim()) {
            showToast('Please fill in all required fields (Name, Price)', 'error');
            return;
        }

        const price = parseFloat(formData.price);

        // Upload image to Firebase Storage if a new file is selected
        // Default to existing image or placeholder, but use formData.image if it's a valid URL
        let imageUrl = productToEdit.image || PLACEHOLDER_IMAGE;
        const formImage = formData.image.trim();

        if (imageFile) {
            setIsUploadingImage(true);
            setUploadProgress(0);
            showToast('âš¡ Compressing image...', 'success');

            try {
                // Small delay to show compression message
                await new Promise(resolve => setTimeout(resolve, 300));

                const uploadResult = await uploadProductImage(imageFile, productToEdit.id.toString(), (progress) => {
                    setUploadProgress(progress);
                });
                if (uploadResult.success && uploadResult.url) {
                    imageUrl = uploadResult.url;
                    showToast('âœ… Image uploaded successfully!', 'success');
                } else {
                    const errorMsg = uploadResult.error || 'Unknown error';
                    showToast(`â Œ Upload failed: ${errorMsg}. Keeping existing image.`, 'error');
                    imageUrl = productToEdit.image || PLACEHOLDER_IMAGE;
                }
            } catch (error: any) {
                console.error('Image upload error:', error);
                const errorMsg = error?.message || error?.code || 'Network error. Please check your connection.';
                showToast(`â Œ Upload failed: ${errorMsg}. Keeping existing image.`, 'error');
                imageUrl = productToEdit.image || PLACEHOLDER_IMAGE;
            } finally {
                setIsUploadingImage(false);
            }
        } else if (formImage && !formImage.startsWith('[FILE:') && !formImage.startsWith('data:image')) {
            imageUrl = formImage;
        } else if (isBase64Image(formData.image)) {
            // If base64 image, warn and keep existing or placeholder
            showToast('Large base64 images not supported. Please use file upload.', 'error');
            imageUrl = productToEdit.image || PLACEHOLDER_IMAGE;
        }

        // Parse features and benefits from comma-separated strings
        const features = formData.features.trim()
            ? formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
            : undefined;
        const benefits = formData.benefits.trim()
            ? formData.benefits.split(',').map(b => b.trim()).filter(b => b.length > 0)
            : undefined;

        const updatedProduct: Product = {
            id: productToEdit.id,
            name: formData.name.trim(),
            price: price,
            originalPrice: formData.originalPrice && formData.originalPrice.trim() ? parseFloat(formData.originalPrice) : undefined,
            discount: formData.discount && formData.discount.trim() ? parseFloat(formData.discount) : undefined,
            // Use uploaded URL or existing image
            image: imageUrl,
            rating: parseFloat(formData.rating) || 4.5,
            reviews: parseInt(formData.reviews) || 0,
            inStock: formData.inStock,
            category: formData.category,
            size: formData.size && formData.size.trim() ? formData.size.trim() : undefined,
            isNew: formData.isNew,
            // Auto-mark as bestseller if price > 999, otherwise use formData value
            isBestseller: price > 999 ? true : formData.isBestseller,
            isPrime: formData.isPrime,
            showOnHome: Boolean(formData.showOnHome), // Explicitly convert to boolean
            description: formData.description.trim() || undefined,
            features: features && features.length > 0 ? features : undefined,
            benefits: benefits && benefits.length > 0 ? benefits : undefined,
        };

        console.log('[Product Update] ðŸ’¾ Updating product:', {
            id: updatedProduct.id,
            name: updatedProduct.name,
            price: updatedProduct.price,
            image: updatedProduct.image,
            category: updatedProduct.category
        });

        // Use functional update to ensure we have the latest products state
        setProducts(currentProducts => {
            const updatedProducts = currentProducts.map(p =>
                p.id === productToEdit.id ? updatedProduct : p
            );

            // Save to Firebase - await to ensure it's saved
            saveProductsToStorage(updatedProducts).catch(err => {
                console.error('Error updating product:', err);
                showToast('Error updating product in Firebase', 'error');
            });

            return updatedProducts;
        });

        // Reset form and close
        resetForm();
        setShowAddForm(false);
        setEditingProduct(null);

        showToast('Product updated successfully!', 'success');
    };

    const handleDeleteProduct = (id: number) => {
        const product = products.find(p => p.id === id);
        showConfirm(
            'Delete Product',
            `Are you sure you want to delete "${product?.name || 'this product'}"? This action cannot be undone.`,
            async () => {
                setProducts(currentProducts => {
                    const updatedProducts = currentProducts.filter(p => p.id !== id);
                    saveProductsToStorage(updatedProducts);
                    return updatedProducts;
                });
                showToast('Product deleted successfully!', 'success');
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            'danger'
        );
    };







    // Update formData.category when categories load
    useEffect(() => {
        if (categories.length > 0 && !categories.some(cat => cat.value === formData.category)) {
            setFormData(prev => ({ ...prev, category: categories[0].value }));
        }
    }, [categories]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryFormData.value.trim() || !categoryFormData.label.trim()) {
            showToast('Please fill in both category value and label', 'error');
            return;
        }

        const categoryValue = categoryFormData.value.trim().toLowerCase().replace(/\s+/g, '-');
        const categoryLabel = categoryFormData.label.trim();

        // Check if category already exists
        if (categories.some(cat => cat.value === categoryValue)) {
            showToast('Category with this value already exists!', 'error');
            return;
        }

        const newCategory: Category = {
            id: categoryValue,
            value: categoryValue,
            label: categoryLabel,
            createdAt: Date.now(),
        };

        const updatedCategories = [...categories, newCategory];
        await saveCategoriesToFirebase(updatedCategories);
        setCategories(updatedCategories);

        setCategoryFormData({ value: '', label: '' });
        setShowCategoryForm(false);
        showToast('Category added successfully!', 'success');
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryFormData({ value: category.value, label: category.label });
        setShowCategoryForm(true);
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryFormData.value.trim() || !categoryFormData.label.trim()) {
            showToast('Please fill in both category value and label', 'error');
            return;
        }

        if (!editingCategory) return;

        const categoryValue = categoryFormData.value.trim().toLowerCase().replace(/\s+/g, '-');
        const categoryLabel = categoryFormData.label.trim();

        // Check if another category with this value exists
        if (categories.some(cat => cat.value === categoryValue && cat.id !== editingCategory.id)) {
            showToast('Category with this value already exists!', 'error');
            return;
        }

        const updatedCategories = categories.map(cat =>
            cat.id === editingCategory.id
                ? { ...cat, value: categoryValue, label: categoryLabel }
                : cat
        );

        await saveCategoriesToFirebase(updatedCategories);
        setCategories(updatedCategories);

        // Update products with this category if value changed
        if (categoryValue !== editingCategory.value) {
            const updatedProducts = products.map(product =>
                product.category === editingCategory.value
                    ? { ...product, category: categoryValue }
                    : product
            );
            setProducts(updatedProducts);
            await saveProductsToStorage(updatedProducts);
        }

        setCategoryFormData({ value: '', label: '' });
        setEditingCategory(null);
        setShowCategoryForm(false);
        showToast('Category updated successfully!', 'success');
    };

    const handleDeleteCategory = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) return;

        // Check if any products use this category
        const productsWithCategory = products.filter(p => p.category === category.value);

        if (productsWithCategory.length > 0) {
            showConfirm(
                'Cannot Delete Category',
                `This category is used by ${productsWithCategory.length} product(s). Please change the category of these products first.`,
                () => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                },
                'warning'
            );
            return;
        }

        showConfirm(
            'Delete Category',
            `Are you sure you want to delete "${category.label}"? This action cannot be undone.`,
            async () => {
                const updatedCategories = categories.filter(cat => cat.id !== categoryId);
                await saveCategoriesToFirebase(updatedCategories);
                setCategories(updatedCategories);
                showToast('Category deleted successfully!', 'success');
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            'danger'
        );
    };
    const toggleProductSelection = (productId: number) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const calculateTotalOriginalPrice = () => {
        return products
            .filter(p => selectedProducts.includes(p.id))
            .reduce((sum, p) => sum + p.price, 0);
    };

    const handleCreateComboDeal = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedProducts.length === 0) {
            showToast('Please select at least one product', 'error');
            return;
        }

        const type = showComboDealModal;
        const totalOriginalPrice = calculateTotalOriginalPrice();
        const priceValue = parseFloat(comboDealData.price);

        // Calculate discount if not provided
        let discount = comboDealData.discount ? parseFloat(comboDealData.discount) : 0;
        if (!discount && totalOriginalPrice > 0 && priceValue > 0) {
            discount = Math.round(((totalOriginalPrice - priceValue) / totalOriginalPrice) * 100);
        }

        const includedProducts = products
            .filter(p => selectedProducts.includes(p.id))
            .map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image,
                size: p.size
            }));

        const newProduct: Product = {
            id: Date.now(),
            name: comboDealData.name,
            price: priceValue,
            originalPrice: comboDealData.originalPrice ? parseFloat(comboDealData.originalPrice) : totalOriginalPrice,
            discount: discount,
            image: comboDealData.image || PLACEHOLDER_IMAGE,
            rating: 4.8,
            reviews: 0,
            inStock: true,
            category: type === 'combo' ? 'combo' : (products.find(p => selectedProducts.includes(p.id))?.category || 'oil'),
            size: comboDealData.size || `${selectedProducts.length} Products`,
            isNew: true,
            isBestseller: priceValue > 999,
            description: comboDealData.description || `Special ${type} pack including ${includedProducts.map(p => p.name).join(', ')}.`,
            features: comboDealData.features ? comboDealData.features.split(',').map(f => f.trim()) : [`${selectedProducts.length} Premium Products`, 'Great Savings', 'Quality Guaranteed'],
            benefits: comboDealData.benefits ? comboDealData.benefits.split(',').map(b => b.trim()) : ['Value for Money', 'Complete Solution', 'Natural & Organic'],
            includedProducts: includedProducts as any
        };

        setProducts(currentProducts => {
            const updatedProducts = [...currentProducts, newProduct];
            saveProductsToStorage(updatedProducts);
            return updatedProducts;
        });

        setShowComboDealModal(null);
        setSelectedProducts([]);
        showToast(`${type === 'combo' ? 'Combo' : 'Deal'} created successfully!`, 'success');
    };

    // Filter and search products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = !searchQuery.trim() ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = filterCategory === 'all' || product.category === filterCategory;

            const matchesStock = filterStock === 'all' ||
                (filterStock === 'instock' ? product.inStock : !product.inStock);

            // Price range filter
            const productPrice = product.price;
            const matchesPrice = (!priceRange.min || productPrice >= parseFloat(priceRange.min)) &&
                (!priceRange.max || productPrice <= parseFloat(priceRange.max));

            // Flag filters
            const matchesNew = filterFlags.isNew === null || product.isNew === filterFlags.isNew;
            const matchesBestseller = filterFlags.isBestseller === null || product.isBestseller === filterFlags.isBestseller;
            const matchesPrime = filterFlags.isPrime === null || product.isPrime === filterFlags.isPrime;
            const matchesHome = filterFlags.showOnHome === null || product.showOnHome === filterFlags.showOnHome;

            return matchesSearch && matchesCategory && matchesStock && matchesPrice &&
                matchesNew && matchesBestseller && matchesPrime && matchesHome;
        });
    }, [products, searchQuery, filterCategory, filterStock, filterFlags, priceRange]);

    // Pagination calculation
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredProducts, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCategory, filterStock, filterFlags, priceRange]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = products.length;
        const inStock = products.filter(p => p.inStock).length;
        const outOfStock = total - inStock;
        const bestsellers = products.filter(p => p.isBestseller).length;
        const prime = products.filter(p => p.isPrime).length;
        const showOnHome = products.filter(p => p.showOnHome).length;
        const totalValue = products.reduce((sum, p) => sum + p.price, 0);

        return {
            total,
            inStock,
            outOfStock,
            bestsellers,
            prime,
            showOnHome,
            totalValue,
        };
    }, [products]);

    // Bulk operations
    const handleBulkDelete = () => {
        if (selectedProductsForBulk.length === 0) return;
        showConfirm(
            'Delete Selected Products',
            `Are you sure you want to delete ${selectedProductsForBulk.length} product(s)? This action cannot be undone.`,
            async () => {
                const updatedProducts = products.filter(p => !selectedProductsForBulk.includes(p.id));
                await saveProductsToStorage(updatedProducts);
                setProducts(updatedProducts);
                setSelectedProductsForBulk([]);
                setShowBulkActions(false);
                showToast(`${selectedProductsForBulk.length} product(s) deleted successfully!`, 'success');
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            'danger'
        );
    };

    const handleBulkToggleStock = async (inStock: boolean) => {
        if (selectedProductsForBulk.length === 0) return;
        const updatedProducts = products.map(p =>
            selectedProductsForBulk.includes(p.id) ? { ...p, inStock } : p
        );
        await saveProductsToStorage(updatedProducts);
        setProducts(updatedProducts);
        showToast(`${selectedProductsForBulk.length} product(s) ${inStock ? 'marked as in stock' : 'marked as out of stock'}!`, 'success');
        setSelectedProductsForBulk([]);
        setShowBulkActions(false);
    };

    const handleSelectAll = () => {
        if (selectedProductsForBulk.length === filteredProducts.length) {
            setSelectedProductsForBulk([]);
        } else {
            setSelectedProductsForBulk(filteredProducts.map(p => p.id));
        }
    };

    if (loading) {
        return (
            <AdminWrapper>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mb-4"></div>
                    <p className="text-brand-dark text-lg font-medium">Loading products...</p>
                </div>
            </AdminWrapper>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <AdminWrapper>
            <AdminHeader
                title="Inventory Dashboard"
                subtitle={`Manage ${products.length} products and inventory across all categories.`}
                showBackLink={true}
            >
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                    <button
                        onClick={handleSeedProducts}
                        className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Seed DB
                    </button>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryFormData({ value: '', label: '' });
                            setShowCategoryForm(!showCategoryForm);
                            setShowAddForm(false);
                        }}
                        className="bg-white border-2 border-brand-forest text-brand-forest px-5 py-2.5 rounded-xl font-bold hover:bg-brand-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Categories
                    </button>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            resetForm();
                            setShowAddForm(!showAddForm);
                            setShowCategoryForm(false);
                        }}
                        className="bg-brand-forest text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold hover:bg-brand-dark transition-all shadow-lg hover:shadow-brand-forest/20 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
                    >
                        {showAddForm ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Cancel</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>New Product</span>
                            </>
                        )}
                    </button>
                </div>
            </AdminHeader>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-20">
                {/* Stats Section */}
                {!showAddForm && !showCategoryForm && (
                    <DashboardStats products={products} />
                )}

                {/* Search & Filters */}
                {!showAddForm && !showCategoryForm && (
                    <SearchFilters
                        searchTerm={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedCategory={filterCategory}
                        onCategoryChange={setFilterCategory}
                        selectedStock={filterStock}
                        onStockChange={setFilterStock}
                        priceRange={priceRange}
                        onPriceRangeChange={setPriceRange}
                        onClearFilters={() => {
                            setSearchQuery('');
                            setFilterCategory('all');
                            setFilterStock('all');
                            setPriceRange({ min: '', max: '' });
                            setFilterFlags({ isNew: null, isBestseller: null, isPrime: null, showOnHome: null });
                        }}
                        categories={categories.map(c => c.value)}
                    />
                )}

                {/* Legacy Quick Actions (Moving to specialized sections or keeping if needed) */}
                {!showAddForm && !showCategoryForm && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => {
                                setShowComboDealModal('deal');
                                setSelectedProducts([]);
                            }}
                            className="text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <span className="mr-1">🎯</span> Create Deal
                        </button>
                        <button
                            onClick={() => {
                                setShowComboDealModal('combo');
                                setSelectedProducts([]);
                            }}
                            className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <span className="mr-1">🎁</span> Create Combo
                        </button>
                        <button
                            onClick={updateBestsellerFlags}
                            className="text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            <span className="mr-1">⭐</span> Mark Bestsellers
                        </button>
                        <button
                            onClick={handleSeedProducts}
                            className="text-xs font-bold uppercase tracking-wider bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
                        >
                            <span className="mr-1">📦</span> Restore Defaults
                        </button>
                    </div>
                )}

                {/* Add/Edit Product Form - SIMPLIFIED VERSION */}
                {showAddForm && (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8 shadow-lg">
                        {/* Header with Gradient */}
                        <div className="bg-gradient-to-r from-[#1F3D2B] to-[#2F5D3A] p-6 text-white">
                            <h2 className="text-2xl font-bold">
                                {editingProduct ? '📝 Edit Product' : '✨ Add New Product'}
                            </h2>
                            <p className="text-sm opacity-90 mt-1">
                                {editingProduct ? 'Update product details below' : 'Quick & easy product addition'}
                            </p>
                        </div>

                        <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
                            <div className="p-8">
                                {/* SECTION 1: Essential Info (Always Visible) */}
                                <div className="space-y-6 mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-brand">📦 Essential Info</h3>

                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Product Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                            placeholder="e.g., A2 Cow Bilona Ghee"
                                            required
                                        />
                                    </div>

                                    {/* Price, Size, Category in Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Price (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => {
                                                    const price = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        price,
                                                        isBestseller: price && parseFloat(price) > 999 ? true : formData.isBestseller
                                                    });
                                                }}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                                placeholder="299"
                                                required
                                            />
                                            {formData.price && parseFloat(formData.price) > 999 && (
                                                <p className="text-xs text-gold mt-1 font-semibold">⭐ Auto-marked as Bestseller</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Size / Variant
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.size}
                                                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                                placeholder="500 ml, 1 KG"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none text-lg"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCategoryFormData({ value: '', label: '' });
                                                        setEditingCategory(null);
                                                        setShowCategoryForm(!showCategoryForm);
                                                    }}
                                                    className="px-4 bg-[#1F3D2B] text-white rounded-lg font-bold hover:bg-[#2F5D3A] transition-colors"
                                                    title="Manage Categories"
                                                >
                                                    {showCategoryForm ? '✕' : '+'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modern Image Upload */}
                                    <div className="mb-8">
                                        <DragDropUpload
                                            onFileSelect={(file) => {
                                                setImageFile(file);
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagePreview(reader.result as string);
                                                reader.readAsDataURL(file);
                                                // Marker to show a file is selected
                                                setFormData(prev => ({ ...prev, image: `[FILE:${file.name}]` }));
                                            }}
                                            currentImage={imagePreview || formData.image}
                                            isUploading={isUploadingImage}
                                        />
                                    </div>

                                    {/* Stock Status Toggle */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Stock Status
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                                            className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all ${formData.inStock
                                                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                                : 'bg-red-100 text-red-700 border-2 border-red-500'
                                                }`}
                                        >
                                            {formData.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                                        </button>
                                    </div>

                                    {/* Product Badges (Checkboxes) */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">
                                            Product Badges
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.showOnHome}
                                                    onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                                                    className="w-5 h-5 text-[#1F3D2B]"
                                                />
                                                <span className="text-sm font-semibold">🏠 Homepage</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isBestseller}
                                                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                                                    className="w-5 h-5 text-[#1F3D2B]"
                                                />
                                                <span className="text-sm font-semibold">⭐ Bestseller</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isNew}
                                                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                                    className="w-5 h-5 text-[#1F3D2B]"
                                                />
                                                <span className="text-sm font-semibold">✨ New</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#1F3D2B] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isPrime}
                                                    onChange={(e) => setFormData({ ...formData, isPrime: e.target.checked })}
                                                    className="w-5 h-5 text-[#1F3D2B]"
                                                />
                                                <span className="text-sm font-semibold">⚡ Prime</span>
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* SECTION 2: Optional Details (Collapsible) */}
                            <details className="group mb-8">
                                <summary className="cursor-pointer list-none">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <h3 className="text-lg font-bold text-gray-900">⚙️ Optional: Pricing & Description</h3>
                                        <svg className="w-5 h-5 text-gray-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </summary>
                                <div className="mt-4 p-6 bg-gray-50 rounded-lg space-y-4">
                                    {/* Original Price & Discount */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Original Price (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.originalPrice}
                                                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none"
                                                placeholder="499"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Discount (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none"
                                                placeholder="40"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <RichTextEditor
                                            value={formData.description}
                                            onChange={(value) => setFormData({ ...formData, description: value })}
                                            placeholder="Describe your product..."
                                        />
                                    </div>

                                    {/* Features */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Key Features <span className="text-gray-500 font-normal">(Comma-separated)</span>
                                        </label>
                                        <textarea
                                            value={formData.features}
                                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none resize-none"
                                            placeholder="100% Natural, No Preservatives, Rich in Nutrients"
                                        />
                                    </div>

                                    {/* Benefits */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Benefits <span className="text-gray-500 font-normal">(Comma-separated)</span>
                                        </label>
                                        <textarea
                                            value={formData.benefits}
                                            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none resize-none"
                                            placeholder="Supports health, Maintains flavor"
                                        />
                                    </div>

                                    {/* Rating & Reviews */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Rating (0-5)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="5"
                                                value={formData.rating}
                                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none"
                                                placeholder="4.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Reviews Count
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.reviews}
                                                onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1F3D2B] focus:outline-none"
                                                placeholder="128"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </details>

                            {/* Footer Buttons */}
                            <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isUploadingImage}
                                    className={`flex-1 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-md ${isUploadingImage
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#1F3D2B] to-[#2F5D3A] text-white hover:shadow-lg'
                                        }`}
                                >
                                    {isUploadingImage ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            💾 {editingProduct ? 'Update Product' : 'Save Product'}
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    disabled={isUploadingImage}
                                    onClick={() => {
                                        resetForm();
                                        setShowAddForm(false);
                                    }}
                                    className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )
                }

                {/* Category Management */}
                {showCategoryForm && (
                    <div className="bg-white border-2 border-brand-dark rounded-xl p-6 mb-6 shadow-sm" data-category-form>
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h2>
                        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                                        Category Value <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">(e.g., "spices", "herbs")</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={categoryFormData.value}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
                                        placeholder="spices"
                                        required
                                        disabled={!!editingCategory}
                                    />
                                    {editingCategory && (
                                        <p className="text-xs text-gray-500 mt-1">Value cannot be changed when editing</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                                        Category Label <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">(Display name)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={categoryFormData.label}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, label: e.target.value })}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
                                        placeholder="Spices"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="bg-brand-100 text-brand-dark border-2 border-brand-dark px-8 py-3 rounded-lg font-semibold hover:bg-brand-200 transition-colors"
                                >
                                    {editingCategory ? 'Update Category' : 'Add Category'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryFormData({ value: '', label: '' });
                                        setEditingCategory(null);
                                        setShowCategoryForm(false);
                                    }}
                                    className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>

                        {/* Categories List */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-bold text-black mb-4">All Categories ({categories.length})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div>
                                            <p className="font-semibold text-black">{category.label}</p>
                                            <p className="text-xs text-gray-500">{category.value}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded text-xs font-semibold hover:bg-blue-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded text-xs font-semibold hover:bg-red-200 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {/* Content Area (only show if not adding product/category) */}
                {!showAddForm && !showCategoryForm && (
                    <>
                        {/* Bulk Actions Bar */}
                        {selectedProductsForBulk.length > 0 && (
                            <div className="sticky top-4 z-30 mb-6 bg-brand-forest text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                        {selectedProductsForBulk.length}
                                    </div>
                                    <div>
                                        <p className="font-bold">Items Selected</p>
                                        <p className="text-xs opacity-80">Bulk operations selected</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProductsForBulk([])}
                                        className="ml-auto sm:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
                                    <button
                                        onClick={() => handleBulkToggleStock(true)}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-white/20 whitespace-nowrap"
                                    >
                                        Mark In Stock
                                    </button>
                                    <button
                                        onClick={() => handleBulkToggleStock(false)}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-white/20 whitespace-nowrap"
                                    >
                                        Mark Out of Stock
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-lg whitespace-nowrap"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setSelectedProductsForBulk([])}
                                        className="hidden sm:block p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Professional Product Table */}
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden mb-10">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="p-5 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProductsForBulk.length === filteredProducts.length && filteredProducts.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-5 h-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest cursor-pointer"
                                                />
                                            </th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Product</th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Category</th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Price</th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Stock Status</th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400">Badges</th>
                                            <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className={`hover:bg-brand-50/30 transition-colors group ${selectedProductsForBulk.includes(product.id) ? 'bg-brand-50/50' : ''
                                                        }`}
                                                >
                                                    <td className="p-5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProductsForBulk.includes(product.id)}
                                                            onChange={() => {
                                                                setSelectedProductsForBulk(prev =>
                                                                    prev.includes(product.id)
                                                                        ? prev.filter(id => id !== product.id)
                                                                        : [...prev, product.id]
                                                                );
                                                            }}
                                                            className="w-5 h-5 rounded border-gray-300 text-brand-forest focus:ring-brand-forest cursor-pointer transition-all"
                                                        />
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 relative group-hover:shadow-md transition-shadow">
                                                                <Image
                                                                    src={product.image || PLACEHOLDER_IMAGE}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-contain p-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 group-hover:text-brand-forest transition-colors">{product.name}</p>
                                                                <p className="text-xs text-gray-500 font-medium">{product.size || 'No Size'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-sm font-bold text-gray-600 uppercase tracking-tighter">
                                                        {product.category}
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                                                            {product.originalPrice && product.originalPrice > product.price && (
                                                                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${product.inStock
                                                                ? 'bg-green-50 text-green-700'
                                                                : 'bg-red-50 text-red-700'
                                                                }`}>
                                                                <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.isBestseller && (
                                                                <span className="h-6 w-6 flex items-center justify-center bg-amber-100 text-amber-600 rounded-lg text-xs" title="Bestseller">⭐</span>
                                                            )}
                                                            {product.isNew && (
                                                                <span className="h-6 w-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg text-xs" title="New Product">✨</span>
                                                            )}
                                                            {product.isPrime && (
                                                                <span className="h-6 w-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg text-xs" title="Prime Status">⚡</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setQuickEditProduct(product);
                                                                    setIsQuickEditOpen(true);
                                                                }}
                                                                className="h-9 w-9 flex items-center justify-center bg-brand-50 text-brand-forest rounded-xl hover:bg-brand-forest hover:text-white transition-all"
                                                                title="Quick Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingProduct(product);
                                                                    setFormData({
                                                                        name: product.name,
                                                                        price: product.price.toString(),
                                                                        originalPrice: product.originalPrice?.toString() || '',
                                                                        discount: product.discount?.toString() || '',
                                                                        image: product.image,
                                                                        rating: product.rating.toString(),
                                                                        reviews: (product as any).reviews?.toString() || '0',
                                                                        inStock: product.inStock,
                                                                        category: product.category,
                                                                        size: product.size || '',
                                                                        isNew: product.isNew || false,
                                                                        isBestseller: product.isBestseller || false,
                                                                        freeShipping: (product as any).freeShipping || false,
                                                                        isPrime: product.isPrime || false,
                                                                        showOnHome: product.showOnHome !== false,
                                                                        description: product.description || '',
                                                                        features: Array.isArray(product.features) ? product.features.join(', ') : '',
                                                                        benefits: Array.isArray(product.benefits) ? product.benefits.join(', ') : '',
                                                                    });
                                                                    setImagePreview(product.image);
                                                                    setShowAddForm(true);
                                                                }}
                                                                className="h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-brand-forest hover:text-white transition-all"
                                                                title="Full Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                                title="Delete Product"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-20 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center">
                                                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xl font-bold text-gray-600">No products match your search</p>
                                                            <p className="text-sm text-gray-400">Try adjusting your filters or search term</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSearchQuery('');
                                                                setFilterCategory('all');
                                                                setFilterStock('all');
                                                                setPriceRange({ min: '', max: '' });
                                                            }}
                                                            className="mt-2 px-6 py-2 bg-brand-forest text-white rounded-xl font-bold hover:bg-brand-dark transition-all"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Modals & Overlays */}
                <QuickEditModal
                    product={quickEditProduct}
                    isOpen={isQuickEditOpen}
                    onClose={() => setIsQuickEditOpen(false)}
                    onSave={handleQuickEditSave}
                    categories={categories.map(c => c.value)}
                />

                {/* Combo Deal Modal */}
                {showComboDealModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                setShowComboDealModal(null);
                                setSelectedProducts([]);
                            }}
                        />
                        <div className="relative bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="bg-brand-forest p-6 text-white flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Create {showComboDealModal === 'combo' ? 'Combo' : 'Deal'}</h2>
                                <button
                                    onClick={() => {
                                        setShowComboDealModal(null);
                                        setSelectedProducts([]);
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateComboDeal} className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={comboDealData.name}
                                            onChange={(e) => setComboDealData({ ...comboDealData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-forest focus:ring-1 focus:ring-brand-forest"
                                            placeholder={`Amazing ${showComboDealModal === 'combo' ? 'Combo' : 'Deal'}`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Offer Price (â‚¹)</label>
                                        <input
                                            type="number"
                                            value={comboDealData.price}
                                            onChange={(e) => setComboDealData({ ...comboDealData, price: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-forest focus:ring-1 focus:ring-brand-forest"
                                            placeholder="999"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
                                        <input
                                            type="text"
                                            value={comboDealData.image}
                                            onChange={(e) => setComboDealData({ ...comboDealData, image: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-forest focus:ring-1 focus:ring-brand-forest"
                                            placeholder="/images/all/products image available soon.png"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={comboDealData.description}
                                        onChange={(e) => setComboDealData({ ...comboDealData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-forest focus:ring-1 focus:ring-brand-forest"
                                        rows={3}
                                        placeholder="Product description (will auto-generate if empty)"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Features (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={comboDealData.features}
                                            onChange={(e) => setComboDealData({ ...comboDealData, features: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-forest focus:ring-1 focus:ring-brand-forest"
                                            placeholder="Feature 1, Feature 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Benefits (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={comboDealData.benefits}
                                            onChange={(e) => setComboDealData({ ...comboDealData, benefits: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-forest focus:ring-1 focus:ring-brand-forest"
                                            placeholder="Benefit 1, Benefit 2"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowComboDealModal(null);
                                            setSelectedProducts([]);
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-brand-forest text-white rounded-lg hover:bg-brand-dark transition-colors"
                                    >
                                        Create {showComboDealModal === 'combo' ? 'Combo' : 'Deal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Confirmation Modal */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={() => {
                        confirmModal.onConfirm();
                    }}
                    onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    type={confirmModal.type}
                />
            </div>
        </AdminWrapper>
    );
}


