import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// ADDED: You need to import this to use the database
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyDISAQNzXm2OhlTDfSSJwSWhKzBrkOlaMo",
  authDomain: "codesense-d3d05.firebaseapp.com",
  projectId: "codesense-d3d05",
  storageBucket: "codesense-d3d05.firebasestorage.app",
  messagingSenderId: "411099370082",
  appId: "1:411099370082:web:45708d93e2a207f502b73b",
  measurementId: "G-WGM978N2ZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// EXPORT: This makes 'db' available to your Database.ts file
export const db = getFirestore(app);