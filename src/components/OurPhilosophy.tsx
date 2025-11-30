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
        <section className="py-16 md:py-20 lg:py-24 bg-white overflow-hidden w-full max-w-full">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl w-full">
                {/* Section Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-8 sm:mb-12 md:mb-16 text-left" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                    Our Philosophy
                </h2>

                {/* Philosophy Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full">
                    {philosophyItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group w-full border border-gray-100 hover:border-[#D4AF37]/50 transform hover:-translate-y-2"
                        >
                            {/* Icon */}
                            <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center w-full">
                                <div className={`relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden border-2 border-gray-100 shadow-md group-hover:border-[#D4AF37] group-hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 group-hover:scale-105`}>
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        width={180}
                                        height={180}
                                        className={`${item.id === 3 ? 'object-contain w-full h-full scale-95' : 'object-contain p-3 sm:p-4 w-full h-full'} transition-transform duration-300 group-hover:scale-110`}
                                    />
                                </div>
                            </div>

                            {/* Heading */}
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#2D5016] mb-2 sm:mb-3 text-center group-hover:text-[#D4AF37] transition-colors duration-300 w-full" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                {item.title}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed text-center w-full">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
