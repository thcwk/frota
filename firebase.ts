
import { initializeApp } from '@firebase/app'; // Changed from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, sendPasswordResetEmail } from '@firebase/auth'; // Changed from 'firebase/auth'
import { 
    getFirestore,
    Timestamp as FirebaseTimestamp,
    serverTimestamp as FirebaseServerTimestamp
} from '@firebase/firestore'; // Changed from 'firebase/firestore'

// TODO: Replace with your project's actual Firebase configuration
// It's highly recommended to use environment variables for Firebase config in production.
// Please VERIFY these values against your Firebase project console.
const firebaseConfig = {
  apiKey: "AIzaSyD-OHlN_PjQcd3QDhx6THlxVtsjsMf70QI", // Example Key, ensure it's your actual project key
  authDomain: "frota-15100.firebaseapp.com",
  projectId: "frota-15100",
  storageBucket: "frota-15100.appspot.com", 
  messagingSenderId: "1049452130699",
  appId: "1:1049452130699:web:46729ab66215838663bf8e",
  measurementId: "G-4L4PV54HNG" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const fbAuth = getAuth(app);
export const db = getFirestore(app);

// Export commonly used Auth functions and types for convenience
export {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
};
export type { User as FirebaseUser };

export const Timestamp = FirebaseTimestamp; 
export const serverTimestamp = FirebaseServerTimestamp;
