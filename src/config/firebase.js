import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjbO_RMi9cQXACbd-NvtuxMvCnOOYgAxs",
  authDomain: "hms-system-8bd83.firebaseapp.com",
  projectId: "hms-system-8bd83",
  storageBucket: "hms-system-8bd83.firebasestorage.app",
  messagingSenderId: "42267937329",
  appId: "1:42267937329:web:a5b9cf3713532f8342e310"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
