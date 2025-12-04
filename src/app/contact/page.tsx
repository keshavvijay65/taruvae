'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl pt-20 sm:pt-24 pb-12 md:pb-16">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                    <div className="mb-6">
                        <div className="inline-block bg-blue-50 border border-blue-200 rounded px-3 py-1 text-xs text-blue-700 mb-4">
                            Created with Razorpay
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Contact us</h1>
                        <p className="text-gray-600 text-sm">Last updated on Nov 26 2025</p>
                    </div>

                    <div className="prose max-w-none">
                        <p className="text-gray-700 mb-6">You may contact us using the information below:</p>
                        
                        <div className="space-y-4 text-gray-700">
                            <div>
                                <p className="font-semibold text-gray-900">Merchant Legal entity name:</p>
                                <p>Taruveda Naturals</p>
                            </div>
                            
                            <div>
                                <p className="font-semibold text-gray-900">Registered Address:</p>
                                <p>17, 2nd floor, II stage Indranagar, Bengaluru, Bengaluru Urban, Karnataka, 560038 Indiranagar (Bengaluru) KARNATAKA 560038</p>
                            </div>
                            
                            <div>
                                <p className="font-semibold text-gray-900">Operational Address:</p>
                                <p>E-501, Ajmera Stone Park, 1st Cross, Neeladari Nagar, Electronic City Phase - 1 Bengaluru KARNATAKA 560100</p>
                            </div>
                            
                            <div>
                                <p className="font-semibold text-gray-900">Telephone No:</p>
                                <p>8792421741</p>
                            </div>
                            
                            <div>
                                <p className="font-semibold text-gray-900">E-Mail ID:</p>
                                <p>
                                    <a href="mailto:contact@taruvae.com" className="text-[#2D5016] hover:text-[#D4AF37] underline">
                                        contact@taruvae.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Footer />
            </Suspense>
        </div>
    );
}

