import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNtZnB-6yLqVp5oyS0uscYCVwitH6TVQA",
  authDomain: "gel-al-yavuzturk.firebaseapp.com",
  projectId: "gel-al-yavuzturk",
  storageBucket: "gel-al-yavuzturk.firebasestorage.app",
  messagingSenderId: "1098979484800",
  appId: "1:1098979484800:web:60522d5dfbb265030eb265",
};

const app = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
