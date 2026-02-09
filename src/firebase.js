import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMaakvjUzZ79xOMAkZzt_6r7AiQt4o7aE",
  authDomain: "genai-35d1a.firebaseapp.com",
  projectId: "genai-35d1a",
  storageBucket: "genai-35d1a.firebasestorage.app",
  messagingSenderId: "89251874662",
  appId: "1:89251874662:web:a83a31cae9e0e6136e2aa7",
  measurementId: "G-0YKTRRCRVE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export Services (Storage removed)
export { auth, db, googleProvider, analytics };