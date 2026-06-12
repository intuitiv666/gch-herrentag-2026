import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5eEpivWPohS2m6p3fDe8MznwCyBwlois",
  authDomain: "gch2026-d843f.firebaseapp.com",
  projectId: "gch2026-d843f",
  storageBucket: "gch2026-d843f.firebasestorage.app",
  messagingSenderId: "958510603779",
  appId: "1:958510603779:web:81bcbf5a804a380d437836"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
