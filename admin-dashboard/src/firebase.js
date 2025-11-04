import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase configuration
 * These are public identifiers - it's safe to commit them
 * Get these from Firebase Console -> Project Settings -> General -> Your apps
 */
const firebaseConfig = {
  apiKey: "AIzaSyBqomROTpVMIBRbYBpXRdOUnFBtZXaEwZM",
  authDomain: "mixillo.firebaseapp.com",
  projectId: "mixillo",
  storageBucket: "mixillo.appspot.com",
  messagingSenderId: "52242135857",
  appId: "1:52242135857:web:671ea9f6f496f523750e10"
};

/**
 * Initialize Firebase
 * Only initialize once (handles hot module reloading in development)
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Authentication
 * Export for use throughout the application
 */
const auth = getAuth(app);

// Set auth language to the default device language
auth.languageCode = 'en';

export { auth, app };
export default auth;
