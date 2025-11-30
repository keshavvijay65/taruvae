'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Product } from '@/context/CartContext';
import { saveProductsToFirebase, getAllProductsFromFirebase } from '@/lib/firebaseProducts';

const CATEGORIES = [
    { value: 'oil', label: 'Oil' },
    { value: 'ghee', label: 'Ghee' },
    { value: 'superfoods', label: 'Spices/Superfoods' },
    { value: 'combo', label: 'Combo' },
    { value: 'deals', label: 'Deals' },
];

// Placeholder image for products without images
const PLACEHOLDER_IMAGE = '/images/all/products image available soon.png';

// Helper function to save products to Firebase and localStorage
const saveProductsToStorage = async (products: Product[]) => {
    // Save to Firebase (this also saves to localStorage as backup)
    await saveProductsToFirebase(products);
};

// Function to get all default products
const getAllDefaultProducts = (): Product[] => {
    return [
        // Cold Pressed Peanut Oil
        { id: 1, name: 'Cold Pressed Peanut Oil', price: 430, size: '1000 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 128, inStock: true, category: 'oil' },
        { id: 2, name: 'Cold Pressed Peanut Oil', price: 250, size: '500 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 95, inStock: true, category: 'oil' },
        { id: 3, name: 'Cold Pressed Peanut Oil', price: 140, size: '250 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 78, inStock: true, category: 'oil' },
        { id: 4, name: 'Cold Pressed Peanut Oil', price: 70, size: '100 ml', image: '/images/products/groundnut oi.jpg', rating: 4.5, reviews: 45, inStock: true, category: 'oil' },
        
        // Cold Pressed Mustard Oil
        { id: 5, name: 'Cold Pressed Mustard Oil', price: 460, size: '1000 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 145, inStock: true, category: 'oil' },
        { id: 6, name: 'Cold Pressed Mustard Oil', price: 260, size: '500 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 112, inStock: true, category: 'oil' },
        { id: 7, name: 'Cold Pressed Mustard Oil', price: 150, size: '250 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 89, inStock: true, category: 'oil' },
        { id: 8, name: 'Cold Pressed Mustard Oil', price: 80, size: '100 ml', image: '/images/products/mustard oil.jpg', rating: 4.6, reviews: 52, inStock: true, category: 'oil' },
        
        // Cold Pressed Sunflower Oil
        { id: 9, name: 'Cold Pressed Sunflower Oil', price: 450, size: '1000 ml', image: '/images/products/sunflower-oil.jpg', rating: 4.4, reviews: 167, inStock: true, category: 'oil' },
        { id: 10, name: 'Cold Pressed Sunflower Oil', price: 260, size: '500 ml', image: '/images/products/sunflower-oil.jpg', rating: 4.4, reviews: 134, inStock: true, category: 'oil' },
        { id: 11, name: 'Cold Pressed Sunflower Oil', price: 150, size: '250 ml', image: '/images/products/sunflower-oil.jpg', rating: 4.4, reviews: 98, inStock: true, category: 'oil' },
        { id: 12, name: 'Cold Pressed Sunflower Oil', price: 80, size: '100 ml', image: '/images/products/sunflower-oil.jpg', rating: 4.4, reviews: 61, inStock: true, category: 'oil' },
        
        // Cold Pressed Coconut Oil
        { id: 13, name: 'Cold Pressed Coconut Oil', price: 590, size: '1000 ml', image: '/images/products/coconut-oil.jpg', rating: 4.6, reviews: 189, inStock: true, category: 'oil' },
        { id: 14, name: 'Cold Pressed Coconut Oil', price: 320, size: '500 ml', image: '/images/products/coconut-oil.jpg', rating: 4.6, reviews: 156, inStock: true, category: 'oil' },
        { id: 15, name: 'Cold Pressed Coconut Oil', price: 180, size: '250 ml', image: '/images/products/coconut-oil.jpg', rating: 4.6, reviews: 123, inStock: true, category: 'oil' },
        { id: 16, name: 'Cold Pressed Coconut Oil', price: 90, size: '100 ml', image: '/images/products/coconut-oil.jpg', rating: 4.6, reviews: 87, inStock: true, category: 'oil' },
        
        // Cold Pressed Sesame Oil
        { id: 17, name: 'Cold Pressed Sesame Oil', price: 510, size: '1000 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 178, inStock: true, category: 'oil' },
        { id: 18, name: 'Cold Pressed Sesame Oil', price: 280, size: '500 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 145, inStock: true, category: 'oil' },
        { id: 19, name: 'Cold Pressed Sesame Oil', price: 160, size: '250 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 112, inStock: true, category: 'oil' },
        { id: 20, name: 'Cold Pressed Sesame Oil', price: 85, size: '100 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 78, inStock: true, category: 'oil' },
        
        // Virgin Coconut Oil
        { id: 21, name: 'Virgin Coconut Oil', price: 1290, size: '1000 ml', image: '/images/products/coconut-oil.jpg', rating: 4.8, reviews: 203, inStock: true, category: 'oil', isBestseller: true },
        { id: 22, name: 'Virgin Coconut Oil', price: 680, size: '500 ml', image: '/images/products/coconut-oil.jpg', rating: 4.8, reviews: 178, inStock: true, category: 'oil' },
        { id: 23, name: 'Virgin Coconut Oil', price: 380, size: '250 ml', image: '/images/products/coconut-oil.jpg', rating: 4.8, reviews: 145, inStock: true, category: 'oil' },
        { id: 24, name: 'Virgin Coconut Oil', price: 190, size: '100 ml', image: '/images/products/coconut-oil.jpg', rating: 4.8, reviews: 112, inStock: true, category: 'oil' },
        
        // Cold Pressed Almond Oil
        { id: 25, name: 'Cold Pressed Almond Oil', price: 1200, size: '1000 ml', image: '/images/products/coconut-oil.jpg', rating: 4.7, reviews: 192, inStock: true, category: 'oil', isBestseller: true },
        { id: 26, name: 'Cold Pressed Almond Oil', price: 650, size: '500 ml', image: '/images/products/coconut-oil.jpg', rating: 4.7, reviews: 167, inStock: true, category: 'oil' },
        { id: 27, name: 'Cold Pressed Almond Oil', price: 360, size: '250 ml', image: '/images/products/coconut-oil.jpg', rating: 4.7, reviews: 134, inStock: true, category: 'oil' },
        { id: 28, name: 'Cold Pressed Almond Oil', price: 180, size: '100 ml', image: '/images/products/coconut-oil.jpg', rating: 4.7, reviews: 98, inStock: true, category: 'oil' },
        
        // Cold Pressed Olive Oil
        { id: 29, name: 'Cold Pressed Olive Oil', price: 1810, size: '1000 ml', image: '/images/products/olive-oil.jpg', rating: 4.5, reviews: 156, inStock: true, category: 'oil', isBestseller: true },
        { id: 30, name: 'Cold Pressed Olive Oil', price: 950, size: '500 ml', image: '/images/products/olive-oil.jpg', rating: 4.5, reviews: 134, inStock: true, category: 'oil' },
        { id: 31, name: 'Cold Pressed Olive Oil', price: 520, size: '250 ml', image: '/images/products/olive-oil.jpg', rating: 4.5, reviews: 112, inStock: true, category: 'oil' },
        { id: 32, name: 'Cold Pressed Olive Oil', price: 260, size: '100 ml', image: '/images/products/olive-oil.jpg', rating: 4.5, reviews: 89, inStock: true, category: 'oil' },
        
        // Cold Pressed Castor Oil
        { id: 33, name: 'Cold Pressed Castor Oil', price: 420, size: '1000 ml', image: '/images/products/coconut-oil.jpg', rating: 4.4, reviews: 134, inStock: true, category: 'oil' },
        { id: 34, name: 'Cold Pressed Castor Oil', price: 240, size: '500 ml', image: '/images/products/coconut-oil.jpg', rating: 4.4, reviews: 112, inStock: true, category: 'oil' },
        { id: 35, name: 'Cold Pressed Castor Oil', price: 140, size: '250 ml', image: '/images/products/coconut-oil.jpg', rating: 4.4, reviews: 89, inStock: true, category: 'oil' },
        { id: 36, name: 'Cold Pressed Castor Oil', price: 70, size: '100 ml', image: '/images/products/coconut-oil.jpg', rating: 4.4, reviews: 67, inStock: true, category: 'oil' },
        
        // Premium Desi Cow Bilona Ghee
        { id: 37, name: 'Premium Desi Cow Bilona Ghee', price: 1450, size: '1 KG', image: '/images/products/ghee.jpg', rating: 4.8, reviews: 256, inStock: true, category: 'ghee', isBestseller: true },
        { id: 38, name: 'Premium Desi Cow Bilona Ghee', price: 750, size: '500 GM', image: '/images/products/ghee.jpg', rating: 4.8, reviews: 223, inStock: true, category: 'ghee' },
        { id: 39, name: 'Premium Desi Cow Bilona Ghee', price: 320, size: '200 GM', image: '/images/products/ghee.jpg', rating: 4.8, reviews: 189, inStock: true, category: 'ghee' },
        
        // Pure Hing (Asafoetida)
        { id: 40, name: 'Pure Hing (Asafoetida)', price: 280, size: '50 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.6, reviews: 145, inStock: true, category: 'superfoods' },
        { id: 41, name: 'Pure Hing (Asafoetida)', price: 150, size: '25 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.6, reviews: 112, inStock: true, category: 'superfoods' },
        { id: 42, name: 'Pure Hing (Asafoetida)', price: 80, size: '10 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.6, reviews: 89, inStock: true, category: 'superfoods' },
        
        // Jeeravan Masala
        { id: 43, name: 'Jeeravan Masala', price: 180, size: '250 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.5, reviews: 167, inStock: true, category: 'superfoods' },
        { id: 44, name: 'Jeeravan Masala', price: 100, size: '100 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.5, reviews: 134, inStock: true, category: 'superfoods' },
        { id: 45, name: 'Jeeravan Masala', price: 60, size: '50 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.5, reviews: 112, inStock: true, category: 'superfoods' },
        { id: 46, name: 'Jeeravan Masala', price: 35, size: '25 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.5, reviews: 89, inStock: true, category: 'superfoods' },
        { id: 47, name: 'Jeeravan Masala', price: 20, size: '10 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.5, reviews: 67, inStock: true, category: 'superfoods' },
        
        // Garam Masala
        { id: 48, name: 'Garam Masala', price: 200, size: '250 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.7, reviews: 189, inStock: true, category: 'superfoods' },
        { id: 49, name: 'Garam Masala', price: 110, size: '100 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.7, reviews: 156, inStock: true, category: 'superfoods' },
        { id: 50, name: 'Garam Masala', price: 65, size: '50 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.7, reviews: 123, inStock: true, category: 'superfoods' },
        { id: 51, name: 'Garam Masala', price: 38, size: '25 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.7, reviews: 98, inStock: true, category: 'superfoods' },
        { id: 52, name: 'Garam Masala', price: 22, size: '10 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.7, reviews: 78, inStock: true, category: 'superfoods' },
        
        // 100% Arabica Coffee Powder
        { id: 53, name: '100% Arabica Coffee Powder', price: 450, size: '250 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.6, reviews: 178, inStock: true, category: 'superfoods' },
        { id: 54, name: '100% Arabica Coffee Powder', price: 250, size: '100 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.6, reviews: 145, inStock: true, category: 'superfoods' },
        { id: 55, name: '100% Arabica Coffee Powder', price: 140, size: '50 GM', image: '/images/all/IMG-20251019-WA0015.jpg', rating: 4.6, reviews: 112, inStock: true, category: 'superfoods' },
    ];
};

export default function AdminProductsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    
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
        onConfirm: () => {},
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
    });

    useEffect(() => {
        const auth = localStorage.getItem('admin-authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
            loadProducts();
        } else {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const loadProducts = async () => {
        try {
            // First try to load from Firebase
            let loadedProducts = await getAllProductsFromFirebase();
            
            // Check localStorage for existing products (migration scenario)
            const localProductsStr = localStorage.getItem('taruvae-admin-products');
            let localProducts: Product[] = [];
            if (localProductsStr) {
                try {
                    localProducts = JSON.parse(localProductsStr);
                } catch (e) {
                    console.error('Error parsing localStorage products:', e);
                }
            }
            
            // Migration logic: If localStorage has products and Firebase is empty or has only defaults
            // Migrate localStorage data to Firebase
            if (localProducts && localProducts.length > 0) {
                const defaultProducts = getAllDefaultProducts();
                const defaultProductIds = new Set(defaultProducts.map(p => p.id));
                
                // Check if Firebase has only default products (or is empty)
                const firebaseHasOnlyDefaults = !loadedProducts || loadedProducts.length === 0 || 
                    loadedProducts.every(p => defaultProductIds.has(p.id));
                
                // If localStorage has more products than defaults, migrate to Firebase
                if (localProducts.length > defaultProducts.length || 
                    (firebaseHasOnlyDefaults && localProducts.length > 0)) {
                    console.log('Migrating products from localStorage to Firebase...');
                    loadedProducts = localProducts;
                    // Save to Firebase
                    await saveProductsToStorage(localProducts);
                    showToast(`Migrated ${localProducts.length} products to Firebase!`, 'success');
                }
            }
            
            // If no products in Firebase and no localStorage, use defaults
            if (!loadedProducts || loadedProducts.length === 0) {
                loadedProducts = getAllDefaultProducts();
                // Save defaults to Firebase
                await saveProductsToStorage(loadedProducts);
            }
            
            // Auto-mark products with price > 999 as bestseller
            const updatedProducts = loadedProducts.map((product: Product) => ({
                ...product,
                isBestseller: product.price > 999 ? true : (product.isBestseller || false),
            }));
            
            setProducts(updatedProducts);
            
            // Update Firebase with bestseller flags if they changed
            const hasChanges = updatedProducts.some((p, i) => 
                p.isBestseller !== loadedProducts[i]?.isBestseller
            );
            if (hasChanges) {
                await saveProductsToStorage(updatedProducts);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to localStorage
            const savedProducts = localStorage.getItem('taruvae-admin-products');
            if (savedProducts) {
                try {
                    const parsed = JSON.parse(savedProducts);
                    setProducts(parsed);
                } catch (e) {
                    console.error('Error parsing localStorage:', e);
                    const defaultProducts = getAllDefaultProducts();
                    setProducts(defaultProducts);
                }
            } else {
                const defaultProducts = getAllDefaultProducts();
                setProducts(defaultProducts);
                saveProductsToStorage(defaultProducts);
            }
        }
    };

    const handleLoadAllProducts = () => {
        showConfirm(
            'Load All Products',
            'This will replace all existing products with the default product list. Are you sure?',
            async () => {
                const defaultProducts = getAllDefaultProducts();
                setProducts(defaultProducts);
                await saveProductsToStorage(defaultProducts);
                showToast('All products loaded successfully!', 'success');
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            'warning'
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
        showToast('Bestseller flags updated! Products above ₹999 are now marked as bestseller.', 'success');
    };

    // Removed saveProducts - now using functional updates directly

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields (Image is optional, will use placeholder)
        if (!formData.name.trim() || !formData.price.trim()) {
            showToast('Please fill in all required fields (Name, Price)', 'error');
            return;
        }

        const price = parseFloat(formData.price);
        const newProduct: Product = {
            id: Date.now(),
            name: formData.name.trim(),
            price: price,
            originalPrice: formData.originalPrice && formData.originalPrice.trim() ? parseFloat(formData.originalPrice) : undefined,
            discount: formData.discount && formData.discount.trim() ? parseFloat(formData.discount) : undefined,
            // Use placeholder if image is empty
            image: formData.image.trim() || PLACEHOLDER_IMAGE,
            rating: parseFloat(formData.rating) || 4.5,
            reviews: parseInt(formData.reviews) || 0,
            inStock: formData.inStock,
            category: formData.category,
            size: formData.size && formData.size.trim() ? formData.size.trim() : undefined,
            isNew: formData.isNew,
            // Auto-mark as bestseller if price > 999, otherwise use formData value
            isBestseller: price > 999 ? true : formData.isBestseller,
            isPrime: formData.isPrime,
        };
        
        // Use functional update to ensure we have the latest products state
        setProducts(currentProducts => {
            const updatedProducts = [...currentProducts, newProduct];
            saveProductsToStorage(updatedProducts);
            return updatedProducts;
        });
        
        resetForm();
        setShowAddForm(false);
        
        showToast('Product added successfully!', 'success');
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
        });
        setShowAddForm(true);
    };

    const handleUpdateProduct = (e: React.FormEvent) => {
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
        const updatedProduct: Product = {
            id: productToEdit.id,
            name: formData.name.trim(),
            price: price,
            originalPrice: formData.originalPrice && formData.originalPrice.trim() ? parseFloat(formData.originalPrice) : undefined,
            discount: formData.discount && formData.discount.trim() ? parseFloat(formData.discount) : undefined,
            // Use placeholder if image is empty
            image: formData.image.trim() || PLACEHOLDER_IMAGE,
            rating: parseFloat(formData.rating) || 4.5,
            reviews: parseInt(formData.reviews) || 0,
            inStock: formData.inStock,
            category: formData.category,
            size: formData.size && formData.size.trim() ? formData.size.trim() : undefined,
            isNew: formData.isNew,
            // Auto-mark as bestseller if price > 999, otherwise use formData value
            isBestseller: price > 999 ? true : formData.isBestseller,
        };

        // Use functional update to ensure we have the latest products state
        setProducts(currentProducts => {
            const updatedProducts = currentProducts.map(p =>
                p.id === productToEdit.id ? updatedProduct : p
            );
            
            // Save to Firebase
            saveProductsToStorage(updatedProducts);
            
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
        });
        setEditingProduct(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="py-8 md:py-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center gap-2 text-[#2D5016] hover:text-[#D4AF37] mb-4 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Products Management
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={updateBestsellerFlags}
                                className="bg-[#FF6F00] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E85D00] transition-colors"
                                title="Mark products above ₹999 as bestseller"
                            >
                                ⭐ Update Bestseller
                            </button>
                            <button
                                onClick={handleLoadAllProducts}
                                className="bg-[#D4AF37] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#B8941F] transition-colors"
                            >
                                📦 Load All Products
                            </button>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowAddForm(!showAddForm);
                                }}
                                className="bg-[#2D5016] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                            >
                                {showAddForm ? 'Cancel' : '+ Add Product'}
                            </button>
                        </div>
                    </div>

                    {/* Add/Edit Product Form */}
                    {showAddForm && (
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mb-6 shadow-sm">
                            <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Product Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Price (₹) <span className="text-red-500">*</span>
                                        {formData.price && parseFloat(formData.price) > 999 && (
                                            <span className="ml-2 text-xs text-[#FF6F00] font-semibold">(Will be marked as Bestseller)</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => {
                                            const price = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                price,
                                                // Auto-check bestseller if price > 999
                                                isBestseller: price && parseFloat(price) > 999 ? true : formData.isBestseller
                                            });
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="299"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Original Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.originalPrice}
                                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="499"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Discount (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Image URL <span className="text-gray-400 text-xs font-normal">(Optional - placeholder will be used if empty)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="/images/products/product.jpg (or leave empty for placeholder)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Rating
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="4.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Reviews Count
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.reviews}
                                        onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="128"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Size (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                        placeholder="500 ml, 1 KG, etc."
                                    />
                                </div>
                                <div className="flex flex-col gap-4">
                                    {/* Out of Stock Toggle Button */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Stock Status
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                                            className={`w-full px-6 py-3 rounded-lg font-bold text-base transition-all duration-300 ${
                                                formData.inStock
                                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                                            }`}
                                        >
                                            {formData.inStock ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    In Stock
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Out of Stock
                                                </span>
                                            )}
                                        </button>
                                        <p className="mt-2 text-xs text-gray-500">
                                            {formData.inStock 
                                                ? 'Product is available for customers to purchase'
                                                : 'Product will show as "Out of Stock" to customers'}
                                        </p>
                                    </div>
                                    
                                    {/* Other Checkboxes */}
                                    <div className="flex flex-wrap items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isNew}
                                                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">New Product</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isBestseller}
                                                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                                <span>⭐</span>
                                                <span>Bestseller</span>
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.freeShipping}
                                                onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">Free Shipping</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPrime}
                                                onChange={(e) => setFormData({ ...formData, isPrime: e.target.checked })}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                                <span>⚡</span>
                                                <span>Prime (Fast Delivery)</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="submit"
                                    className="bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                                >
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                        setShowAddForm(false);
                                    }}
                                    className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            </form>
                        </div>
                    )}

                    {/* Products List */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            All Products ({products.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Rating</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                                                    {(() => {
                                                        const placeholderImage = '/images/all/products image available soon.png';
                                                        const imageSrc = (product.image && product.image.trim() !== '') ? product.image : placeholderImage;
                                                        
                                                        if (imageSrc.startsWith('http')) {
                                                            return (
                                                                <img
                                                                    src={imageSrc}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = placeholderImage;
                                                                    }}
                                                                />
                                                            );
                                                        } else {
                                                            return (
                                                                <Image
                                                                    src={imageSrc}
                                                                    alt={product.name}
                                                                    width={64}
                                                                    height={64}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = placeholderImage;
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-black">{product.name}</p>
                                                {product.size && (
                                                    <p className="text-xs text-gray-500">{product.size}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 bg-[#F5F1EB] text-[#2D5016] rounded text-xs font-semibold">
                                                    {product.category || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-[#2D5016]">₹{product.price}</p>
                                                {product.originalPrice && (
                                                    <p className="text-xs text-gray-400 line-through">₹{product.originalPrice}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="text-sm font-semibold">{product.rating}</span>
                                                    <span className="text-xs text-gray-500">({product.reviews})</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => {
                                                        setProducts(currentProducts => {
                                                            const updatedProducts = currentProducts.map(p =>
                                                                p.id === product.id ? { ...p, inStock: !p.inStock } : p
                                                            );
                                                            saveProductsToStorage(updatedProducts);
                                                            return updatedProducts;
                                                        });
                                                    }}
                                                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                                        product.inStock 
                                                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                                    }`}
                                                >
                                                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditProduct(product)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            
            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />
            
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
    );
}


