'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Features() {
    const features = [
        {
            title: 'Earth-First Sourcing',
            description: 'We source exclusively from sustainable, local farms across India, ensuring minimal carbon footprint and maximum freshness.',
            image: '/images/We Believe/Fresh.webp',
            icon: '🌾',
        },
        {
            title: 'Artisanal Extraction',
            description: 'Time-honored cold-pressing techniques that preserve the delicate cellular structure and nutrients of every ingredient.',
            image: '/images/We Believe/Natural.webp',
            icon: '🌿',
        },
        {
            title: 'Laboratory Certified',
            description: 'Every batch undergoes rigorous 12-point quality testing for purity, potency, and zero chemical residues.',
            image: '/images/We Believe/carefull.webp',
            icon: '✅',
        },
        {
            title: 'Pledge of Prosperity',
            description: 'Your purchase directly funds fair-wage initiatives for our network of 500+ small-scale Indian organic farmers.',
            image: '/images/We Believe/farmers.webp',
            icon: '👨‍🌾',
        },
    ];

    const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

    return (
        <section className="py-24 md:py-32 bg-gradient-page relative overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

            <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-10 h-[1px] bg-gold" />
                        <span className="text-gold text-xs font-bold uppercase tracking-[0.3em]">
                            Our Philosophy
                        </span>
                        <div className="w-10 h-[1px] bg-gold" />
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-forest mb-8 font-serif">
                        Rooted in <span className="text-gold italic font-medium">Conscious</span> Living
                    </h2>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                        Beyond just products, we believe in a harmonious ecosystem where health, tradition, and sustainability coexist.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group flex flex-col h-full animate-fade-in-up"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div className="card-premium p-8 h-full flex flex-col items-center text-center group transition-all duration-500">
                                {/* Icon/Image Container */}
                                <div className="mb-8 w-32 h-32 relative">
                                    <div className="absolute inset-0 bg-brand-light rounded-full transform group-hover:scale-110 group-hover:bg-gold/10 transition-all duration-700" />

                                    <div className="relative w-full h-full p-4 flex items-center justify-center">
                                        {!imageErrors[index] ? (
                                            <img
                                                src={feature.image}
                                                alt={feature.title}
                                                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                                                onError={() => setImageErrors(prev => ({ ...prev, [index]: true }))}
                                            />
                                        ) : (
                                            <span className="text-5xl filter group-hover:drop-shadow-gold transition-all duration-500">{feature.icon}</span>
                                        )}
                                    </div>

                                    {/* Floating Gold Sparkle (Decoration) */}
                                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:translate-x-1 group-hover:-translate-y-1">
                                        <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-brand-forest mb-4 font-serif transition-colors duration-500">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-text-secondary text-sm leading-relaxed transition-colors duration-500 group-hover:text-brand-forest">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

