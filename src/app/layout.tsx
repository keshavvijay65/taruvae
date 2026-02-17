import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { StructuredDataLoader } from "@/components/StructuredDataLoader";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
});

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    style: ["normal", "italic"],
});

// Viewport configuration (separate from metadata in Next.js 15)
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export const metadata: Metadata = {
    metadataBase: new URL('https://taruvae.com'), // Update with your actual domain
    title: {
        default: "Taruvae Naturals - Premium Organic Products | Cold-Pressed Oils, Desi Ghee & Spices",
        template: "%s | Taruvae Naturals"
    },
    description: "Buy 100% pure, natural cold-pressed oils, premium desi cow bilona ghee, and authentic spices online. Farm fresh organic products delivered to your doorstep. Free delivery above ₹500. Shop now!",
    keywords: [
        "organic products",
        "cold pressed oils",
        "desi ghee",
        "bilona ghee",
        "virgin coconut oil",
        "almond oil",
        "olive oil",
        "sesame oil",
        "mustard oil",
        "groundnut oil",
        "sunflower oil",
        "natural spices",
        "organic food",
        "farm fresh",
        "premium quality",
        "100% pure",
        "chemical free",
        "taruvae",
        "taruvae naturals",
        "online organic store",
        "organic products India",
        "natural products online"
    ],
    authors: [{ name: "Taruvae Naturals" }],
    creator: "Taruvae Naturals",
    publisher: "Taruvae Naturals",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
            { url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' },
        ],
        shortcut: '/favicon.svg',
    },
    manifest: '/site.webmanifest',
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: 'https://taruvae.com',
        siteName: 'Taruvae Naturals',
        title: 'Taruvae Naturals - Premium Organic Products',
        description: 'Buy 100% pure, natural cold-pressed oils, premium desi cow bilona ghee, and authentic spices online. Farm fresh organic products delivered to your doorstep.',
        images: [
            {
                url: '/favicon.svg',
                width: 1200,
                height: 630,
                alt: 'Taruvae Naturals - Premium Organic Products',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Taruvae Naturals - Premium Organic Products',
        description: 'Buy 100% pure, natural cold-pressed oils, premium desi cow bilona ghee, and authentic spices online.',
        images: ['/favicon.svg'],
        creator: '@taruvae', // Update with your Twitter handle if available
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        // Add your verification codes here when available
        // google: 'your-google-verification-code',
        // yandex: 'your-yandex-verification-code',
        // yahoo: 'your-yahoo-verification-code',
    },
    alternates: {
        canonical: 'https://taruvae.com',
    },
    category: 'E-commerce, Organic Products, Natural Foods',
    other: {
        'contact:phone_number': '+91 8792421741',
        'contact:email': 'contact@taruvae.com',
    },
};

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopCouponBar from "@/components/TopCouponBar";
import { Suspense } from "react";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${jakarta.variable} ${fraunces.variable} font-sans min-h-screen flex flex-col`} suppressHydrationWarning>
                <StructuredDataLoader />
                <Providers>
                    <Suspense fallback={<div className="h-10 bg-brand-forest"></div>}>
                        <TopCouponBar />
                    </Suspense>
                    <Suspense fallback={<div className="h-20 bg-white"></div>}>
                        <Header />
                    </Suspense>
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Suspense fallback={<div className="h-40 bg-brand-forest"></div>}>
                        <Footer />
                    </Suspense>
                </Providers>
            </body>
        </html>
    );
}
