import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import StructuredData from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ 
    subsets: ["latin"],
    variable: "--font-playfair",
    weight: ["400", "500", "600", "700", "800", "900"],
});

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
        "peanut oil",
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
            { url: '/images/Logo & favicon/Taruvaé Logo Transparent Square.svg', type: 'image/svg+xml' },
        ],
        apple: [
            { url: '/images/Logo & favicon/Taruvaé Logo Transparent Square.svg', sizes: '180x180', type: 'image/svg+xml' },
        ],
        shortcut: '/images/Logo & favicon/Taruvaé Logo Transparent Square.svg',
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
                url: '/images/Logo & favicon/Taruvaé Logo Transparent Square.svg',
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
        images: ['/images/Logo & favicon/Taruvaé Logo Transparent Square.svg'],
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
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
    },
    other: {
        'contact:phone_number': '+91 8792421741',
        'contact:email': 'contact@taruvae.com',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} ${playfair.variable}`} suppressHydrationWarning>
                <StructuredData />
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
