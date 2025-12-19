'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const banners = [
    {
        id: 1,
        image: '/images/all/ALL1.jpeg',
        title: '100% Pure & Natural',
        subtitle: 'Premium Organic Products',
        description: 'Experience the goodness of nature with our cold-pressed oils and organic products',
        buttonText: 'Shop Now',
        buttonLink: '/products',
    },
    {
        id: 2,
        image: '/images/all/ALL2.jpeg',
        title: 'Farm Fresh Quality',
        subtitle: 'Direct from Farmers',
        description: 'Supporting local farmers while bringing you the freshest organic products',
        buttonText: 'Explore Collection',
        buttonLink: '/products',
    },
    {
        id: 3,
        image: '/images/all/ALL10.png',
        title: 'Traditional Methods',
        subtitle: 'Ancient Wisdom',
        description: 'Crafted using age-old techniques that preserve nutrients and flavor',
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
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    return (
        <section className="relative w-full max-w-full overflow-hidden -mt-[73px] pt-[73px]">
            {/* Hero Carousel */}
            <div className="relative w-full h-[calc(100vh-73px)] min-h-[500px] sm:min-h-[600px] md:min-h-[700px]">
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {/* Background Image */}
                        <div className="relative w-full h-full bg-[#2D5016]">
                            <Image
                                src={banner.image}
                                alt={banner.title}
                                fill
                                priority={index === 0}
                                className={banner.id === 3 ? 'object-cover object-center' : 'object-cover object-center'}
                                quality={95}
                                sizes="100vw"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 z-20 flex items-center pt-12 sm:pt-16 md:pt-20 px-4 sm:px-6">
                            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl">
                                <div className="max-w-2xl lg:max-w-3xl">
                                    <div
                                        className={`transform transition-all duration-1000 delay-300 ${index === currentSlide
                                            ? 'translate-y-0 opacity-100'
                                            : 'translate-y-10 opacity-0'
                                            }`}
                                    >
                                        {/* Subtitle */}
                                        <p className="text-[#D4AF37] text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.2em] mb-3 sm:mb-4 animate-fade-in">
                                            {banner.subtitle}
                                        </p>

                                        {/* Main Title */}
                                        <h1
                                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl"
                                            style={{ fontFamily: 'var(--font-playfair), serif' }}
                                        >
                                            {banner.title}
                                        </h1>

                                        {/* Description */}
                                        <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 leading-relaxed max-w-xl drop-shadow-lg">
                                            {banner.description}
                                        </p>

                                        {/* CTA Button */}
                                        <Link
                                            href={banner.buttonLink}
                                            className="inline-block group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                                            <span className="relative z-10 inline-flex items-center gap-2 sm:gap-3 bg-[#2D5016] hover:bg-[#D4AF37] text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full text-sm sm:text-base md:text-lg font-bold transition-all duration-300 shadow-2xl hover:shadow-[0_20px_60px_rgba(212,175,55,0.4)] transform hover:scale-105">
                                                {banner.buttonText}
                                                <svg
                                                    className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                    />
                                                </svg>
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 sm:p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border border-white/20"
                    aria-label="Previous slide"
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 sm:p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border border-white/20"
                    aria-label="Next slide"
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-1.5 sm:h-2 md:h-3 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-6 sm:w-8 md:w-12 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50'
                                : 'w-1.5 sm:w-2 md:w-3 bg-white/40 hover:bg-white/60'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-30 hidden lg:block animate-bounce">
                    <div className="flex flex-col items-center gap-2 text-white/60">
                        <span className="text-xs uppercase tracking-wider font-semibold">Scroll</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 right-10 z-20 hidden xl:block animate-pulse">
                <div className="w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            </div>
            <div className="absolute bottom-20 left-10 z-20 hidden xl:block animate-pulse delay-1000">
                <div className="w-40 h-40 bg-[#2D5016]/10 rounded-full blur-3xl" />
            </div>
        </section>
    );
}
