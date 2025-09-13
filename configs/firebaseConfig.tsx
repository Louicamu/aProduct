// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBsUrfVFqB_cycWjNWnDH319mYPQJITR1A",
    authDomain: "ai-ads-tool-6a8c0.firebaseapp.com",
    projectId: "ai-ads-tool-6a8c0",
    storageBucket: "ai-ads-tool-6a8c0.firebasestorage.app",
    messagingSenderId: "269936687110",
    appId: "1:269936687110:web:39ea9d2be13a2cf68f6b87",
    measurementId: "G-KVFGT27V5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);