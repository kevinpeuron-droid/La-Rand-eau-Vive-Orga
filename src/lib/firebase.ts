import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeHPWOXFTQaFLMinhtfkmC8TcFYfj0Bcw",
  authDomain: "logiciel-gestion-rand-eau-vive.firebaseapp.com",
  projectId: "logiciel-gestion-rand-eau-vive",
  storageBucket: "logiciel-gestion-rand-eau-vive.firebasestorage.app",
  messagingSenderId: "398420895109",
  appId: "1:398420895109:web:dd921bc7230ed99d07d0ec",
  measurementId: "G-HBKPZFXPDH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
