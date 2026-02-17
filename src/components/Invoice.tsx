'use client';

import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '@/types';

interface InvoiceProps {
    order: Order;
    onClose?: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ order, onClose }) => {
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;

        try {
            const element = invoiceRef.current;
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Taruvae_Premium_Invoice_${order.orderId}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try printing instead.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatPrice = (amount: number | undefined | null) => {
        return (amount || 0).toLocaleString('en-IN');
    };

    const getTotalAmount = () => {
        return order.totalAmount ?? (order as any).total ?? 0;
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0 font-sans">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Inter:wght@100..900&display=swap');
                
                .font-fraunces { font-family: 'Fraunces', serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>

            <div className="max-w-4xl mx-auto">
                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-10 no-print">
                    <button
                        onClick={onClose}
                        className="group flex items-center text-brand-forest/60 hover:text-brand-forest transition-all font-bold tracking-tight"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-brand-forest/10 flex items-center justify-center mr-3 group-hover:bg-brand-forest group-hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </div>
                        Return to Dashboard
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={handlePrint}
                            className="bg-white text-brand-forest px-6 py-3 rounded-2xl font-black border-2 border-brand-forest/5 hover:border-brand-main/20 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="bg-brand-forest text-white px-8 py-3 rounded-2xl font-black hover:bg-brand-main transition-all flex items-center gap-2 shadow-xl shadow-green-900/20 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Secure Download
                        </button>
                    </div>
                </div>

                {/* Main Premium Invoice Container */}
                <div
                    ref={invoiceRef}
                    className="bg-white shadow-[0_40px_100px_-20px_rgba(31,61,43,0.12)] rounded-[50px] overflow-hidden relative print:shadow-none print:rounded-none"
                >
                    {/* Top Decorative Border */}
                    <div className="h-4 bg-gradient-to-r from-brand-forest via-brand-main to-gold"></div>

                    {/* Content Wrapper */}
                    <div className="p-10 sm:p-20 relative">
                        {/* Background Motifs */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2F5D3A]/05 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/05 rounded-full -ml-36 -mb-36 blur-[80px] pointer-events-none"></div>

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-12 mb-20 relative z-10">
                            <div>
                                <div className="mb-6">
                                    <h1 className="font-fraunces text-6xl font-black text-brand-forest tracking-tighter leading-none mb-1 italic">Taruvaé</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="h-px w-8 bg-gold"></div>
                                        <p className="font-inter text-[10px] font-black text-gold uppercase tracking-[0.4em]">Premium Naturals</p>
                                    </div>
                                </div>
                                <div className="space-y-1 text-brand-forest/50 font-inter text-[10px] font-black uppercase tracking-widest">
                                    <p>Taruvaé Naturals & Organics</p>
                                    <p>Registered Organic Farm Hub</p>
                                    <p>GSTIN: 27AATFT9876Z1Z5</p>
                                </div>
                            </div>

                            <div className="md:text-right">
                                <div className="inline-block px-6 py-2 bg-brand-forest text-white rounded-full mb-6 italic font-fraunces text-sm">
                                    Official Tax Invoice
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="font-inter text-[10px] font-black text-gold uppercase tracking-widest mb-1">Invoice Reference</h2>
                                        <p className="font-fraunces text-2xl font-black text-brand-forest leading-none uppercase tracking-tighter">#{order.orderId}</p>
                                    </div>
                                    <div>
                                        <h2 className="font-inter text-[10px] font-black text-gold uppercase tracking-widest mb-1">Dated</h2>
                                        <p className="font-inter text-sm font-black text-brand-forest/70">{new Date(order.orderDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20 relative z-10">
                            <div className="p-10 rounded-[32px] bg-[#FDFCF9] border-2 border-dashed border-gold/10">
                                <h3 className="font-inter text-[10px] font-black text-gold uppercase tracking-widest mb-6">Bill To</h3>
                                <div className="space-y-2">
                                    <p className="font-fraunces text-2xl font-black text-brand-forest leading-tight italic">{order.customer.firstName} {order.customer.lastName}</p>
                                    <div className="space-y-1 font-inter text-sm font-bold text-brand-forest/60">
                                        <p>{order.customer.email}</p>
                                        <p>{order.customer.phone}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:text-right flex flex-col justify-center">
                                <h3 className="font-inter text-[10px] font-black text-gold uppercase tracking-widest mb-4">Destination</h3>
                                <div className="space-y-2">
                                    <p className="font-inter text-base font-black text-brand-forest leading-relaxed max-w-[300px] md:ml-auto">
                                        {order.shippingAddress.address}
                                    </p>
                                    <p className="font-inter text-sm font-bold text-brand-forest/50 uppercase tracking-widest">
                                        {order.shippingAddress.city}, {order.shippingAddress.state} <br /> PIN {order.shippingAddress.pincode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table - Enhanced Editorial Style */}
                        <div className="mb-20 relative z-10">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-4 border-brand-forest text-brand-forest">
                                            <th className="text-left pb-6 font-fraunces text-xl font-black italic">Description of Produce</th>
                                            <th className="text-center pb-6 font-inter text-[10px] font-black uppercase tracking-widest">Qty</th>
                                            <th className="text-right pb-6 font-inter text-[10px] font-black uppercase tracking-widest">Unit Price</th>
                                            <th className="text-right pb-6 font-inter text-xl font-black italic">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-gray-50">
                                        {order.items.map((item, index) => (
                                            <tr key={index} className="group">
                                                <td className="py-8">
                                                    <p className="font-fraunces text-lg font-black text-brand-forest mb-1">{item.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-gold/50"></span>
                                                        <p className="font-inter text-[10px] font-black text-gold uppercase tracking-widest">Purity Verified</p>
                                                    </div>
                                                </td>
                                                <td className="py-8 text-center font-inter text-sm font-black text-brand-forest/60 underline decoration-gold/30 underline-offset-4">{item.quantity || 0}</td>
                                                <td className="py-8 text-right font-inter text-sm font-bold text-brand-forest/40 italic">₹{formatPrice(item.price)}</td>
                                                <td className="py-8 text-right font-fraunces text-xl font-black text-brand-forest tracking-tighter">₹{formatPrice(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                            {/* Certification Section */}
                            <div className="lg:col-span-12 xl:col-span-7 flex flex-col md:flex-row items-center gap-8 p-10 bg-brand-forest rounded-[40px] text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/05 rounded-full -mr-16 -mt-16 transform transition-transform group-hover:scale-150 duration-700"></div>
                                <div className="w-24 h-24 rounded-full bg-gold/20 flex-shrink-0 flex items-center justify-center border-4 border-gold/40 relative">
                                    <div className="absolute inset-0 animate-pulse bg-gold/10 rounded-full"></div>
                                    <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-fraunces text-2xl font-black italic mb-2 tracking-tight">Handcrafted with Integrity</h4>
                                    <p className="font-inter text-xs font-medium text-white/60 leading-relaxed max-w-[400px]">
                                        This invoice confirms the purchase of 100% natural and high-quality products. We ensure transparency from farm to your home.
                                    </p>
                                </div>
                            </div>

                            {/* Totals Section */}
                            <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                                <div className="p-10 bg-[#FDFCF9] rounded-[40px] border-2 border-brand-forest/5">
                                    <div className="space-y-4 font-inter text-xs font-black uppercase tracking-widest text-brand-forest/40">
                                        <div className="flex justify-between items-center">
                                            <span>Subtotal</span>
                                            <span className="text-brand-forest">₹{formatPrice(order.subtotal)}</span>
                                        </div>
                                        {order.discount && order.discount > 0 && (
                                            <div className="flex justify-between items-center text-green-600">
                                                <span>Privilege Discount</span>
                                                <span className="font-black">-₹{formatPrice(order.discount)}</span>
                                            </div>
                                        )}
                                        {order.gst && order.gst > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span>Government Levies (GST)</span>
                                                <span className="text-brand-forest">₹{formatPrice(order.gst)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span>Premium Logistics</span>
                                            <span className="text-brand-forest">₹{formatPrice(order.shipping)}</span>
                                        </div>

                                        <div className="h-px bg-gold/20 my-6"></div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-end">
                                                <span className="font-fraunces text-xl italic normal-case text-brand-forest">Grand Total</span>
                                                <span className="font-fraunces text-5xl font-black text-brand-forest tracking-tighter italic">₹{formatPrice(getTotalAmount())}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Badge */}
                                <div className="flex items-center justify-between p-6 bg-white border-2 border-brand-forest/5 rounded-[30px]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]'}`}></div>
                                        <span className="font-inter text-[10px] font-black uppercase tracking-[0.2em] text-brand-forest/60">Payment Status</span>
                                    </div>
                                    <span className={`font-fraunces text-lg font-black italic ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {order.paymentStatus === 'paid' ? 'Authenticated & Paid' : 'Pending Authorization'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Aesthetic Footer */}
                        <div className="mt-24 pt-12 border-t border-brand-forest/5 text-center">
                            <div className="flex justify-center mb-8">
                                <div className="h-10 w-px bg-gold/30 mx-auto"></div>
                            </div>
                            <p className="font-fraunces text-2xl font-black italic text-brand-forest mb-4 leading-tight shadow-text-aesthetic">
                                "The soil provides for those who cherish it."
                            </p>
                            <div className="max-w-[500px] mx-auto mb-10">
                                <p className="font-inter text-[10px] font-black text-brand-forest/30 uppercase tracking-[0.4em] leading-relaxed">
                                    Official Digital Certificate of Transaction <br /> Taruvaé Naturals Hub • 2026 Edition
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-8 py-3 px-8 bg-brand-light/30 rounded-full border border-brand-forest/5 text-[9px] font-black text-brand-forest uppercase tracking-widest no-print">
                                <span>No Signature Required</span>
                                <div className="w-1 h-1 rounded-full bg-gold"></div>
                                <span>Blockchain Verified</span>
                                <div className="w-1 h-1 rounded-full bg-gold"></div>
                                <span>Sustainable Paperless Flow</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Only Disclaimer */}
                <div className="mt-8 text-center hidden print:block">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Visit www.taruvae.com for organic lifestyle insights
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
