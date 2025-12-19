'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getBlogPostBySlug, getPublishedBlogPostsFromFirebase, subscribeToBlogPosts, BlogPost } from '@/lib/firebaseBlogs';

interface BlogPostClientProps {
    initialPost: BlogPost | null;
    initialRelatedPosts: BlogPost[];
}

export default function BlogPostClient({ initialPost, initialRelatedPosts }: BlogPostClientProps) {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const [post, setPost] = useState<BlogPost | null>(initialPost);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>(initialRelatedPosts);
    const [loading, setLoading] = useState(!initialPost);

    // Initialize post from initialPost or load from slug
    useEffect(() => {
        if (initialPost) {
            setPost(initialPost);
            setLoading(false);
        } else if (slug) {
            const loadPost = async () => {
                try {
                    const blogPost = await getBlogPostBySlug(slug);
                    if (!blogPost) {
                        router.push('/blog');
                        return;
                    }
                    setPost(blogPost);

                    // Load related posts
                    const allPosts = await getPublishedBlogPostsFromFirebase();
                    const related = allPosts
                        .filter(p => p.id !== blogPost.id && (p.category === blogPost.category || p.tags?.some(tag => blogPost.tags?.includes(tag))))
                        .slice(0, 3);
                    setRelatedPosts(related);
                } catch (error) {
                    console.error('Error loading blog post:', error);
                    router.push('/blog');
                } finally {
                    setLoading(false);
                }
            };

            loadPost();
        }
    }, [initialPost, slug, router]);

    // Subscribe to real-time updates (separate effect)
    useEffect(() => {
        if (!post?.id) return;

        const unsubscribe = subscribeToBlogPosts((updatedPosts) => {
            const updatedPost = updatedPosts.find(p => p.id === post.id);
            if (updatedPost) {
                setPost(updatedPost);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [post?.id]);

    // Track view count when post is loaded
    useEffect(() => {
        if (!post?.id || !post?.slug) return;

        // Check if user has already viewed this post in this session
        const viewKey = `blog-view-${post.id}`;
        const hasViewed = sessionStorage.getItem(viewKey);
        
        if (!hasViewed) {
            // Mark as viewed in session storage
            sessionStorage.setItem(viewKey, 'true');
            
            // Increment view count
            const incrementViews = async () => {
                try {
                    const { updateBlogPostViews } = await import('@/lib/firebaseBlogs');
                    await updateBlogPostViews(post.id, (post.views || 0) + 1);
                } catch (error) {
                    console.error('Error incrementing view count:', error);
                }
            };
            
            incrementViews();
        }
    }, [post?.id, post?.slug]);

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
                            <p className="text-gray-600">Loading blog post...</p>
                        </div>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    if (!post) {
        return null;
    }

    return (
        <div className="min-h-screen rich-gradient">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>

            {/* Breadcrumb */}
            <div className="pt-20 sm:pt-24 pb-6">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-4xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/" className="hover:text-[#2D5016] font-medium transition-colors">Home</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/blog" className="hover:text-[#2D5016] font-medium transition-colors">Blog</Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500 font-medium line-clamp-1">{post.title}</span>
                    </nav>
                </div>
            </div>

            {/* Blog Post */}
            <article className="container mx-auto px-6 md:px-8 lg:px-10 max-w-4xl pb-16">
                {/* Header Image */}
                {post.image && (
                    <div className="relative w-full h-80 md:h-[500px] mb-10 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-100">
                        {(() => {
                            const placeholderImage = '/images/all/products image available soon.png';
                            let imageSrc = post.image.trim();
                            
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
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        if (!e.currentTarget.src.includes('products%20image%20available%20soon')) {
                                            e.currentTarget.src = placeholderEncoded;
                                        }
                                    }}
                                />
                            );
                        })()}
                    </div>
                )}

                {/* Post Header */}
                <header className="mb-10">
                    {post.category && (
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/10 to-[#D4AF37]/15 text-[#2D5016] rounded-full text-sm font-extrabold mb-6 shadow-lg border-2 border-[#D4AF37]/40">
                            <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                            {post.category}
                        </span>
                    )}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm md:text-base mb-8 pb-6 border-b-2 border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-[#2D5016]/25 flex items-center justify-center border-2 border-[#D4AF37]/40 shadow-md">
                                <svg className="w-5 h-5 text-[#2D5016]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{post.author}</p>
                                <p className="text-xs text-gray-500 font-medium">{formatDate(post.publishedAt)}</p>
                            </div>
                        </div>
                        {post.views !== undefined && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-5 h-5 text-[#2D5016]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="font-semibold">{post.views} views</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Post Content */}
                <div className="mb-12 bg-gradient-to-br from-white via-white to-gray-50/30 rounded-2xl p-6 md:p-8 shadow-xl border-2 border-gray-200/60 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#2D5016]/5 to-transparent rounded-full blur-3xl -ml-24 -mb-24"></div>
                    
                    <style dangerouslySetInnerHTML={{ __html: `
                        .blog-content h1,
                        .blog-content h2,
                        .blog-content h3,
                        .blog-content h4 {
                            font-family: var(--font-playfair), serif;
                            font-weight: 700;
                            color: #111827;
                            margin-top: 2rem;
                            margin-bottom: 1rem;
                            line-height: 1.3;
                            position: relative;
                        }
                        .blog-content h1 {
                            font-size: 2.25rem;
                            font-weight: 800;
                            letter-spacing: -0.02em;
                        }
                        .blog-content h2 {
                            font-size: 1.875rem;
                            font-weight: 700;
                            padding-bottom: 0.5rem;
                            margin-top: 2.5rem;
                            border-bottom: 2px solid #D4AF37;
                            position: relative;
                            padding-left: 0.75rem;
                        }
                        .blog-content h2::before {
                            content: '';
                            position: absolute;
                            left: 0;
                            top: 0;
                            bottom: 0;
                            width: 3px;
                            background: linear-gradient(to bottom, #D4AF37, #B8941F);
                            border-radius: 2px;
                        }
                        .blog-content h3 {
                            font-size: 1.5rem;
                            font-weight: 700;
                            color: #1F2937;
                            margin-top: 2rem;
                        }
                        .blog-content p {
                            margin-bottom: 1.25rem;
                            color: #374151;
                            line-height: 1.9;
                            font-size: 1rem;
                            text-align: justify;
                        }
                        .blog-content p:first-of-type {
                            font-size: 1.125rem;
                            color: #1F2937;
                            font-weight: 500;
                            line-height: 1.9;
                            margin-bottom: 1.5rem;
                        }
                        .blog-content ul,
                        .blog-content ol {
                            margin-bottom: 1.5rem;
                            padding-left: 2rem;
                            background: linear-gradient(to right, #F5F1EB/30, transparent);
                            padding: 1rem 1rem 1rem 2rem;
                            border-radius: 0.75rem;
                            border-left: 3px solid #D4AF37;
                        }
                        .blog-content li {
                            margin-bottom: 0.75rem;
                            color: #374151;
                            line-height: 1.8;
                            font-size: 1rem;
                            position: relative;
                            padding-left: 0.5rem;
                        }
                        .blog-content ul li::marker {
                            color: #D4AF37;
                            font-size: 1.5rem;
                        }
                        .blog-content li::before {
                            content: '';
                            position: absolute;
                            left: -1.5rem;
                            top: 0.75rem;
                            width: 8px;
                            height: 8px;
                            background: #D4AF37;
                            border-radius: 50%;
                        }
                        .blog-content strong {
                            font-weight: 700;
                            color: #111827;
                            background: linear-gradient(to right, #D4AF37/20, transparent);
                            padding: 0 0.25rem;
                            border-radius: 0.25rem;
                        }
                        .blog-content em {
                            font-style: italic;
                            color: #4B5563;
                        }
                        .blog-content a {
                            color: #2D5016;
                            text-decoration: underline;
                            font-weight: 600;
                            transition: all 0.2s;
                            border-bottom: 2px solid #D4AF37/30;
                        }
                        .blog-content a:hover {
                            color: #D4AF37;
                            border-bottom-color: #D4AF37;
                        }
                        .blog-content blockquote {
                            border-left: 4px solid #D4AF37;
                            padding-left: 1.5rem;
                            margin: 1.5rem 0;
                            font-style: italic;
                            color: #4B5563;
                            background: linear-gradient(to right, #F5F1EB, #FDF8F1);
                            padding: 1.25rem;
                            border-radius: 0.75rem;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                            position: relative;
                        }
                        .blog-content blockquote::before {
                            content: '"';
                            position: absolute;
                            left: 0.75rem;
                            top: -0.25rem;
                            font-size: 3rem;
                            color: #D4AF37;
                            opacity: 0.3;
                            font-family: serif;
                        }
                    `}} />
                    <div 
                        className="blog-content relative z-10"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        style={{
                            fontFamily: 'var(--font-inter), sans-serif',
                        }}
                    />
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mb-12 pt-8 border-t-2 border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'var(--font-playfair), serif' }}>Tags:</h3>
                        <div className="flex flex-wrap gap-3">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:from-[#F5F1EB] hover:to-[#D4AF37]/20 hover:text-[#2D5016] transition-all duration-300 border border-gray-200 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-md"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back to Blog */}
                <div className="mb-12">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white font-bold rounded-full hover:from-[#D4AF37] hover:to-[#B8941F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Blog
                    </Link>
                </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="bg-gradient-to-b from-white to-gray-50/50 py-16 border-t-2 border-gray-200">
                    <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 text-center" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Related Posts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedPosts.map((relatedPost) => (
                                <Link
                                    key={relatedPost.id}
                                    href={`/blog/${relatedPost.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-[#D4AF37]/50"
                                >
                                    {relatedPost.image && (
                                        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                                            {(() => {
                                                const placeholderImage = '/images/all/products image available soon.png';
                                                let imageSrc = relatedPost.image.trim();
                                                
                                                // For base64 images, use directly
                                                if (imageSrc.startsWith('data:image/')) {
                                                    return (
                                                        <img
                                                            src={imageSrc}
                                                            alt={relatedPost.title}
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
                                                            alt={relatedPost.title}
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
                                                        alt={relatedPost.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            if (!e.currentTarget.src.includes('products%20image%20available%20soon')) {
                                                                e.currentTarget.src = placeholderEncoded;
                                                            }
                                                        }}
                                                    />
                                                );
                                            })()}
                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent group-hover:from-black/30 transition-all duration-500"></div>
                                        </div>
                                    )}
                                    <div className="p-6">
                                        {relatedPost.category && (
                                            <span className="inline-block px-3 py-1 bg-[#F5F1EB] text-[#2D5016] rounded-full text-xs font-bold mb-3">
                                                {relatedPost.category}
                                            </span>
                                        )}
                                        <h3 className="font-extrabold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-[#2D5016] transition-colors" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                            {relatedPost.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{relatedPost.excerpt}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}

