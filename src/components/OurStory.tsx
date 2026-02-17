'use client';

import Image from 'next/image';

export default function OurStory() {
    return (
        <section id="our-story" className="py-24 relative overflow-hidden bg-white">
            {/* Soft Earthy Overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cream-light to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cream-light to-transparent" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 font-sans">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Side: Content */}
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="space-y-2">
                            <span className="text-gold font-bold uppercase tracking-[0.2em] text-[10px]">
                                Legacy of Purity
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-forest leading-tight">
                                Crafting Organic <br />
                                <span className="text-gold italic">Goodness</span>
                            </h2>
                        </div>

                        <div className="space-y-3 text-text-secondary leading-relaxed">
                            <p className="text-lg font-medium text-brand-forest/90">
                                At Taruvaé, we believe that nature holds the secret to true well-being. Our journey began with a simple promise: to bring the purest, traditionally crafted products to your modern lifestyle.
                            </p>
                            <p>
                                Every drop of our cold-pressed oil and every grain of our hand-picked spices tells a story of heritage, sustainability, and uncompromising quality. We bridge the gap between ancient wisdom and contemporary health.
                            </p>
                        </div>

                        {/* Value List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { title: '100% Organic', icon: '🌿' },
                                { title: 'Cold-Pressed', icon: '❄️' },
                                { title: 'Farm Direct', icon: '🚜' },
                                { title: 'Traceable', icon: '📍' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-default">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-xl group-hover:bg-brand-forest group-hover:text-white transition-all duration-300 shadow-premium-sm group-hover:rotate-12">
                                        {item.icon}
                                    </div>
                                    <span className="font-bold text-brand-forest tracking-wide text-sm">{item.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <a
                                href="/products"
                                className="group relative inline-flex items-center gap-4 bg-brand-forest text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 hover:bg-brand-forest-dark shadow-premium"
                            >
                                <span>Discover Our Collection</span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Right Side: Interactive Flip Card */}
                    <div className="relative h-[500px] w-full [perspective:1500px] group">
                        <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                            {/* Front Side: Original Story Image */}
                            <div className="absolute inset-0 h-full w-full [backface-visibility:hidden]">
                                <Image
                                    src="/images/Our Story/our story.jpg"
                                    alt="Our Story Front"
                                    fill
                                    className="object-cover rounded-[2.5rem] shadow-premium-xl border-8 border-white"
                                    priority
                                />
                            </div>

                            {/* Back Side: 3 Bottles Image */}
                            <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                <Image
                                    src="/images/Our Story/our story1.png"
                                    alt="Our Story Back"
                                    fill
                                    className="object-cover rounded-[2.5rem] shadow-premium-xl border-8 border-white"
                                />
                            </div>
                        </div>

                        {/* Decorative Badge */}
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white rounded-full p-4 shadow-premium flex items-center justify-center text-center border-4 border-cream rotate-[-12deg] z-20 group-hover:rotate-0 transition-transform duration-500">
                            <span className="text-[10px] font-bold text-brand-forest leading-tight uppercase tracking-widest">
                                100% <br /> Pure <br /> Promise
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

