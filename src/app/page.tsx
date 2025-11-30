'use client';

import { Suspense } from 'react';
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ProductsSection from "@/components/ProductsSection";
import OurStory from "@/components/OurStory";
import OurPhilosophy from "@/components/OurPhilosophy";
import Footer from "@/components/Footer";

export default function Home() {
    return (
        <main className="min-h-screen rich-gradient w-full overflow-x-hidden">
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>
            <Hero />
            <Features />
            <ProductsSection />
            <OurStory />
            <OurPhilosophy />
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Footer />
            </Suspense>
        </main>
    );
}