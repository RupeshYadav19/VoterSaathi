/**
 * Firebase Integration for VoterSaathi
 * @module firebase
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getPerformance } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-performance.js";
import { showToast } from "./ui.js";

const CONFIG = window.VOTER_CONFIG;
const firebaseConfig = CONFIG?.FIREBASE_CONFIG || {};

let app, analytics, auth, db, perf;

if (CONFIG) {
    try {
        app = initializeApp(firebaseConfig);
        analytics = getAnalytics(app);
        auth = getAuth(app);
        db = getFirestore(app);
        perf = getPerformance(app);
        
        // Ensure persistence
        setPersistence(auth, browserLocalPersistence).catch(console.error);
    } catch (e) {
        showToast("Failed to initialize backend services.", "error");
    }
}

let currentUser = null;

/**
 * Initializes authentication listeners and UI updates.
 * @param {Function} callback - Function to call on auth state change.
 */
export const initAuth = (callback) => {
    if (!auth) return;
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            logEvent(analytics, 'login', { method: 'Google' });
        }
        if (callback) callback(user);
    });
};

/**
 * Handles the login process.
 */
export const login = async () => {
    if (!auth) {
        showToast("Firebase is not initialized.", "error");
        return;
    }
    try {
        if (currentUser) {
            await signOut(auth);
            showToast("Logged out successfully.", "success");
        } else {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            showToast("Logged in successfully.", "success");
        }
    } catch (error) {
        showToast("Authentication failed. Please try again.", "error");
        // Log failed auth attempts securely (if we had a public endpoint, but we don't need to expose details)
    }
};

/**
 * Returns the currently authenticated user.
 * @returns {Object|null} The user object.
 */
export const getCurrentUser = () => currentUser;

/**
 * Saves a user's search history to Firestore.
 * @param {string} pincode - The searched pincode.
 */
export const saveSearchHistory = async (pincode) => {
    if (!currentUser || !db) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            lastPincode: pincode,
            lastSearch: serverTimestamp(),
            email: currentUser.email
        }, { merge: true });
        logEvent(analytics, 'search', { search_term: pincode });
    } catch (error) {
        showToast("Failed to save search history.", "error");
    }
};

/**
 * Saves a chat message to Firestore.
 * @param {string} userMessage - The user's input.
 * @returns {Promise<string|null>} The document ID.
 */
export const saveChatHistory = async (userMessage) => {
    if (!currentUser || !db) return null;
    try {
        const docRef = await addDoc(collection(db, "chatHistory"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userMessage: userMessage,
            aiResponse: "Pending...",
            timestamp: serverTimestamp()
        });
        logEvent(analytics, 'chat_message', { type: 'user' });
        return docRef.id;
    } catch (error) {
        return null;
    }
};

/**
 * Updates a chat message with the AI response.
 * @param {string} docId - The Firestore document ID.
 * @param {string} aiResponse - The AI's response.
 */
export const updateChatResponse = async (docId, aiResponse) => {
    if (!docId || !db) return;
    try {
        await setDoc(doc(db, "chatHistory", docId), {
            aiResponse: aiResponse
        }, { merge: true });
    } catch (error) {
        // Ignore silent failure for UX
    }
};
