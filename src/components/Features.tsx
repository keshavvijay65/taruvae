'use client';

import Image from 'next/image';

export default function Features() {
    const features = [
        {
            title: 'Fresh from Farms',
            description: 'Raw materials directly collected from local farms across India.',
            image: '/images/We Believe/Fresh.webp',
            icon: '🌾',
        },
        {
            title: 'Natural Methods',
            description: 'Products made using age-old methods that keep nutrients safe.',
            image: '/images/We Believe/Natural.webp',
            icon: '🌿',
        },
        {
            title: 'Careful Quality Checks',
            description: 'Each product is tested many times to make sure it is pure and healthy.',
            image: '/images/We Believe/carefull.webp',
            icon: '✅',
        },
        {
            title: 'Supporting Farmers',
            description: 'Every purchase supports thousands of farmer families to live better lives.',
            image: '/images/We Believe/farmers.webp',
            icon: '👨‍🌾',
        },
    ];

    return (
        <section className="py-20 md:py-24 lg:py-28 bg-gradient-to-b from-white via-[#FDF8F1] to-white relative overflow-hidden w-full max-w-full">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5">
                <div className="absolute top-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#2D5016] rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl relative z-10 w-full">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-20">
                    <div className="inline-block mb-4">
                        <span className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.2em]">
                            Our Values
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient mb-6 text-shadow-premium" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        We Believe In
                    </h2>
                    <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                        Quality, purity, and tradition - the pillars of our commitment to you
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="text-center group relative flex flex-col h-full"
                            style={{
                                animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`,
                            }}
                        >
                            {/* Card */}
                            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-premium-lg hover:shadow-premium-xl transition-all duration-500 border border-gray-100 hover:border-[#D4AF37]/50 transform hover:-translate-y-2 relative overflow-hidden flex flex-col h-full">
                                {/* Background Gradient on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-[#2D5016]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Icon Container */}
                                <div className="mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto flex items-center justify-center relative">
                                    {/* Outer Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#2D5016]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-125" />
                                    
                                    {/* Icon Circle */}
                                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#F5F1EB] via-white to-[#F5F1EB] p-3 flex items-center justify-center shadow-inner border-2 border-[#D4AF37]/20 group-hover:border-[#D4AF37] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                        <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center">
                                            <Image
                                                src={feature.image}
                                                alt={feature.title}
                                                width={100}
                                                height={100}
                                                className="object-contain w-full h-full transition-all duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                    </div>

                                    {/* Icon Emoji Overlay */}
                                    <div className="absolute -top-1 -right-1 text-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12">
                                        {feature.icon}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2 text-[#2D5016] transition-colors duration-300 group-hover:text-[#D4AF37] relative z-10" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed relative z-10 flex-grow">
                                    {feature.description}
                                </p>

                                {/* Decorative Element */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
