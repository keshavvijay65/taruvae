'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    // HYDRATION FIX: Only render client-side values after mount
    const [mounted, setMounted] = useState(false);

    const { cart, isHydrated } = useCart();
    const { getWishlistCount } = useWishlist();
    const { isAuthenticated, user } = useAuth();

    // Reactively compute cart count from cart state - updates instantly
    const cartCount = mounted ? cart.reduce((total, item) => total + item.quantity, 0) : 0;
    const wishlistCount = mounted ? getWishlistCount() : 0;
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();


    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                // Get the top bar height from the CSS variable
                const topBarHeightStr = getComputedStyle(document.documentElement).getPropertyValue('--top-bar-height') || '0px';
                const topBarHeight = parseInt(topBarHeightStr) || 0;

                // Total height for page content padding should include both
                const totalHeight = headerHeight + topBarHeight;
                document.documentElement.style.setProperty('--header-height', `${totalHeight}px`);
                document.documentElement.style.setProperty('--header-only-height', `${headerHeight}px`);
            }
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        window.addEventListener('taruvae-topbar-height-change', updateHeaderHeight);

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            window.removeEventListener('taruvae-topbar-height-change', updateHeaderHeight);
        };
    }, [mounted, isScrolled]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Body scroll lock when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const navLinks = [
        { label: 'Products', href: '/products', highlight: true },
        { label: 'Oil', href: '/products?filter=oil' },
        { label: 'Ghee', href: '/products?filter=ghee' },
        { label: 'Spices', href: '/products?filter=superfoods' },
        { label: 'Combo', href: '/products?filter=combo' },
        { label: 'My Orders', href: '/orders' },
        { label: 'Blog', href: '/blog' },
    ];

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

    // Hide header on admin pages
    if (pathname?.startsWith('/admin')) return null;

    return (
        <header
            ref={headerRef}
            className={`fixed left-0 right-0 z-[100] w-full transition-all duration-300 ${isScrolled
                ? 'bg-cream shadow-md'
                : 'bg-cream/95'
                }`}
            style={{ top: 'var(--top-bar-height, 0px)' }}
        >
            {/* Main Header */}
            <div className={`w-full border-b transition-colors duration-300 ${isScrolled ? 'border-border-soft' : 'border-transparent'}`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
                    <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
                        {/* Left Side - Mobile Menu + Logo */}
                        <div className="flex items-center gap-3 lg:gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-1.5 -ml-1 text-brand-forest hover:bg-beige-soft rounded-xl transition-colors"
                                aria-label="Menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>

                            {/* Logo */}
                            <Link href="/" className="flex items-center flex-shrink-0 group py-1">
                                <img
                                    src="/images/Logo%20%26%20favicon/Taruvae%CC%81%20Logo%20Transparent%20Rectangle.svg"
                                    alt="Taruvae"
                                    className="h-12 sm:h-14 lg:h-20 w-auto object-contain"
                                />
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = false; // logic for active if needed
                                return (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={`px-4 py-2 text-sm font-semibold transition-all relative group ${link.highlight
                                            ? 'text-brand-forest'
                                            : 'text-text-primary hover:text-brand-forest'
                                            }`}
                                    >
                                        {link.label}
                                        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Side - Search & Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                            {/* Search - Desktop */}
                            <div className="hidden lg:block relative">
                                <form onSubmit={handleSearchSubmit} className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-44 xl:w-64 pl-10 pr-4 py-2.5 rounded-full border border-border-soft bg-beige/50 focus:border-brand-main focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-main/5 text-sm placeholder:text-text-secondary transition-all duration-300"
                                    />
                                    <button
                                        type="submit"
                                        aria-label="Search"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-forest transition-colors"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                {isAuthenticated ? (
                                    <Link
                                        href="/account"
                                        className="p-2 text-brand-forest hover:bg-beige-soft rounded-full transition-all"
                                        aria-label="My Account"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-forest font-bold text-xs">
                                            {user?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="p-2.5 text-brand-forest hover:bg-beige-soft rounded-full transition-all"
                                        aria-label="Login"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </Link>
                                )}

                                <Link
                                    href="/wishlist"
                                    className="relative p-2.5 text-brand-forest hover:bg-beige-soft rounded-full transition-all"
                                    aria-label="Wishlist"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {mounted && wishlistCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-gold text-white text-[9px] font-bold rounded-full ring-2 ring-cream">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    href="/cart"
                                    className="relative p-2.5 text-brand-forest hover:bg-beige-soft rounded-full transition-all"
                                    aria-label="Shopping Cart"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    {mounted && cartCount > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-gold text-white text-[10px] font-bold rounded-full ring-2 ring-cream px-1">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-[110] lg:hidden"
                    style={{ top: 'var(--top-bar-height, 0px)' }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu Content */}
                    <nav className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <span className="text-xl font-bold text-brand-forest font-display">Menu</span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center justify-between p-4 rounded-xl text-lg font-bold transition-all ${link.highlight
                                        ? 'bg-brand-50 text-brand-forest shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.label}
                                    <svg className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 mt-auto">
                            <p className="text-center text-xs text-gray-400 font-medium tracking-widest uppercase">
                                &copy; 2026 Taruvae Naturals
                            </p>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
