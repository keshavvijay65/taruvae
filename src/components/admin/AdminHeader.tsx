
import React from 'react';
import Link from 'next/link';

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    showBackLink?: boolean;
    backLinkText?: string;
    backLinkHref?: string;
    children?: React.ReactNode;
}

export default function AdminHeader({
    title,
    subtitle,
    showBackLink = false,
    backLinkText = 'Back to Dashboard',
    backLinkHref = '/admin/dashboard',
    children
}: AdminHeaderProps) {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-8 sm:mb-10 mt-6 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
                <div>
                    {showBackLink && (
                        <Link
                            href={backLinkHref}
                            className="inline-flex items-center gap-2 text-brand-dark hover:text-gold mb-3 transition-colors text-sm font-medium tracking-wide"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {backLinkText}
                        </Link>
                    )}
                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-brand-dark font-serif tracking-tight" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg max-w-2xl font-sans text-brand-brown/80 mb-2 sm:mb-0">
                            {subtitle}
                        </p>
                    )}
                </div>

                {children && (
                    <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
