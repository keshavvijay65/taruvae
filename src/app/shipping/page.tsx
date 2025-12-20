'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl pt-20 sm:pt-24 pb-12 md:pb-16">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                    <div className="mb-6">
                        {/* <div className="inline-block bg-blue-50 border border-blue-200 rounded px-3 py-1 text-xs text-blue-700 mb-4">
                            Created with Razorpay
                        </div> */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shipping & Delivery Policy</h1>
                        <p className="text-gray-600 text-sm">Last updated on Nov 26 2025</p>
                    </div>

                    <div className="prose max-w-none text-gray-700 space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">International Shipping</h2>
                            <p>
                                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Domestic Shipping</h2>
                            <p>
                                For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Shipping Timeframe</h2>
                            <p>
                                Orders are shipped within 0-7 days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Liability Disclaimer</h2>
                            <p>
                                Taruveda Naturals is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 0-7 days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Delivery Address</h2>
                            <p>
                                Delivery of all orders will be to the address provided by the buyer.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Service Confirmation</h2>
                            <p>
                                Delivery of our services will be confirmed on your mail ID as specified during registration.
                            </p>
                        </div>

                        <div className="border-t pt-6 mt-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Contact Information:</h3>
                            <p className="text-sm">
                                For any issues in utilizing our services you may contact our helpdesk on <strong>8792421741</strong> or <a href="mailto:contact@taruvae.com" className="text-[#2D5016] hover:text-[#D4AF37] underline">contact@taruvae.com</a>
                            </p>
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

