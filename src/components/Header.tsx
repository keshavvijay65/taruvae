'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isMobileBlogsOpen, setIsMobileBlogsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { getTotalItems } = useCart();
    const { getWishlistCount } = useWishlist();
    const { isAuthenticated, user } = useAuth();
    const cartCount = getTotalItems();
    const wishlistCount = getWishlistCount();
    const router = useRouter();
    const searchParams = useSearchParams();

    const productNavLinks = [
        { label: 'All Products', filter: 'all' },
        { label: 'Oil', filter: 'oil' },
        { label: 'Ghee', filter: 'ghee' },
        { label: 'Spices', filter: 'superfoods' },
        { label: 'Combo', filter: 'combo' },
        { label: 'Superfoods', filter: 'superfoods' },
        { label: 'Deals', filter: 'deals' },
    ];

    const blogLinks = [
        { label: 'Medicinal Recipes', href: '/blogs/medicinal-recipes' },
        { label: 'Healthy Recipes', href: '/blogs/healthy-recipes' },
        { label: 'Anveshan Blogs', href: '/blogs/anveshan' },
    ];

    const getProductsHref = (filter: string) =>
        filter === 'all' ? '/products' : `/products?filter=${filter}`;

    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        setSearchTerm(currentSearch);
    }, [searchParams]);

    const buildSearchUrl = (query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('search');
        if (query) {
            params.set('search', query);
        }
        return `/products${params.toString() ? `?${params.toString()}` : ''}`;
    };

    const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const query = searchTerm.trim();
        router.push(buildSearchUrl(query));
        setIsSearchOpen(false);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        router.push(buildSearchUrl(''));
    };

    const renderSearchField = (variant: 'desktop' | 'mobile') => (
        <form
            onSubmit={handleSearchSubmit}
            className={`relative ${variant === 'desktop' ? 'hidden lg:block' : 'w-full'}`}
        >
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                autoFocus={variant === 'mobile'}
                className={`${variant === 'desktop'
                    ? 'w-40 md:w-56'
                    : 'w-full'
                    } pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 rounded-full border border-gray-200 bg-gray-50 focus:border-[#2D5016] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5016]/10 text-xs sm:text-sm placeholder:text-gray-400 transition-all`}
            />
            <button
                type="submit"
                aria-label="Search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
            {searchTerm && (
                <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D5016]"
                >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}
        </form>
    );

    return (
        <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-sm border-b border-gray-200 w-full">
            <div className="w-full max-w-full overflow-x-hidden">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-10 max-w-7xl w-full">
                    <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-3">
                        {/* Left Side - Logo */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-1.5 -ml-1 text-[#2D5016] hover:bg-gray-50 rounded flex-shrink-0"
                                aria-label="Menu"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>

                            {/* Logo */}
                            <Link href="/" className="flex items-center flex-shrink-0 min-w-0">
                                <Image
                                    src="/images/Logo & favicon/Taruvaé Logo Transparent Rectangle.svg"
                                    alt="Taruvae"
                                    width={180}
                                    height={56}
                                    className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto max-h-[56px] object-contain"
                                    priority
                                    style={{ maxWidth: '180px', height: 'auto' }}
                                />
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
                            <Link
                                href="/products"
                                className="text-sm font-semibold text-[#2D5016] hover:text-[#D4AF37] transition-colors"
                            >
                                Products
                            </Link>
                            {productNavLinks.slice(1, 5).map((link) => (
                                <Link
                                    key={link.label}
                                    href={getProductsHref(link.filter)}
                                    className="text-sm font-medium text-gray-700 hover:text-[#2D5016] transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/orders"
                                className="text-sm font-medium text-gray-700 hover:text-[#2D5016] transition-colors"
                            >
                                My Orders
                            </Link>
                            {/* More button - Commented out */}
                            {/* <div
                                className="relative"
                                onMouseEnter={() => setActiveDropdown('more')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#2D5016] transition-colors">
                                    More
                                    <svg
                                        className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'more' ? 'rotate-180' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {activeDropdown === 'more' && (
                                    <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50">
                                        {productNavLinks.slice(5).map((link) => (
                                            <Link
                                                key={link.label}
                                                href={getProductsHref(link.filter)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F1EB] hover:text-[#2D5016]"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                        <div className="border-t border-gray-100 my-1"></div>
                                        {blogLinks.map((blog) => (
                                            <Link
                                                key={blog.href}
                                                href={blog.href}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F1EB] hover:text-[#2D5016]"
                                            >
                                                {blog.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div> */}
                            <Link
                                href="/blog"
                                className="text-sm font-medium text-gray-700 hover:text-[#2D5016] transition-colors"
                            >
                                Blog
                            </Link>
                        </nav>

                        {/* Right Side - Search & Cart */}
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
                            {/* Search Icon - Mobile */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="lg:hidden p-1.5 sm:p-2 text-[#2D5016] hover:bg-gray-50 rounded"
                                aria-label="Toggle search"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            {/* Search Bar - Desktop */}
                            {renderSearchField('desktop')}

                            {/* Account/Login */}
                            {isAuthenticated ? (
                                <Link href="/account" className="p-1.5 sm:p-2 text-[#2D5016] hover:text-[#D4AF37] transition-colors" aria-label="My Account" title={user?.name || 'My Account'}>
                                    {user?.photoURL ? (
                                        <img 
                                            src={user.photoURL} 
                                            alt={user.name} 
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#2D5016]"
                                        />
                                    ) : (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </Link>
                            ) : (
                                <Link href="/login" className="p-1.5 sm:p-2 text-[#2D5016] hover:text-[#D4AF37] transition-colors" aria-label="Login">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </Link>
                            )}

                            {/* Wishlist */}
                            <Link href="/wishlist" className="relative p-1.5 sm:p-2 text-[#2D5016] hover:text-[#D4AF37] transition-colors" aria-label="Wishlist">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-white text-[9px] sm:text-[10px] rounded-full w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center font-bold">
                                        {wishlistCount > 9 ? '9+' : wishlistCount}
                                    </span>
                                )}
                            </Link>

                            {/* Shopping Cart */}
                            <Link href="/cart" className="relative p-1.5 sm:p-2 text-[#2D5016] hover:text-[#D4AF37] transition-colors" aria-label="Shopping Cart">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-white text-[9px] sm:text-[10px] rounded-full w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center font-bold">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    {isSearchOpen && (
                        <div className="lg:hidden pb-3">
                            {renderSearchField('mobile')}
                        </div>
                    )}
                </div>

                {/* Mobile Menu */}
                <div className="border-t border-gray-100 lg:hidden bg-white">
                    <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen pb-3' : 'max-h-0'}`}>
                        <nav className="pt-2">
                            {productNavLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={getProductsHref(link.filter)}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block py-2.5 px-4 text-[#2D5016] hover:bg-gray-50 font-medium text-sm"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {isAuthenticated ? (
                                <Link
                                    href="/account"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block py-2.5 px-4 text-[#2D5016] hover:bg-gray-50 font-medium text-sm"
                                >
                                    My Account
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block py-2.5 px-4 text-[#2D5016] hover:bg-gray-50 font-medium text-sm"
                                >
                                    Login / Register
                                </Link>
                            )}
                            <Link
                                href="/orders"
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-2.5 px-4 text-[#2D5016] hover:bg-gray-50 font-medium text-sm"
                            >
                                My Orders
                            </Link>
                            <Link
                                href="/wishlist"
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-2.5 px-4 text-[#2D5016] hover:bg-gray-50 font-medium text-sm"
                            >
                                Wishlist
                            </Link>
                            <div className="mt-1">
                                <button
                                    onClick={() => setIsMobileBlogsOpen(!isMobileBlogsOpen)}
                                    className="w-full flex items-center justify-between py-2.5 px-4 text-[#2D5016] font-medium text-sm hover:bg-gray-50"
                                >
                                    Blogs
                                    <svg
                                        className={`w-4 h-4 transition-transform ${isMobileBlogsOpen ? 'rotate-180' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {isMobileBlogsOpen && (
                                    <div className="pl-6 border-l-2 border-gray-100">
                                        {blogLinks.map((blog) => (
                                            <Link
                                                key={blog.href}
                                                href={blog.href}
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    setIsMobileBlogsOpen(false);
                                                }}
                                                className="flex items-center gap-2 py-2 text-[#2D5016] text-sm hover:text-[#D4AF37]"
                                            >
                                                {blog.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}
