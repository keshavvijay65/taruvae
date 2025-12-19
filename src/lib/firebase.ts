import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Your web app's Firebase configuration
// Using environment variables for better security, with fallback to hardcoded values
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWpkuJPQFxbgH3kH7IBjPQk5eBH0oF95g",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "taruveda-naturals-fd588.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://taruveda-naturals-fd588-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "taruveda-naturals-fd588",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "taruveda-naturals-fd588.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "585062522821",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:585062522821:web:94387059217dcdf9a4b5ac"
};

// Validate Firebase config silently - no console warnings
// Firebase will be initialized only if config is valid

// Initialize Firebase only if not already initialized
let app: FirebaseApp | undefined;
let database: Database | undefined;
let auth: Auth | undefined;

// Function to initialize Firebase - with proper error handling
function initializeFirebase() {
    // Don't initialize if API key is missing
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        return null;
    }
    
    if (!firebaseConfig.apiKey.startsWith('AIza')) {
        return null;
    }

    try {
        const apps = getApps();
        if (apps.length === 0) {
            app = initializeApp(firebaseConfig);
        } else {
            app = apps[0];
        }
        
        // Initialize Database
        try {
            database = getDatabase(app);
        } catch (dbError) {
            database = undefined;
        }
        
        // Initialize Auth - getAuth doesn't throw errors during initialization
        // Errors only occur when actually using auth methods
        if (app) {
            auth = getAuth(app);
            // Return app if auth was initialized
            return app;
        }
        
        return null;
    } catch (error: any) {
        // Suppress all initialization errors
        app = undefined;
        database = undefined;
        auth = undefined;
        return null;
    }
}

// Initialize Firebase
const initializedApp = initializeFirebase();

// Export with fallback - ensure we have valid exports even if initialization fails
const exportedDatabase = database || ({} as Database);
const exportedAuth = auth || ({} as Auth);

export { exportedDatabase as database, exportedAuth as auth };
export default initializedApp || ({} as FirebaseApp);
