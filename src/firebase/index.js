import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace with your Firebase project configuration
// 1. Visit https://console.firebase.google.com/
// 2. Create a new project (or select an existing one)
// 3. Go to Project Settings > General > Your apps > Add web app
// 4. Copy the "firebaseConfig" object and paste it below
const firebaseConfig = {
    apiKey: "AIzaSyBR1SYPun3h8W-by8TUKe-QepyFUtLQRGg",
    authDomain: "coupong-98b03.firebaseapp.com",
    projectId: "coupong-98b03",
    storageBucket: "coupong-98b03.firebasestorage.app",
    messagingSenderId: "1095510519046",
    appId: "1:1095510519046:web:a5efdc287be15819d44287",
    measurementId: "G-DJJ46D7WJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (접속자 추적을 위해 필수 - 클라이언트 단에서만 실행)
export let analytics;
if (typeof window !== "undefined") {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.warn("Firebase Analytics failed to initialize:", e);
    }
}
