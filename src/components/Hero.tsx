'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const banners = [
    {
        id: 1,
        image: '/images/all/ALL1.jpeg',
        title: 'Nature\'s Purest Essence',
        subtitle: 'The Taruvaé Collection',
        description: 'Discover our artisanal cold-pressed oils, extracted with traditional wisdom to preserve every drop of nutrition.',
        buttonText: 'Shop the Collection',
        buttonLink: '/products',
    },
    {
        id: 2,
        image: '/images/all/ALL2.jpeg',
        title: 'From Earth to Your Home',
        subtitle: 'Authentically Sourced',
        description: 'Supporting farmer communities while bringing you the purest, chemical-free organic essentials.',
        buttonText: 'Explore Wellness',
        buttonLink: '/products',
    },
    {
        id: 3,
        image: '/images/all/ALL10.png',
        title: 'Timeless Ayurvedic Wisdom',
        subtitle: 'Ancient Rituals',
        description: 'Reclaim your health with products crafted using age-old techniques that honor the balance of nature.',
        buttonText: 'Discover More',
        buttonLink: '/products',
    },
];

export default function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 15000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 15000);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 15000);
    };

    return (
        <section className="relative w-full overflow-hidden bg-brand-forest pt-[var(--header-height,80px)]">
            {/* Hero Carousel */}
            <div className="relative w-full h-[calc(100vh-var(--header-height,80px))] sm:h-[80vh] lg:h-[85vh] min-h-[500px] overflow-hidden">
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-all duration-[1500ms] ease-premium ${index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 cursor-default pointer-events-none'
                            }`}
                    >
                        {/* Background Image */}
                        <div className="relative w-full h-full">
                            <Image
                                src={banner.image}
                                alt={banner.title}
                                fill
                                priority={index === 0}
                                className="object-cover object-center"
                                quality={95}
                                sizes="100vw"
                            />

                            {/* Sophisticated Earthy Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-forest/90 via-brand-forest/40 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-forest/60 via-transparent to-brand-forest/20" />

                            {/* Subtle texture overlay for organic feel */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 z-20 flex items-center">
                            <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
                                <div className="max-w-3xl">
                                    <div
                                        className={`transform transition-all duration-1000 delay-500 ease-premium ${index === currentSlide
                                            ? 'translate-y-0 opacity-100'
                                            : 'translate-y-12 opacity-0'
                                            }`}
                                    >
                                        {/* Subtitle with gold accent */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <p className="text-gold text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">
                                                {banner.subtitle}
                                            </p>
                                        </div>

                                        {/* Main Title - Fraunces */}
                                        <h1
                                            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 sm:mb-8 leading-[1.1] font-serif"
                                        >
                                            {banner.title.split(' ').map((word, i) => (
                                                <span key={i} className="inline-block mr-[0.2em] last:mr-0">
                                                    {word === 'Purest' || word === 'Authentically' || word === 'Timeless' ? (
                                                        <span className="text-gold italic font-medium">{word}</span>
                                                    ) : word}
                                                </span>
                                            ))}
                                        </h1>

                                        {/* Description - Plus Jakarta Sans */}
                                        <p className="text-cream/90 text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-10 leading-relaxed max-w-xl font-sans">
                                            {banner.description}
                                        </p>

                                        {/* Premium CTA Button */}
                                        <div className="flex flex-wrap gap-4">
                                            <Link
                                                href={banner.buttonLink}
                                                className="btn-gold px-8 py-4 sm:px-10 sm:py-5 text-sm sm:text-base tracking-widest font-black uppercase flex items-center gap-3 group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                                                {banner.buttonText}
                                                <svg
                                                    className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                    />
                                                </svg>
                                            </Link>

                                            <button className="px-8 py-4 border border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm sm:text-base backdrop-blur-sm">
                                                Our Story
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Buttons - Simplified */}
                <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-30 flex gap-2 sm:gap-4">
                    <button
                        onClick={prevSlide}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-brand-forest transition-all backdrop-blur-sm"
                        aria-label="Previous slide"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-brand-forest transition-all backdrop-blur-sm"
                        aria-label="Next slide"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
