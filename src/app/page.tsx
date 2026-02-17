import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ProductsSection from "@/components/ProductsSection";
import OurStory from "@/components/OurStory";
import OurPhilosophy from "@/components/OurPhilosophy";

export default function Home() {
    return (
        <main className="min-h-screen rich-gradient w-full">
            <Hero />
            <Features />
            <ProductsSection />
            <OurStory />
            <OurPhilosophy />
        </main>
    );
}