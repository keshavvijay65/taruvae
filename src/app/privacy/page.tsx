'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
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
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                        <p className="text-gray-600 text-sm">Last updated on Nov 26 2025</p>
                    </div>

                    <div className="prose max-w-none text-gray-700 space-y-6">
                        <div>
                            <p>
                                This privacy policy sets out how Taruveda Naturals uses and protects any information that you give Taruveda Naturals when you use this website.
                            </p>
                            <p>
                                Taruveda Naturals is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, then you can be assured that it will only be used in accordance with this privacy statement.
                            </p>
                            <p>
                                Taruveda Naturals may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you are happy with any changes.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Information we collect</h2>
                            <p>We may collect the following information:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Name</li>
                                <li>Contact information including email address</li>
                                <li>Demographic information such as postcode, preferences and interests, if required</li>
                                <li>Other information relevant to customer surveys and/or offers</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">How we use the information</h2>
                            <p>We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Internal record keeping.</li>
                                <li>We may use the information to improve our products and services.</li>
                                <li>We may periodically send promotional emails about new products, special offers or other information which we think you may find interesting using the email address which you have provided.</li>
                                <li>From time to time, we may also use your information to contact you for market research purposes. We may contact you by email, phone, fax or mail.</li>
                                <li>We may use the information to customize the website according to your interests.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Security</h2>
                            <p>
                                We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in suitable physical, electronic and managerial procedures to safeguard and secure the information we collect online.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">How we use cookies</h2>
                            <p>
                                A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual. The web application can tailor its operations to your needs, likes and dislikes by gathering and remembering information about your preferences.
                            </p>
                            <p>
                                We use traffic log cookies to identify which pages are being used. This helps us analyze data about webpage traffic and improve our website in order to tailor it to customer needs. We only use this information for statistical analysis purposes and then the data is removed from the system.
                            </p>
                            <p>
                                Overall, cookies help us provide you with a better website, by enabling us to monitor which pages you find useful and which you do not. A cookie in no way gives us access to your computer or any information about you, other than the data you choose to share with us.
                            </p>
                            <p>
                                You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Controlling your personal information</h2>
                            <p>You may choose to restrict the collection or use of your personal information in the following ways:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>whenever you are asked to fill in a form on the website, look for the box that you can click to indicate that you do not want the information to be used by anybody for direct marketing purposes</li>
                                <li>if you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time by writing to or emailing us at <a href="mailto:contact@taruvae.com" className="text-[#2D5016] hover:text-[#D4AF37] underline">contact@taruvae.com</a></li>
                            </ul>
                            <p className="mt-3">
                                We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so. We may use your personal information to send you promotional information about third parties which we think you may find interesting if you tell us that you wish this to happen.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Correcting Information</h2>
                            <p>
                                If you believe that any information we are holding on you is incorrect or incomplete, please write to or email us as soon as possible, at the above address. We will promptly correct any information found to be incorrect.
                            </p>
                        </div>

                        <div className="border-t pt-6 mt-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Contact Information:</h3>
                            <p className="text-sm">
                                <strong>Address:</strong> 17, 2nd floor, II stage Indranagar, Bengaluru, Bengaluru Urban, Karnataka, 560038 Indiranagar (Bengaluru) KARNATAKA 560038<br />
                                <strong>Phone:</strong> 8792421741<br />
                                <strong>Email:</strong> <a href="mailto:contact@taruvae.com" className="text-[#2D5016] hover:text-[#D4AF37] underline">contact@taruvae.com</a>
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

