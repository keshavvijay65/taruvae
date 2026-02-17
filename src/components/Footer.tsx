'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();



    const quickLinks = [
        { label: 'About Us', href: '/#our-story' },
        { label: 'Products', href: '/products' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
    ];

    const customerService = [
        { label: 'Shipping Policy', href: '/shipping' },
        { label: 'Cancellation & Refunds', href: '/cancellation-refund' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
    ];

    const socialLinks = [
        {
            label: 'Facebook',
            href: '#',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
        },
        {
            label: 'Instagram',
            href: '#',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            ),
        },
        {
            label: 'Twitter',
            href: '#',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
            ),
        },
    ];

    // Hide footer on admin pages
    if (pathname?.startsWith('/admin')) return null;

    return (
        <footer className="bg-brand-forest text-cream w-full overflow-hidden border-t-4 border-gold">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 lg:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand Section */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="mb-6">
                            <Link href="/">
                                <img
                                    src="/images/Logo%20%26%20favicon/Taruvae%CC%81%20Logo%20Transparent%20Rectangle.svg"
                                    alt="Taruvae"
                                    className="h-12 w-auto brightness-0 invert"
                                />
                            </Link>
                        </div>
                        <p className="text-cream/80 text-sm leading-relaxed mb-8 max-w-xs">
                            Discover the essence of pure wellness with Taruvaé Naturals. Premium, organic, and rooted in Indian tradition.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-gold hover:bg-gold hover:text-brand-forest transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-gold font-serif text-xl font-bold mb-6">
                            Quick Links
                        </h4>
                        <ul className="space-y-4">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-cream/70 hover:text-gold hover:translate-x-1 transition-all duration-200 text-sm inline-flex items-center gap-2"
                                    >
                                        <span className="text-gold/50">✦</span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="text-gold font-serif text-xl font-bold mb-6">
                            Assistance
                        </h4>
                        <ul className="space-y-4">
                            {customerService.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-cream/70 hover:text-gold hover:translate-x-1 transition-all duration-200 text-sm inline-flex items-center gap-2"
                                    >
                                        <span className="text-gold/50">✦</span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-gold font-serif text-xl font-bold mb-6">
                            Connect
                        </h4>
                        <ul className="space-y-5">
                            <li>
                                <a
                                    href="mailto:contact@taruvae.com"
                                    className="flex items-start gap-4 text-cream/70 hover:text-gold transition-colors group"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gold group-hover:bg-gold group-hover:text-brand-forest transition-all flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase tracking-wider text-cream/40">Email Us</span>
                                        <span className="text-sm">contact@taruvae.com</span>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+918792421741"
                                    className="flex items-start gap-4 text-cream/70 hover:text-gold transition-colors group"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gold group-hover:bg-gold group-hover:text-brand-forest transition-all flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase tracking-wider text-cream/40">Call Us</span>
                                        <span className="text-sm">+91 8792421741</span>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 bg-black/10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <p className="text-cream/50 text-xs tracking-wide">
                            © {currentYear} <span className="text-gold font-bold">Taruvaé Naturals</span>. Rooted in Nature.
                        </p>

                        <div className="flex items-center gap-6 text-cream/40">
                            <span className="text-[10px] uppercase tracking-[0.2em]">Secure Checkout</span>
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="bg-white/5 px-2 py-1 rounded text-[10px]">RAZORPAY</span>
                                <span className="bg-white/5 px-2 py-1 rounded text-[10px]">UPI</span>
                                <span className="bg-white/5 px-2 py-1 rounded text-[10px]">COD</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
