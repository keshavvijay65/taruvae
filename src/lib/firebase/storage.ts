import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    FirebaseStorage
} from 'firebase/storage';
import { firebaseStorage } from './config';

/**
 * Robust image upload with progress tracking and retry support
 */
export async function uploadWithProgress(
    path: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const storageRef = ref(firebaseStorage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
                console.log(`[FirebaseStorage] Upload is ${progress.toFixed(2)}% done`);
            },
            (error) => {
                console.error('[FirebaseStorage] Upload failed:', error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}
