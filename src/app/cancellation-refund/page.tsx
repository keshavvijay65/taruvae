'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CancellationRefundPage() {
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
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Cancellation & Refund Policy</h1>
                        <p className="text-gray-600 text-sm">Last updated on Nov 26 2025</p>
                    </div>

                    <div className="prose max-w-none text-gray-700 space-y-4">
                        <p>
                            Taruveda Naturals believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
                        </p>

                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">1. Cancellations</h2>
                                <p>
                                    Cancellations will be considered only if the request is made within 7 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the shipping process.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">2. Perishable Items</h2>
                                <p>
                                    Taruveda Naturals does not accept cancellation requests for perishable items like flowers, eatables, etc. However, a refund or replacement can be made if the customer establishes that the quality of the product delivered is not good.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">3. Damaged or Defective Items</h2>
                                <p>
                                    In case of receipt of damaged or defective items, please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the issue at his end. This must be reported within 7 days of receipt of the products.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">4. Product Not as Shown/Expected</h2>
                                <p>
                                    If the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The Customer Service Team after looking into your complaint will make an appropriate decision.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">5. Manufacturer Warranty</h2>
                                <p>
                                    For complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">6. Refund Processing Time</h2>
                                <p>
                                    Any refunds approved by Taruveda Naturals will take 3-5 days to be processed to the end customer.
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

