/**
 * Firebase Storage - Image Upload Utility
 * ========================================
 * Handles image uploads to Firebase Storage
 * Returns download URLs for use in products
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

// Get storage instance
function getStorageInstance() {
    const app = getFirebaseApp();
    if (!app) {
        console.error('[FirebaseStorage] ❌ Firebase App not initialized!');
        return null;
    }
    try {
        const storage = getStorage(app);
        // Debug config
        if (!storage.app.options.storageBucket) {
            console.error('[FirebaseStorage] ❌ Storage Bucket is improperly configured:', storage.app.options);
        }
        return storage;
    } catch (error) {
        console.error('[FirebaseStorage] ❌ Failed to get storage instance:', error);
        return null;
    }
}

/**
 * Upload image to Firebase Storage
 * @param file - File object or base64 string
 * @param path - Storage path (e.g., 'products/image1.jpg')
 * @returns Download URL or null if failed
 */
export async function uploadImageToStorage(
    file: File | string,
    path: string,
    onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const storage = getStorageInstance();
        if (!storage) {
            return { success: false, error: 'Firebase Storage not initialized' };
        }

        const storageRef = ref(storage, path);
        let blob: Blob;

        if (typeof file === 'string') {
            // Convert base64 to blob
            if (file.startsWith('data:image')) {
                const response = await fetch(file);
                blob = await response.blob();
            } else {
                return { success: false, error: 'Invalid image data' };
            }
        } else {
            blob = file;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (blob.size > maxSize) {
            console.error(`[FirebaseStorage] ❌ File too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            return {
                success: false,
                error: `Image size (${(blob.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 5MB`
            };
        }

        console.log(`[FirebaseStorage] ☁️ Starting upload to: ${storageRef.fullPath}`);
        console.log(`[FirebaseStorage] 📦 Bucket: ${storage.app.options.storageBucket}`);
        console.log(`[FirebaseStorage] 📄 Size: ${(blob.size / 1024).toFixed(2)}KB`);

        // Upload to Firebase Storage using resumable implementation for progress tracking
        return new Promise((resolve) => {
            const uploadTask = uploadBytesResumable(storageRef, blob);

            uploadTask.on('state_changed',
                (snapshot: UploadTaskSnapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error('[FirebaseStorage] Upload failed:', error);
                    let errorMessage = 'Failed to upload image';
                    if (error?.code === 'storage/retry-limit-exceeded') {
                        errorMessage = 'Upload timeout: Please check your internet connection.';
                    } else if (error?.code === 'storage/unauthorized') {
                        errorMessage = 'Storage access denied: Please check rules';
                    }
                    resolve({ success: false, error: errorMessage });
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('[FirebaseStorage] ✅ Image uploaded successfully:', downloadURL);
                    resolve({ success: true, url: downloadURL });
                }
            );
        });

    } catch (error: any) {
        console.error('[FirebaseStorage] ❌ Upload CRITICAL FAILURE:', error);

        let errorMessage = 'Failed to upload image';

        if (error?.code === 'storage/retry-limit-exceeded') {
            errorMessage = 'Upload timeout: Please check your internet connection.';
        } else if (error?.code === 'storage/unauthorized') {
            errorMessage = 'Permission denied: Check Storage Rules.';
        } else if (error?.code === 'storage/quota-exceeded') {
            errorMessage = 'Storage quota exceeded.';
        } else if (error?.code === 'storage/object-not-found') {
            errorMessage = 'Storage bucket not found or invalid configuration.';
        } else if (error?.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: `Upload Error: ${errorMessage}`
        };
    }
}

/**
 * Compress image before upload for faster uploads
 * @param file - Original image file
 * @param maxWidth - Maximum width (default 800px)
 * @param maxHeight - Maximum height (default 800px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed file
 */
/**
 * Safe wrapper for compression with timeout
 */
async function compressImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.7
): Promise<File> {
    // 5 second timeout for compression
    const timeoutPromise = new Promise<File>((_, reject) => {
        setTimeout(() => reject(new Error('Compression timed out')), 5000);
    });

    const compressionPromise = new Promise<File>((resolve, reject) => {
        console.log(`[ImageCompression] 🔄 Processing: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });

                        const reduction = ((1 - (compressedFile.size / file.size)) * 100).toFixed(1);
                        console.log(`[ImageCompression] ✅ Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB (Reduced: ${reduction}%)`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file for compression'));
        };
    });

    return Promise.race([compressionPromise, timeoutPromise]);
}

/**
 * Upload product image with auto-generated path
 * Images are automatically compressed before upload for faster performance
 * @param file - File object
 * @param productId - Product ID for path naming
 * @returns Download URL or null if failed
 */
export async function uploadProductImage(
    file: File,
    productId: string,
    onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
    console.log(`[ProductImageUpload] 🚀 Starting upload for product: ${productId}`);
    console.log(`[ProductImageUpload] 📄 File: ${file.name}, Type: ${file.type}`);

    // Convert File to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    try {
        console.log(`[ProductImageUpload] ☁️ Uploading to Cloudinary via API...`);
        const base64File = await fileToBase64(file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file: base64File }),
        });

        const data = await response.json();

        if (data.success) {
            console.log(`[ProductImageUpload] ✅ Upload successful!`);
            console.log(`[ProductImageUpload] 🔗 Download URL: ${data.url}`);
            return { success: true, url: data.url };
        } else {
            console.error(`[ProductImageUpload] ❌ Upload failed: ${data.error}`);
            return { success: false, error: data.error || 'Upload failed' };
        }
    } catch (error: any) {
        console.error('[ProductImageUpload] ❌ Upload error:', error);
        return { success: false, error: error.message || 'Upload failed' };
    }
}

/**
 * Upload base64 image to storage
 * @param base64 - Base64 encoded image string
 * @param productId - Product ID for naming
 * @returns Download URL or null if failed
 */
export async function uploadBase64Image(
    base64: string,
    productId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!base64 || !base64.startsWith('data:image')) {
        return { success: false, error: 'Invalid base64 image' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    // Extract extension from base64 header
    const mimeMatch = base64.match(/data:image\/(\w+);/);
    const extension = mimeMatch ? mimeMatch[1] : 'jpg';
    const fileName = `product_${productId}_${timestamp}.${extension}`;
    const path = `products/${fileName}`;

    return uploadImageToStorage(base64, path);
}

/**
 * Delete image from Firebase Storage
 * @param url - Full download URL of the image
 */
export async function deleteImageFromStorage(url: string): Promise<boolean> {
    try {
        const storage = getStorageInstance();
        if (!storage) return false;

        // Extract path from URL (Firebase Storage URLs contain the path)
        const decodedUrl = decodeURIComponent(url);
        const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
        if (!pathMatch) return false;

        const path = pathMatch[1];
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);

        console.log('[FirebaseStorage] Image deleted:', path);
        return true;

    } catch (error) {
        console.error('[FirebaseStorage] Delete failed:', error);
        return false;
    }
}

/**
 * Check if a URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
}

/**
 * Check if a string is a base64 image
 */
export function isBase64Image(str: string): boolean {
    return str.startsWith('data:image/');
}
