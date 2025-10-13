import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_iKsRVhT3v0CJUgLJtwbow06HyLJp10Q",
  authDomain: "sistema-horarios-22f7a.firebaseapp.com",
  projectId: "sistema-horarios-22f7a",
  storageBucket: "sistema-horarios-22f7a.firebasestorage.app",
  messagingSenderId: "949588347603",
  appId: "1:949588347603:web:b292b55e44896d116ee226"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
