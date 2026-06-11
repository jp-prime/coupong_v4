import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyC6RYzyhKUpCsrH_b-xgoy_-ZMNvFiTEQI",
    authDomain: "coupong-98b03.firebaseapp.com",
    projectId: "coupong-98b03",
    storageBucket: "coupong-98b03.firebasestorage.app",
    messagingSenderId: "1095510519046",
    appId: "1:1095510519046:web:da0bb580d6948dfdd44287",
    measurementId: "G-SV2ZZQG08Q"
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
