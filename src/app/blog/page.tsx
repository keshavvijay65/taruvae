'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPublishedBlogPostsFromFirebase, subscribeToBlogPosts, getAllBlogPostsFromFirebase, getDefaultBlogPosts, saveBlogPostsToFirebase, BlogPost } from '@/lib/firebaseBlogs';

function BlogContent() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadPosts = async () => {
            try {
                let allPosts = await getAllBlogPostsFromFirebase();
                
                // If no posts exist, initialize with default posts
                if (!allPosts || allPosts.length === 0) {
                    const defaultPosts = getDefaultBlogPosts();
                    await saveBlogPostsToFirebase(defaultPosts);
                    allPosts = defaultPosts;
                }
                
                const publishedPosts = allPosts.filter(post => post.published).sort((a, b) => b.publishedAt - a.publishedAt);
                setPosts(publishedPosts);
            } catch (error) {
                console.error('Error loading blog posts:', error);
                // Fallback to default posts
                const defaultPosts = getDefaultBlogPosts();
                const publishedPosts = defaultPosts.filter(post => post.published).sort((a, b) => b.publishedAt - a.publishedAt);
                setPosts(publishedPosts);
            } finally {
                setLoading(false);
            }
        };

        loadPosts();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToBlogPosts((updatedPosts) => {
            const published = updatedPosts.filter(post => post.published).sort((a, b) => b.publishedAt - a.publishedAt);
            setPosts(published);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Get unique categories
    const categories = ['all', ...Array.from(new Set(posts.map(post => post.category).filter(Boolean)))];

    // Filter posts
    const filteredPosts = posts.filter(post => {
        const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
        const matchesSearch = !searchTerm || 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        return matchesCategory && matchesSearch;
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen rich-gradient">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                    <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                        <div className="text-center py-20">
                            <p className="text-gray-600">Loading blog posts...</p>
                        </div>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    return (
        <div className="min-h-screen rich-gradient">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>

            {/* Blog Banner - Premium Design with Image */}
            <div className="relative -mt-[73px] pt-[73px] overflow-hidden">
                <div className="relative w-full min-h-[750px] sm:min-h-[850px] md:min-h-[950px]">
                    {/* Background Image */}
                    <div className="absolute inset-0 bg-[#2D5016]">
                        <Image
                            src="/images/all/ALL3.jpeg"
                            alt="Blog Banner"
                            fill
                            priority
                            className="object-cover"
                            quality={95}
                            sizes="100vw"
                            style={{ objectPosition: 'center 25%' }}
                        />
                    
                        {/* Gradient Overlay - Balanced for text and image visibility */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/25 to-black/35" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2D5016]/55 via-[#2D5016]/25 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#2D5016]/30" />
                    </div>

                    {/* Decorative Glow Effects */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 z-10 flex items-center pt-12 sm:pt-16 md:pt-20 px-4 sm:px-6">
                        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl">
                            <div className="text-center max-w-4xl mx-auto w-full">
                        {/* Icon Badge */}
                        <div className="mb-6 md:mb-8 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#D4AF37]/40 rounded-full blur-xl animate-pulse"></div>
                                <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-white/30 to-white/15 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/50 shadow-2xl">
                                    <svg className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Subtitle Badge */}
                        <div className="mb-5 md:mb-6 flex justify-center">
                            <span className="inline-block px-5 py-2 bg-[#D4AF37]/25 backdrop-blur-md border-2 border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-xs md:text-sm font-bold uppercase tracking-wider shadow-xl">
                                Knowledge & Wellness
                            </span>
                        </div>

                        {/* Main Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 md:mb-5 leading-tight drop-shadow-2xl" style={{ fontFamily: 'var(--font-playfair), serif', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                            Our Blog
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl lg:text-2xl text-white mb-3 md:mb-4 font-semibold drop-shadow-xl" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                            Discover Recipes, Health Tips & Stories
                        </p>

                        {/* Description */}
                        <p className="text-sm md:text-base lg:text-lg text-white/95 max-w-3xl mx-auto leading-relaxed drop-shadow-lg mb-6" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>
                            From our farm to your table - Explore authentic recipes, wellness insights, and the stories behind our pure, natural products
                        </p>

                        {/* Decorative Elements */}
                        <div className="mt-8 md:mt-10 flex justify-center items-center gap-4">
                            <div className="w-20 md:w-24 h-0.5 bg-gradient-to-r from-transparent to-[#D4AF37] rounded-full"></div>
                            <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full shadow-xl"></div>
                            <div className="w-20 md:w-24 h-0.5 bg-gradient-to-l from-transparent to-[#D4AF37] rounded-full"></div>
                        </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Filters - Premium Design */}
            <div className="bg-white border-b border-gray-200 shadow-sm -mt-1 relative z-20">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-5 md:py-6">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                        {/* Search */}
                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search blog posts..."
                                    className="w-full px-5 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016] focus:bg-white transition-all shadow-sm hover:shadow-md"
                                />
                                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm ${
                                        selectedCategory === category
                                            ? 'bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white shadow-md transform scale-105'
                                            : 'bg-white text-[#2D5016] border-2 border-gray-200 hover:border-[#2D5016] hover:bg-[#F5F1EB] hover:shadow-md'
                                    }`}
                                >
                                    {category === 'all' ? 'All Posts' : category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl pt-20 sm:pt-24 pb-10">
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-600 text-lg">No blog posts found.</p>
                        <p className="text-gray-500 mt-2">Check back soon for new content!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                        {filteredPosts.map((post, index) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group bg-white rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)] border border-gray-300/50 hover:border-[#D4AF37] transition-all duration-700 hover:-translate-y-6 relative transform"
                                style={{
                                    animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`,
                                }}
                            >
                                {/* Premium Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 via-transparent to-[#2D5016]/0 group-hover:from-[#D4AF37]/25 group-hover:via-[#D4AF37]/5 group-hover:to-[#2D5016]/25 transition-all duration-700 pointer-events-none z-0 rounded-3xl" />
                                
                                {/* Image Container with Overlay Content */}
                                <div className="relative w-full h-56 md:h-64 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
                                    {(() => {
                                        const placeholderImage = '/images/all/products image available soon.png';
                                        let imageSrc = post.image ? post.image.trim() : '';
                                        
                                        if (!imageSrc) {
                                            return (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F1EB] via-white to-[#F5F1EB]">
                                                    <div className="w-24 h-24 rounded-3xl bg-white/90 backdrop-blur-md border-2 border-gray-200/60 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500">
                                                        <svg className="w-12 h-12 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        
                                        // For base64 images, use directly
                                        if (imageSrc.startsWith('data:image/')) {
                                            return (
                                                <img
                                                    src={imageSrc}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            );
                                        }
                                        
                                        // For HTTP URLs, use directly
                                        if (imageSrc.startsWith('http')) {
                                            return (
                                                <img
                                                    src={imageSrc}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.src = placeholderImage.replace(/ /g, '%20');
                                                    }}
                                                />
                                            );
                                        }
                                        
                                        // For local paths, encode spaces
                                        const encodedSrc = imageSrc.replace(/ /g, '%20');
                                        const placeholderEncoded = placeholderImage.replace(/ /g, '%20');
                                        
                                        return (
                                            <img
                                                src={encodedSrc}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-700 ease-out"
                                                loading="lazy"
                                                onError={(e) => {
                                                    if (!e.currentTarget.src.includes('products%20image%20available%20soon')) {
                                                        e.currentTarget.src = placeholderEncoded;
                                                    }
                                                }}
                                            />
                                        );
                                    })()}
                                    {/* Category Badge - Overlay on Image */}
                                    {post.category && (
                                        <div className="absolute top-3 left-3 z-20">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md text-[#2D5016] rounded-full text-[10px] font-bold shadow-lg border border-[#D4AF37]/50 group-hover:bg-[#D4AF37] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                                                <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full group-hover:bg-white"></span>
                                                {post.category}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Dark Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Shine Effect on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 opacity-0 group-hover:opacity-100"></div>
                                    
                                    {/* Title Overlay on Image (Shows on Hover) */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                                        <h3 className="text-lg md:text-xl font-extrabold text-white line-clamp-2 drop-shadow-2xl" style={{ fontFamily: 'var(--font-playfair), serif', textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                                            {post.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 md:p-6 relative z-10 bg-white">

                                    {/* Title */}
                                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#2D5016] transition-colors duration-300 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="text-gray-600 text-sm md:text-base mb-5 line-clamp-2 leading-relaxed font-normal">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-[#2D5016]/25 flex items-center justify-center border-2 border-[#D4AF37]/40 shadow-lg group-hover:scale-110 group-hover:border-[#D4AF37] transition-all duration-300">
                                                <svg className="w-5 h-5 text-[#2D5016] group-hover:text-[#D4AF37] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-[#2D5016] transition-colors duration-300">{post.author}</p>
                                                <p className="text-xs text-gray-500 font-medium">{formatDate(post.publishedAt)}</p>
                                            </div>
                                        </div>
                                        <span className="px-4 py-2 bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white text-xs font-bold rounded-full group-hover:from-[#D4AF37] group-hover:to-[#B8941F] transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-xl group-hover:scale-105">
                                            Read
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}

export default function BlogPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen rich-gradient">
                <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                    <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                        <div className="text-center py-20">
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <BlogContent />
        </Suspense>
    );
}

