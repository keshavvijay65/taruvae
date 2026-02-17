'use client';

import Image from 'next/image';

const philosophyItems = [
    {
        id: 1,
        title: "Farmer's Love",
        description: "Farmers receive support from us and in return give us a product of love.",
        image: '/images/Our Philosophy/Indian Farmer, Indian agriculture, happy farmer day.png',
    },
    {
        id: 2,
        title: "Ancient Knowledge",
        description: "The ancient art of stone cold pressing is being revived.",
        image: '/images/Our Philosophy/ancient.png',
    },
    {
        id: 3,
        title: "Purity",
        description: "From seeds to the compost used, each step is a hallmark of purity.",
        image: '/images/Our Philosophy/Oil Splash.jpg',
    },
    {
        id: 4,
        title: "Customer's Perspective",
        description: "Each product is developed keeping the customer in mind, We hear you!",
        image: '/images/Our Philosophy/perspecctive.png',
    },
];

export default function OurPhilosophy() {
    return (
        <section className="py-24 bg-cream-light relative overflow-hidden">
            {/* Soft Textures */}
            <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="mb-16 space-y-4">
                    <span className="text-gold font-bold uppercase tracking-[0.2em] text-[10px] bg-gold/5 px-4 py-1.5 rounded-full inline-block">
                        Rooted in Excellence
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-forest">
                        Our Philosophy
                    </h2>
                </div>

                {/* Philosophy Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {philosophyItems.map((item) => (
                        <div
                            key={item.id}
                            className="group card-premium p-8 h-full flex flex-col items-center text-center transition-all duration-500"
                        >
                            {/* Illustration Container */}
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-brand-50 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                                <div className="relative w-32 h-32 bg-white rounded-2xl shadow-premium-sm flex items-center justify-center overflow-hidden border border-brand-100 group-hover:shadow-gold transition-all duration-500">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        width={140}
                                        height={140}
                                        className="object-contain w-[85%] h-[85%] transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="space-y-3">
                                <h3 className="text-xl font-serif font-bold text-brand-forest transition-colors duration-300">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed transition-colors duration-500 group-hover:text-brand-forest">
                                    {item.description}
                                </p>
                            </div>

                            {/* Decorative Line */}
                            <div className="mt-6 w-8 h-1 bg-gold/20 rounded-full group-hover:w-16 group-hover:bg-gold transition-all duration-500" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
