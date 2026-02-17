import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

const isBrowser = typeof window !== 'undefined';

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;

function initFirebase() {
    if (getApps().length > 0) {
        app = getApp();
    } else {
        app = initializeApp(firebaseConfig);
    }

    auth = getAuth(app);
    db = getDatabase(app);
    // firestore = getFirestore(app); // REMOVED per user request
    storage = getStorage(app);

    return { app, auth, db, storage };
}

// Initializing on import (Safe because Firebase SDK handles multiple calls or we check getApps)
const instances = initFirebase();

export const firebaseApp = instances.app;
export const firebaseAuth = instances.auth;
export const firebaseDb = instances.db;
// export const firebaseFirestore = instances.firestore; // REMOVED
export const firebaseStorage = instances.storage;

export default firebaseApp;
