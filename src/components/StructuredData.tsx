'use client';

import Script from 'next/script';

export default function StructuredData() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Taruvae Naturals",
        "url": "https://taruvae.com",
        "logo": "https://taruvae.com/images/Logo%20&%20favicon/Taruvae%CC%81%20Logo%20Transparent%20Square.svg",
        "description": "Premium organic products - 100% pure, natural cold-pressed oils, desi ghee, and authentic spices",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-8792421741",
            "contactType": "Customer Service",
            "email": "contact@taruvae.com",
            "areaServed": "IN",
            "availableLanguage": ["en", "hi"]
        },
        "sameAs": [
            // Add your social media links here when available
        ]
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Taruvae Naturals",
        "url": "https://taruvae.com",
        "description": "Buy 100% pure, natural cold-pressed oils, premium desi cow bilona ghee, and authentic spices online",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://taruvae.com/products?search={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };

    const storeSchema = {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": "Taruvae Naturals",
        "image": "https://taruvae.com/images/Logo%20&%20favicon/Taruvae%CC%81%20Logo%20Transparent%20Square.svg",
        "description": "Online store for premium organic products including cold-pressed oils, desi ghee, and spices",
        "url": "https://taruvae.com",
        "telephone": "+91-8792421741",
        "email": "contact@taruvae.com",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "priceRange": "₹",
        "paymentAccepted": "Cash, Credit Card, Debit Card, UPI, Net Banking",
        "currenciesAccepted": "INR"
    };

    return (
        <>
            <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <Script
                id="website-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <Script
                id="store-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
            />
        </>
    );
}

