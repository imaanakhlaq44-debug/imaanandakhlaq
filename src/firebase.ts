import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4MrV-oXhK_johreyzIucti5RFrKcvyG8",
  authDomain: "imaan-app-1d2da.firebaseapp.com",
  projectId: "imaan-app-1d2da",
  storageBucket: "imaan-app-1d2da.firebasestorage.app",
  messagingSenderId: "373650938167",
  appId: "1:373650938167:web:e9da1317c118bc720d22b2",
  measurementId: "G-2SWVNDL1F8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
