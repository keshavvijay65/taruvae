'use client';

import { useState, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const faqs = [
        {
            question: "What products do you offer?",
            answer: "We offer a wide range of premium organic products including cold-pressed oils (peanut, coconut, sunflower, mustard, sesame, olive), premium desi cow bilona ghee, spices, superfoods, and combo packs. All our products are 100% pure and organic."
        },
        {
            question: "Are your products organic and certified?",
            answer: "Yes, all our products are 100% pure, organic, and certified. We source directly from trusted farmers and ensure the highest quality standards."
        },
        {
            question: "What is your shipping policy?",
            answer: "We offer free shipping on orders above ₹500. Orders are shipped within 0-7 days through registered courier companies. For international orders, we use registered international courier services. Delivery time depends on your location and courier company norms."
        },
        {
            question: "How can I track my order?",
            answer: "Once your order is shipped, you will receive a tracking number via email. You can use this tracking number on the courier company's website to track your order status."
        },
        {
            question: "What is your cancellation and refund policy?",
            answer: "Cancellations are accepted within 7 days of placing the order, provided the order hasn't been shipped. For damaged or defective items, please report within 7 days of receipt. Refunds are processed within 3-5 days after approval. Perishable items may have different policies."
        },
        {
            question: "Do you offer cash on delivery (COD)?",
            answer: "Yes, we offer cash on delivery for domestic orders. However, COD may not be available for all locations. Please check during checkout."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major payment methods including credit/debit cards, UPI, net banking, and digital wallets through our secure payment gateway powered by Razorpay."
        },
        {
            question: "How do I store your products?",
            answer: "Our oils and ghee should be stored in a cool, dry place away from direct sunlight. Once opened, keep them tightly sealed. Ghee can be stored at room temperature, while oils are best kept in a cool place."
        },
        {
            question: "What is the shelf life of your products?",
            answer: "Our products have a shelf life of 12-18 months from the date of manufacturing, depending on the product. The expiry date is clearly mentioned on each product package."
        },
        {
            question: "Do you offer bulk orders or wholesale pricing?",
            answer: "Yes, we offer special pricing for bulk orders. Please contact us at contact@taruvae.com or call 8792421741 for bulk order inquiries and custom pricing."
        },
        {
            question: "Are your products suitable for cooking?",
            answer: "Yes, all our cold-pressed oils are perfect for cooking, frying, and salad dressings. Our ghee is ideal for cooking, especially for traditional Indian recipes. All products maintain their nutritional value and natural flavors."
        },
        {
            question: "What makes your ghee special?",
            answer: "Our Premium Desi Cow Bilona Ghee is made using the traditional Bilona method from A2 milk. It's slow-crafted, contains no preservatives, and is rich in nutrients. The Bilona method ensures maximum nutritional benefits."
        },
        {
            question: "Do you ship internationally?",
            answer: "Yes, we ship internationally through registered international courier companies. Shipping charges and delivery times vary by location. Please contact us for international shipping rates."
        },
        {
            question: "How can I contact customer support?",
            answer: "You can reach us via email at contact@taruvae.com or call us at 8792421741. Our customer support team is available to assist you with any queries or concerns."
        },
        {
            question: "What if I receive a damaged product?",
            answer: "If you receive a damaged or defective product, please report it to our customer service team within 7 days of receipt. We will investigate and provide a replacement or refund as appropriate."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#FDF8F1] to-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12 md:py-16">
                {/* Enhanced Header */}
                <div className="text-center mb-12 md:mb-16">
                    <div className="inline-block mb-4">
                        <span className="text-[#D4AF37] text-sm font-semibold uppercase tracking-wider">
                            Help Center
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D5016] mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        Frequently Asked Questions
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Find answers to common questions about our products and services
                    </p>
                </div>

                {/* Accordion Style FAQs */}
                <div className="space-y-3 md:space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full p-5 md:p-6 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base shadow-md">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-base md:text-lg font-semibold text-[#2D5016] group-hover:text-[#D4AF37] transition-colors flex-1">
                                            {faq.question}
                                        </h3>
                                    </div>
                                    <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                        <svg className="w-5 h-5 md:w-6 md:h-6 text-[#2D5016] group-hover:text-[#D4AF37] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="px-5 md:px-6 pb-5 md:pb-6 ml-14 md:ml-16">
                                        <div className="pl-4 border-l-2 border-[#D4AF37]">
                                            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Enhanced Contact Section */}
                <div className="mt-16 md:mt-20 bg-gradient-to-br from-[#FDF8F1] via-white to-[#FDF8F1] rounded-2xl border-2 border-[#D4AF37]/30 shadow-lg p-8 md:p-10 text-center relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#2D5016]/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-block mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#2D5016] mb-3" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Still have questions?
                        </h3>
                        <p className="text-gray-700 mb-6 text-base md:text-lg max-w-2xl mx-auto">
                            Can't find the answer you're looking for? Please reach out to our friendly team. We're here to help!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href="mailto:contact@taruvae.com"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2D5016] to-[#1F4F2B] text-white px-8 py-3.5 rounded-xl font-semibold hover:from-[#D4AF37] hover:to-[#B8941F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email Us
                            </a>
                            <a
                                href="tel:8792421741"
                                className="inline-flex items-center gap-2 bg-white border-2 border-[#2D5016] text-[#2D5016] px-8 py-3.5 rounded-xl font-semibold hover:bg-[#2D5016] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Call Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}


