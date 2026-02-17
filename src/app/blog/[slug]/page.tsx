import { Suspense } from 'react';
import { getAllBlogPostsFromFirebase, getBlogPostBySlug, getPublishedBlogPostsFromFirebase, getDefaultBlogPosts, BlogPost } from '@/lib/firebaseBlogs';
import BlogPostClient from './BlogPostClient';

// Function to get default blog post slugs for static generation
function getDefaultBlogSlugs(): string[] {
    const defaultPosts = getDefaultBlogPosts();
    return defaultPosts.filter(post => post.published).map(post => post.slug);
}

// Required for static export - generate static params for blog pages
export async function generateStaticParams() {
    try {
        // Try to get blog posts from Firebase/localStorage
        const posts = await getAllBlogPostsFromFirebase();
        if (posts && posts.length > 0) {
            const publishedPosts = posts.filter(post => post.published);
            if (publishedPosts.length > 0) {
                return publishedPosts.map((post) => ({
                    slug: post.slug,
                }));
            }
        }
    } catch (error) {
        console.error('Error loading blog posts for static generation:', error);
    }
    
    // Fallback to default blog post slugs
    return getDefaultBlogSlugs().map((slug) => ({
        slug: slug,
    }));
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;

    // Load blog post data
    let post: BlogPost | null = null;
    let relatedPosts: BlogPost[] = [];

    try {
        // Try to get from Firebase
        const blogPost = await getBlogPostBySlug(slug);
        if (blogPost) {
            post = blogPost;
            
            // Load related posts
            const allPosts = await getPublishedBlogPostsFromFirebase();
            relatedPosts = allPosts
                .filter(p => p.id !== blogPost.id && (p.category === blogPost.category || p.tags?.some(tag => blogPost.tags?.includes(tag))))
                .slice(0, 3);
        } else {
            // Fallback to default posts
            const defaultPosts = getDefaultBlogPosts();
            const defaultPost = defaultPosts.find(p => p.slug === slug && p.published);
            if (defaultPost) {
                post = defaultPost;
                relatedPosts = defaultPosts
                    .filter(p => p.id !== defaultPost.id && p.published && (p.category === defaultPost.category || p.tags?.some(tag => defaultPost.tags?.includes(tag))))
                    .slice(0, 3);
            }
        }
    } catch (error) {
        console.error('Error loading blog post:', error);
        // Fallback to default posts
        const defaultPosts = getDefaultBlogPosts();
        const defaultPost = defaultPosts.find(p => p.slug === slug && p.published);
        if (defaultPost) {
            post = defaultPost;
            relatedPosts = defaultPosts
                .filter(p => p.id !== defaultPost.id && p.published && (p.category === defaultPost.category || p.tags?.some(tag => defaultPost.tags?.includes(tag))))
                .slice(0, 3);
        }
    }

    return (
        <BlogPostClient initialPost={post} initialRelatedPosts={relatedPosts} />
    );
}
