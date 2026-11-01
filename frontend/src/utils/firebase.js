
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interview-75dd2.firebaseapp.com",
  projectId: "interview-75dd2",
  storageBucket: "interview-75dd2.firebasestorage.app",
  messagingSenderId: "201565113540",
  appId: "1:201565113540:web:178781f632b8cd79c30d91"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}