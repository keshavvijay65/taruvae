'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import RichTextEditor from '@/components/RichTextEditor';
import { saveBlogPostsToFirebase, getAllBlogPostsFromFirebase, subscribeToBlogPosts, getDefaultBlogPosts, BlogPost } from '@/lib/firebaseBlogs';

const PLACEHOLDER_IMAGE = '/images/all/products image available soon.png';

const saveBlogsToStorage = async (posts: BlogPost[]) => {
    await saveBlogPostsToFirebase(posts);
};

export default function AdminBlogsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: '',
        category: '',
        image: '',
        published: false,
        tags: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false,
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger',
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setToast({ message, type, isVisible: true });
        setTimeout(() => setToast({ ...toast, isVisible: false }), 3000);
    };

    const showConfirm = (
        title: string,
        message: string,
        onConfirm: () => void,
        type: 'danger' | 'warning' | 'info' = 'danger'
    ) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };

    useEffect(() => {
        const auth = localStorage.getItem('admin-authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
            loadPosts();
        } else {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const loadPosts = async () => {
        try {
            let loadedPosts = await getAllBlogPostsFromFirebase();
            
            // If no posts exist, initialize with default posts
            if (!loadedPosts || loadedPosts.length === 0) {
                const defaultPosts = getDefaultBlogPosts();
                await saveBlogsToStorage(defaultPosts);
                loadedPosts = defaultPosts;
            }
            
            setPosts(loadedPosts.sort((a, b) => b.publishedAt - a.publishedAt));
        } catch (error) {
            console.error('Error loading blog posts:', error);
            // Fallback to default posts
            const defaultPosts = getDefaultBlogPosts();
            setPosts(defaultPosts.sort((a, b) => b.publishedAt - a.publishedAt));
        }
    };

    useEffect(() => {
        const unsubscribe = subscribeToBlogPosts((updatedPosts) => {
            setPosts(updatedPosts.sort((a, b) => b.publishedAt - a.publishedAt));
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size should be less than 5MB', 'error');
                return;
            }
            
            setImageFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setFormData({ ...formData, image: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData({ ...formData, image: '' });
    };

    const resetForm = () => {
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            author: '',
            category: '',
            image: '',
            published: false,
            tags: '',
        });
        setEditingPost(null);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            showToast('Please fill in title and content', 'error');
            return;
        }

        const slug = formData.slug.trim() || generateSlug(formData.title);
        
        // Check if slug already exists
        if (posts.some(p => p.slug === slug && p.id !== editingPost?.id)) {
            showToast('A post with this slug already exists!', 'error');
            return;
        }

        const tags = formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean);

        const newPost: BlogPost = {
            id: editingPost?.id || Date.now().toString(),
            title: formData.title.trim(),
            slug,
            excerpt: formData.excerpt.trim() || formData.content.trim().substring(0, 150) + '...',
            content: formData.content.trim(),
            author: formData.author.trim() || 'Admin',
            category: formData.category.trim() || 'General',
            image: formData.image.trim() || undefined,
            publishedAt: editingPost?.publishedAt || Date.now(),
            updatedAt: Date.now(),
            published: formData.published,
            tags: tags.length > 0 ? tags : undefined,
            views: editingPost?.views || 0,
        };

        const updatedPosts = editingPost
            ? posts.map(p => p.id === editingPost.id ? newPost : p)
            : [...posts, newPost];

        await saveBlogsToStorage(updatedPosts);
        setPosts(updatedPosts);
        resetForm();
        setShowAddForm(false);
        showToast(editingPost ? 'Blog post updated successfully!' : 'Blog post added successfully!', 'success');
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            author: post.author,
            category: post.category,
            image: post.image || '',
            published: post.published,
            tags: post.tags?.join(', ') || '',
        });
        // Set preview if image exists
        if (post.image) {
            setImagePreview(post.image);
        } else {
            setImagePreview(null);
        }
        setImageFile(null);
        setShowAddForm(true);
    };

    const handleDeletePost = (postId: string) => {
        const post = posts.find(p => p.id === postId);
        showConfirm(
            'Delete Blog Post',
            `Are you sure you want to delete "${post?.title || 'this post'}"? This action cannot be undone.`,
            async () => {
                const updatedPosts = posts.filter(p => p.id !== postId);
                await saveBlogsToStorage(updatedPosts);
                setPosts(updatedPosts);
                showToast('Blog post deleted successfully!', 'success');
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            'danger'
        );
    };

    const togglePublish = async (post: BlogPost) => {
        const updatedPost = { ...post, published: !post.published, updatedAt: Date.now() };
        const updatedPosts = posts.map(p => p.id === post.id ? updatedPost : p);
        await saveBlogsToStorage(updatedPosts);
        setPosts(updatedPosts);
        showToast(updatedPost.published ? 'Post published!' : 'Post unpublished!', 'success');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center gap-2 text-[#2D5016] hover:text-[#D4AF37] mb-4 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Blog Management
                            </h1>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowAddForm(!showAddForm);
                            }}
                            className="bg-[#2D5016] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                        >
                            {showAddForm ? 'Cancel' : '+ Add Post'}
                        </button>
                    </div>

                    {/* Add/Edit Form */}
                    {showAddForm && (
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mb-6 shadow-sm">
                            <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                {editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}
                            </h2>
                            <form onSubmit={handleAddPost}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => {
                                                setFormData({ ...formData, title: e.target.value });
                                                if (!editingPost) {
                                                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                                                }
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            placeholder="Enter post title"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Slug <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            placeholder="url-friendly-slug"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Excerpt
                                        </label>
                                        <textarea
                                            value={formData.excerpt}
                                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            placeholder="Short description (optional)"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Author
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            placeholder="Author name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            placeholder="Category"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                            Blog Image <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                        </label>
                                        
                                        {/* Image Upload Option */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                Upload Image File
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <label className="cursor-pointer inline-flex items-center px-4 py-2.5 bg-[#2D5016] text-white rounded-lg hover:bg-[#4A7C2A] transition-colors font-medium text-sm">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Choose Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {imageFile && (
                                                    <span className="text-sm text-gray-600">
                                                        {imageFile.name}
                                                    </span>
                                                )}
                                                {imagePreview && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1.5">Max size: 5MB | Formats: JPG, PNG, GIF, WebP</p>
                                        </div>

                                        {/* OR Divider */}
                                        <div className="relative my-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white text-gray-500">OR</span>
                                            </div>
                                        </div>

                                        {/* Image URL Input */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                Enter Image URL
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.image.startsWith('data:image/') ? '' : formData.image}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, image: e.target.value });
                                                    if (e.target.value) {
                                                        setImagePreview(e.target.value);
                                                    } else {
                                                        setImagePreview(null);
                                                    }
                                                    setImageFile(null);
                                                }}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                                placeholder="/images/blog/image.jpg"
                                            />
                                        </div>

                                        {/* Image Preview */}
                                        {imagePreview && (
                                            <div className="mt-4">
                                                <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                    Preview
                                                </label>
                                                <div className="relative w-full max-w-xs h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tags (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                                            placeholder="health, recipes, tips"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Content <span className="text-red-500">*</span>
                                        </label>
                                        <RichTextEditor
                                            value={formData.content}
                                            onChange={(value) => setFormData({ ...formData, content: value })}
                                            placeholder="Write your blog post content here. Format text like MS Word - no HTML needed!"
                                            className="mb-2"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Use the toolbar above to format your text - just like MS Word! No HTML needed.</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.published}
                                                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                                className="w-5 h-5 text-[#2D5016] focus:ring-[#2D5016]"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">Publish immediately</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                                    >
                                        {editingPost ? 'Update Post' : 'Add Post'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setShowAddForm(false);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Posts List */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            All Posts ({posts.length})
                        </h2>
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                                    <div className="flex gap-4">
                                        {post.image && (
                                            <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-black mb-1">{post.title}</h3>
                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{post.category}</span>
                                                        <span>•</span>
                                                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className={post.published ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                                            {post.published ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => togglePublish(post)}
                                                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                                            post.published
                                                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                        }`}
                                                    >
                                                        {post.published ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditPost(post)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-600">No blog posts yet. Create your first post!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={() => {
                    confirmModal.onConfirm();
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                type={confirmModal.type}
            />
        </div>
    );
}

