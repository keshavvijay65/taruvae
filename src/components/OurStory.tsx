'use client';

import Image from 'next/image';

export default function OurStory() {
    return (
        <section id="our-story" className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white via-[#FDF8F1] to-white relative overflow-hidden w-full max-w-full">
            {/* Background Decorations */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-10 w-72 h-72 bg-[#D4AF37] rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#2D5016] rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-14 items-stretch">
                    {/* Left Column - Text Content */}
                    <div className="order-2 lg:order-1 flex flex-col justify-center animate-fade-in-up">
                        {/* Small Heading */}
                        <div className="mb-4 sm:mb-5">
                            <p className="text-[10px] sm:text-xs font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-1.5 sm:mb-2">
                                OUR STORY
                            </p>
                            <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-[#D4AF37] via-[#B8941F] to-[#2D5016] rounded-full" />
                        </div>

                        {/* Main Title */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#2D5016] mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Crafting Purity Since<br />
                            <span className="text-[#D4AF37]">Day One</span>
                        </h2>

                        {/* Paragraph 1 */}
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed mb-3 sm:mb-4">
                            <span className="text-[#2D5016] font-bold">Taruvae</span> is a premium brand committed to bringing 100% pure and natural products to your doorstep. Our mission is to make authentic, organic, and health-enhancing products accessible to every household.
                        </p>

                        {/* Paragraph 2 */}
                        <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-6">
                            All our products are crafted using traditional methods, free from any chemicals or processing. Our cold-pressed oils, desi ghee, and spices are pure as nature intended.
                        </p>

                        {/* Checklist */}
                        <div className="space-y-3 mb-8">
                            {[
                                '100% Pure & Natural',
                                'Cold Pressed Method',
                                'Traditional Quality',
                                'Health Benefits Guaranteed',
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 group/item"
                                    style={{
                                        animation: `fadeInRight 0.6s ease-out ${index * 0.1 + 0.3}s both`,
                                    }}
                                >
                                    <div className="shrink-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#2D5016]/20 rounded-full p-2 group-hover/item:bg-gradient-to-br group-hover/item:from-[#D4AF37] group-hover/item:to-[#2D5016] transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-12">
                                        <svg className="w-4 h-4 text-[#2D5016] group-hover/item:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-800 text-sm md:text-base font-medium leading-relaxed group-hover/item:text-[#2D5016] transition-colors">
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <div>
                            <a
                                href="/products"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2D5016] to-[#1F4F2B] hover:from-[#D4AF37] hover:to-[#B8941F] text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Explore Our Products
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Right Column - Image Gallery */}
                    <div className="order-1 lg:order-2 flex items-stretch">
                        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[550px] xl:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-premium-xl">
                            {/* Main Image */}
                            <div className="flip-card-container w-full h-full">
                                <div className="flip-card-inner w-full h-full">
                                    {/* Front Side */}
                                    <div className="flip-card-front">
                                        <Image
                                            src="/images/Our Story/our story.jpg"
                                            alt="Taruvae - Our Story"
                                            fill
                                            className="object-cover"
                                            priority
                                            quality={95}
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                        />
                                    </div>

                                    {/* Back Side */}
                                    <div className="flip-card-back">
                                        <Image
                                            src="/images/Our Story/our story1.png"
                                            alt="Taruvae - Our Story"
                                            fill
                                            className="object-cover"
                                            quality={95}
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

