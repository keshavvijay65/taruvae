import { ref, set, get, onValue, off, DataSnapshot } from 'firebase/database';
import { database } from './firebase';

// Helper function to remove undefined values from objects (Firebase doesn't allow undefined)
function removeUndefinedValues(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
                cleaned[key] = removeUndefinedValues(obj[key]);
            }
        }
        return cleaned;
    }
    return obj;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    category: string;
    image?: string;
    publishedAt: number;
    updatedAt?: number;
    published: boolean;
    tags?: string[];
    views?: number;
}

// Default blog posts
export function getDefaultBlogPosts(): BlogPost[] {
    return [
        {
            id: '1',
            title: 'The Health Benefits of Cold-Pressed Oils',
            slug: 'health-benefits-cold-pressed-oils',
            excerpt: 'Discover why cold-pressed oils are superior for your health and how they retain more nutrients compared to refined oils.',
            content: `
                <h2>Why Choose Cold-Pressed Oils?</h2>
                <p>Cold-pressed oils are extracted using a traditional method that involves crushing seeds or nuts at low temperatures. This process preserves the natural nutrients, flavor, and aroma of the oil.</p>
                
                <h3>Key Benefits:</h3>
                <ul>
                    <li><strong>Rich in Nutrients:</strong> Cold-pressed oils retain vitamins, minerals, and antioxidants that are lost during refining.</li>
                    <li><strong>Better Flavor:</strong> The natural taste and aroma enhance your dishes.</li>
                    <li><strong>Heart Health:</strong> These oils contain healthy fats that support cardiovascular health.</li>
                    <li><strong>No Chemicals:</strong> No solvents or chemicals are used in the extraction process.</li>
                </ul>
                
                <h3>Our Cold-Pressed Oil Collection</h3>
                <p>At Taruvae, we offer a wide range of cold-pressed oils including:</p>
                <ul>
                    <li>Cold-Pressed Peanut Oil</li>
                    <li>Cold-Pressed Mustard Oil</li>
                    <li>Cold-Pressed Sunflower Oil</li>
                </ul>
                
                <p>Each oil is carefully extracted to ensure maximum nutritional value and purity. Start your journey to better health today!</p>
            `,
            author: 'Taruvae Team',
            category: 'Health Tips',
            publishedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
            published: true,
            tags: ['health', 'oils', 'nutrition', 'wellness'],
            views: 0,
        },
        {
            id: '2',
            title: 'Traditional Desi Ghee: The Golden Elixir',
            slug: 'traditional-desi-ghee-golden-elixir',
            excerpt: 'Learn about the ancient art of making desi ghee using the Bilona method and its incredible health benefits.',
            content: `
                <h2>The Art of Making Desi Ghee</h2>
                <p>Desi ghee, also known as clarified butter, has been a staple in Indian households for centuries. Our ghee is made using the traditional Bilona method, which involves churning curd made from A2 milk.</p>
                
                <h3>What is the Bilona Method?</h3>
                <p>The Bilona method is a time-honored technique where:</p>
                <ol>
                    <li>Fresh A2 milk is collected from grass-fed cows</li>
                    <li>Milk is converted to curd using natural cultures</li>
                    <li>Curd is churned using a wooden churner (bilona)</li>
                    <li>Butter is separated and slowly heated to make ghee</li>
                </ol>
                
                <h3>Health Benefits of Desi Ghee</h3>
                <ul>
                    <li><strong>Digestive Health:</strong> Contains butyric acid that supports gut health</li>
                    <li><strong>Immune System:</strong> Rich in antioxidants and vitamins A, D, E, K</li>
                    <li><strong>Bone Health:</strong> High in vitamin K2 which supports bone density</li>
                    <li><strong>Skin & Hair:</strong> Nourishes from within, giving you a natural glow</li>
                </ul>
                
                <h3>How to Use Desi Ghee</h3>
                <p>Desi ghee can be used in various ways:</p>
                <ul>
                    <li>For cooking and frying (high smoke point)</li>
                    <li>As a spread on rotis and parathas</li>
                    <li>In traditional Ayurvedic preparations</li>
                    <li>As a natural moisturizer for skin and hair</li>
                </ul>
                
                <p>Experience the authentic taste and benefits of traditional desi ghee with Taruvae!</p>
            `,
            author: 'Taruvae Team',
            category: 'Traditional Recipes',
            publishedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
            published: true,
            tags: ['ghee', 'traditional', 'ayurveda', 'health'],
            views: 0,
        },
        {
            id: '3',
            title: 'Superfoods for Immunity: Boost Your Health Naturally',
            slug: 'superfoods-immunity-boost-health',
            excerpt: 'Discover powerful superfoods and spices that can naturally boost your immunity and keep you healthy year-round.',
            content: `
                <h2>Superfoods: Nature's Medicine</h2>
                <p>In today's fast-paced world, maintaining good health is more important than ever. Superfoods are nutrient-dense foods that provide exceptional health benefits beyond their basic nutritional value.</p>
                
                <h3>Top Immunity-Boosting Superfoods</h3>
                
                <h4>1. Turmeric</h4>
                <p>Known as the "golden spice," turmeric contains curcumin, a powerful anti-inflammatory compound. It helps:</p>
                <ul>
                    <li>Reduce inflammation</li>
                    <li>Boost immune function</li>
                    <li>Support brain health</li>
                    <li>Improve digestion</li>
                </ul>
                
                <h4>2. Ginger</h4>
                <p>Ginger is a natural remedy for many ailments:</p>
                <ul>
                    <li>Relieves nausea and digestive issues</li>
                    <li>Reduces muscle pain and soreness</li>
                    <li>Lowers blood sugar levels</li>
                    <li>Fights infections</li>
                </ul>
                
                <h4>3. Black Pepper</h4>
                <p>Often called the "king of spices," black pepper:</p>
                <ul>
                    <li>Enhances nutrient absorption</li>
                    <li>Has antioxidant properties</li>
                    <li>Supports brain function</li>
                    <li>May help with weight management</li>
                </ul>
                
                <h3>How to Incorporate Superfoods</h3>
                <p>Here are some easy ways to add superfoods to your daily diet:</p>
                <ul>
                    <li>Add turmeric to your morning milk or tea</li>
                    <li>Use ginger in your cooking and beverages</li>
                    <li>Sprinkle black pepper on your meals</li>
                    <li>Create spice blends for enhanced flavor and health</li>
                </ul>
                
                <p>At Taruvae, we offer premium quality superfoods and spices sourced directly from trusted farmers. Start your journey to better health today!</p>
            `,
            author: 'Taruvae Team',
            category: 'Health Tips',
            publishedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
            published: true,
            tags: ['superfoods', 'immunity', 'health', 'spices', 'wellness'],
            views: 0,
        },
    ];
}

// Save blog posts to Firebase
export async function saveBlogPostsToFirebase(posts: BlogPost[]): Promise<{ success: boolean; message: string }> {
    try {
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            localStorage.setItem('taruvae-blog-posts', JSON.stringify(posts));
            window.dispatchEvent(new Event('taruvae-blogs-updated'));
            return { success: true, message: 'Blog posts saved to localStorage (Firebase not configured)' };
        }

        const cleanedPosts = removeUndefinedValues(posts);
        const blogsRef = ref(database, 'blogs');
        await set(blogsRef, cleanedPosts);
        
        localStorage.setItem('taruvae-blog-posts', JSON.stringify(posts));
        window.dispatchEvent(new Event('taruvae-blogs-updated'));
        
        return { success: true, message: 'Blog posts saved to Firebase successfully' };
    } catch (error: any) {
        console.error('Error saving blog posts to Firebase:', error);
        localStorage.setItem('taruvae-blog-posts', JSON.stringify(posts));
        window.dispatchEvent(new Event('taruvae-blogs-updated'));
        return { success: false, message: error.message || 'Failed to save blog posts to Firebase' };
    }
}

// Get all blog posts from Firebase
export async function getAllBlogPostsFromFirebase(): Promise<BlogPost[]> {
    try {
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            const savedPosts = localStorage.getItem('taruvae-blog-posts');
            if (savedPosts) {
                return JSON.parse(savedPosts);
            }
            return [];
        }

        const blogsRef = ref(database, 'blogs');
        const snapshot = await get(blogsRef);
        
        if (snapshot.exists()) {
            const blogsData = snapshot.val();
            if (Array.isArray(blogsData)) {
                return blogsData;
            }
            return Object.values(blogsData);
        }

        const savedPosts = localStorage.getItem('taruvae-blog-posts');
        if (savedPosts) {
            return JSON.parse(savedPosts);
        }
        return [];
    } catch (error: any) {
        console.error('Error fetching blog posts from Firebase:', error);
        const savedPosts = localStorage.getItem('taruvae-blog-posts');
        if (savedPosts) {
            return JSON.parse(savedPosts);
        }
        return [];
    }
}

// Get published blog posts only
export async function getPublishedBlogPostsFromFirebase(): Promise<BlogPost[]> {
    try {
        const allPosts = await getAllBlogPostsFromFirebase();
        return allPosts.filter(post => post.published).sort((a, b) => b.publishedAt - a.publishedAt);
    } catch (error: any) {
        console.error('Error fetching published blog posts:', error);
        return [];
    }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const allPosts = await getAllBlogPostsFromFirebase();
        return allPosts.find(post => post.slug === slug && post.published) || null;
    } catch (error: any) {
        console.error('Error fetching blog post by slug:', error);
        return null;
    }
}

// Listen to blog posts in real-time
export function subscribeToBlogPosts(callback: (posts: BlogPost[]) => void): () => void {
    try {
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'taruvae-blog-posts') {
                    try {
                        const posts = e.newValue ? JSON.parse(e.newValue) : [];
                        callback(posts);
                    } catch (error) {
                        console.error('Error parsing blog posts from storage event:', error);
                    }
                }
            };
            const handleCustomEvent = () => {
                try {
                    const savedPosts = localStorage.getItem('taruvae-blog-posts');
                    const posts = savedPosts ? JSON.parse(savedPosts) : [];
                    callback(posts);
                } catch (error) {
                    console.error('Error parsing blog posts from custom event:', error);
                }
            };
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('taruvae-blogs-updated', handleCustomEvent);
            const savedPosts = localStorage.getItem('taruvae-blog-posts');
            if (savedPosts) {
                try {
                    const posts = JSON.parse(savedPosts);
                    callback(posts);
                } catch (error) {
                    console.error('Error parsing initial blog posts:', error);
                }
            }
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('taruvae-blogs-updated', handleCustomEvent);
            };
        }

        const blogsRef = ref(database, 'blogs');
        const handleSnapshot = (snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
                const blogsData = snapshot.val();
                let posts: BlogPost[];
                if (Array.isArray(blogsData)) {
                    posts = blogsData;
                } else {
                    posts = Object.values(blogsData);
                }
                localStorage.setItem('taruvae-blog-posts', JSON.stringify(posts));
                callback(posts);
            } else {
                const savedPosts = localStorage.getItem('taruvae-blog-posts');
                if (savedPosts) {
                    try {
                        const posts = JSON.parse(savedPosts);
                        callback(posts);
                    } catch (error) {
                        console.error('Error parsing blog posts from localStorage:', error);
                        callback([]);
                    }
                } else {
                    callback([]);
                }
            }
        };
        onValue(blogsRef, handleSnapshot);
        return () => {
            off(blogsRef);
        };
    } catch (error: any) {
        console.error('Error setting up blog posts subscription:', error);
        return () => {};
    }
}

// Update blog post views count
export async function updateBlogPostViews(postId: string, newViewsCount: number): Promise<{ success: boolean; message: string }> {
    try {
        if (!database || (typeof database === 'object' && Object.keys(database).length === 0)) {
            // Update in localStorage
            const savedPosts = localStorage.getItem('taruvae-blog-posts');
            if (savedPosts) {
                const posts: BlogPost[] = JSON.parse(savedPosts);
                const postIndex = posts.findIndex(p => p.id === postId);
                if (postIndex !== -1) {
                    posts[postIndex].views = newViewsCount;
                    localStorage.setItem('taruvae-blog-posts', JSON.stringify(posts));
                    window.dispatchEvent(new Event('taruvae-blogs-updated'));
                }
            }
            return { success: true, message: 'Views updated in localStorage' };
        }

        // Get all posts
        const blogsRef = ref(database, 'blogs');
        const snapshot = await get(blogsRef);
        
        if (snapshot.exists()) {
            const blogsData = snapshot.val();
            let posts: BlogPost[];
            
            if (Array.isArray(blogsData)) {
                posts = blogsData;
            } else {
                posts = Object.values(blogsData);
            }
            
            // Find and update the post
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                posts[postIndex].views = newViewsCount;
                
                // Save updated posts
                const cleanedPosts = removeUndefinedValues(posts);
                await set(blogsRef, cleanedPosts);
                
                // Also update localStorage
                localStorage.setItem('taruvae-blog-posts', JSON.stringify(posts));
                window.dispatchEvent(new Event('taruvae-blogs-updated'));
                
                return { success: true, message: 'Views updated successfully' };
            }
        }
        
        return { success: false, message: 'Post not found' };
    } catch (error: any) {
        console.error('Error updating blog post views:', error);
        return { success: false, message: error.message || 'Failed to update views' };
    }
}

