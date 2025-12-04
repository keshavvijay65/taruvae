import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllProductsFromFirebase, Product } from '@/lib/firebaseProducts';
import ProductDetailClient from './ProductDetailClient';

// Function to get default product IDs for static generation
function getDefaultProductIds(): number[] {
    // Return default product IDs (1-55 based on default products)
    return Array.from({ length: 55 }, (_, i) => i + 1);
}

// Required for static export - generate static params for product pages
export async function generateStaticParams() {
    try {
        // Try to get products from Firebase/localStorage
        const products = await getAllProductsFromFirebase();
        if (products && products.length > 0) {
            return products.map((product) => ({
                id: product.id.toString(),
            }));
        }
    } catch (error) {
        console.error('Error loading products for static generation:', error);
    }
    
    // Fallback to default product IDs
    return getDefaultProductIds().map((id) => ({
        id: id.toString(),
    }));
}

// Get default products (same as in products page)
function getAllDefaultProducts(): Product[] {
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
        { id: 9, name: 'Cold Pressed Sunflower Oil', price: 450, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 167, inStock: true, category: 'oil' },
        { id: 10, name: 'Cold Pressed Sunflower Oil', price: 260, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 134, inStock: true, category: 'oil' },
        { id: 11, name: 'Cold Pressed Sunflower Oil', price: 150, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 98, inStock: true, category: 'oil' },
        { id: 12, name: 'Cold Pressed Sunflower Oil', price: 80, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 61, inStock: true, category: 'oil' },
        
        // Cold Pressed Coconut Oil
        { id: 13, name: 'Cold Pressed Coconut Oil', price: 590, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 189, inStock: true, category: 'oil' },
        { id: 14, name: 'Cold Pressed Coconut Oil', price: 320, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 156, inStock: true, category: 'oil' },
        { id: 15, name: 'Cold Pressed Coconut Oil', price: 180, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 123, inStock: true, category: 'oil' },
        { id: 16, name: 'Cold Pressed Coconut Oil', price: 90, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 87, inStock: true, category: 'oil' },
        
        // Cold Pressed Sesame Oil
        { id: 17, name: 'Cold Pressed Sesame Oil', price: 510, size: '1000 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 178, inStock: true, category: 'oil' },
        { id: 18, name: 'Cold Pressed Sesame Oil', price: 280, size: '500 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 145, inStock: true, category: 'oil' },
        { id: 19, name: 'Cold Pressed Sesame Oil', price: 160, size: '250 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 112, inStock: true, category: 'oil' },
        { id: 20, name: 'Cold Pressed Sesame Oil', price: 85, size: '100 ml', image: '/images/products/seasame oil.jpg', rating: 4.7, reviews: 78, inStock: true, category: 'oil' },
        
        // Virgin Coconut Oil
        { id: 21, name: 'Virgin Coconut Oil', price: 1290, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 203, inStock: true, category: 'oil', isBestseller: true },
        { id: 22, name: 'Virgin Coconut Oil', price: 680, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 178, inStock: true, category: 'oil' },
        { id: 23, name: 'Virgin Coconut Oil', price: 380, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 145, inStock: true, category: 'oil' },
        { id: 24, name: 'Virgin Coconut Oil', price: 190, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.8, reviews: 112, inStock: true, category: 'oil' },
        
        // Cold Pressed Almond Oil
        { id: 25, name: 'Cold Pressed Almond Oil', price: 1200, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 192, inStock: true, category: 'oil', isBestseller: true },
        { id: 26, name: 'Cold Pressed Almond Oil', price: 650, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 167, inStock: true, category: 'oil' },
        { id: 27, name: 'Cold Pressed Almond Oil', price: 360, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 134, inStock: true, category: 'oil' },
        { id: 28, name: 'Cold Pressed Almond Oil', price: 180, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.7, reviews: 98, inStock: true, category: 'oil' },
        
        // Cold Pressed Olive Oil
        { id: 29, name: 'Cold Pressed Olive Oil', price: 1810, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 156, inStock: true, category: 'oil', isBestseller: true },
        { id: 30, name: 'Cold Pressed Olive Oil', price: 950, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 134, inStock: true, category: 'oil' },
        { id: 31, name: 'Cold Pressed Olive Oil', price: 520, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 112, inStock: true, category: 'oil' },
        { id: 32, name: 'Cold Pressed Olive Oil', price: 260, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 89, inStock: true, category: 'oil' },
        
        // Cold Pressed Castor Oil
        { id: 33, name: 'Cold Pressed Castor Oil', price: 420, size: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 134, inStock: true, category: 'oil' },
        { id: 34, name: 'Cold Pressed Castor Oil', price: 240, size: '500 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 112, inStock: true, category: 'oil' },
        { id: 35, name: 'Cold Pressed Castor Oil', price: 140, size: '250 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 89, inStock: true, category: 'oil' },
        { id: 36, name: 'Cold Pressed Castor Oil', price: 70, size: '100 ml', image: '/images/all/products image available soon.png', rating: 4.4, reviews: 67, inStock: true, category: 'oil' },
        
        // Premium Desi Cow Bilona Ghee
        { id: 37, name: 'Premium Desi Cow Bilona Ghee', price: 1450, size: '1 KG', image: '/images/products/GHEE.png', rating: 4.8, reviews: 256, inStock: true, category: 'ghee', isBestseller: true },
        { id: 38, name: 'Premium Desi Cow Bilona Ghee', price: 750, size: '500 GM', image: '/images/products/GHEE.png', rating: 4.8, reviews: 223, inStock: true, category: 'ghee' },
        { id: 39, name: 'Premium Desi Cow Bilona Ghee', price: 320, size: '200 GM', image: '/images/products/GHEE.png', rating: 4.8, reviews: 189, inStock: true, category: 'ghee' },
        
        // Pure Hing (Asafoetida)
        { id: 40, name: 'Pure Hing (Asafoetida)', price: 280, size: '50 GM', image: '/images/products/Hing.png', rating: 4.6, reviews: 145, inStock: true, category: 'superfoods' },
        { id: 41, name: 'Pure Hing (Asafoetida)', price: 150, size: '25 GM', image: '/images/products/Hing.png', rating: 4.6, reviews: 112, inStock: true, category: 'superfoods' },
        { id: 42, name: 'Pure Hing (Asafoetida)', price: 80, size: '10 GM', image: '/images/products/Hing.png', rating: 4.6, reviews: 89, inStock: true, category: 'superfoods' },
        
        // Jeeravan Masala
        { id: 43, name: 'Jeeravan Masala', price: 180, size: '250 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 167, inStock: true, category: 'superfoods' },
        { id: 44, name: 'Jeeravan Masala', price: 100, size: '100 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 134, inStock: true, category: 'superfoods' },
        { id: 45, name: 'Jeeravan Masala', price: 60, size: '50 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 112, inStock: true, category: 'superfoods' },
        { id: 46, name: 'Jeeravan Masala', price: 35, size: '25 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 89, inStock: true, category: 'superfoods' },
        { id: 47, name: 'Jeeravan Masala', price: 20, size: '10 GM', image: '/images/all/products image available soon.png', rating: 4.5, reviews: 67, inStock: true, category: 'superfoods' },
        
        // Garam Masala
        { id: 48, name: 'Garam Masala', price: 200, size: '250 GM', image: '/images/products/Garam%20Masala.jpeg', rating: 4.7, reviews: 189, inStock: true, category: 'superfoods' },
        { id: 49, name: 'Garam Masala', price: 110, size: '100 GM', image: '/images/products/Garam%20Masala.jpeg', rating: 4.7, reviews: 156, inStock: true, category: 'superfoods' },
        { id: 50, name: 'Garam Masala', price: 65, size: '50 GM', image: '/images/products/Garam%20Masala.jpeg', rating: 4.7, reviews: 123, inStock: true, category: 'superfoods' },
        { id: 51, name: 'Garam Masala', price: 38, size: '25 GM', image: '/images/products/Garam%20Masala.jpeg', rating: 4.7, reviews: 98, inStock: true, category: 'superfoods' },
        { id: 52, name: 'Garam Masala', price: 22, size: '10 GM', image: '/images/products/Garam%20Masala.jpeg', rating: 4.7, reviews: 78, inStock: true, category: 'superfoods' },
        
        // 100% Arabica Coffee Powder
        { id: 53, name: '100% Arabica Coffee Powder', price: 450, size: '250 GM', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 178, inStock: true, category: 'superfoods' },
        { id: 54, name: '100% Arabica Coffee Powder', price: 250, size: '100 GM', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 145, inStock: true, category: 'superfoods' },
        { id: 55, name: '100% Arabica Coffee Powder', price: 140, size: '50 GM', image: '/images/all/products image available soon.png', rating: 4.6, reviews: 112, inStock: true, category: 'superfoods' },
    ];
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { id } = await params;
    const productId = parseInt(id);

    // Load product data
    let product: Product | null = null;
    let products: Product[] = [];

    try {
        const allProducts = await getAllProductsFromFirebase();
        if (allProducts && allProducts.length > 0) {
            products = allProducts;
            product = allProducts.find(p => p.id === productId) || null;
        } else {
            // Fallback to default products
            products = getAllDefaultProducts();
            product = products.find(p => p.id === productId) || null;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to default products
        products = getAllDefaultProducts();
        product = products.find(p => p.id === productId) || null;
    }

    return (
        <div className="min-h-screen rich-gradient">
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>

            <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl">
                    {product ? (
                        <ProductDetailClient product={product} products={products} />
                    ) : (
                        <div className="text-center py-20">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
                            <a
                                href="/products"
                                className="bg-[#2D5016] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors inline-block"
                            >
                                Browse Products
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Footer />
            </Suspense>
        </div>
    );
}
