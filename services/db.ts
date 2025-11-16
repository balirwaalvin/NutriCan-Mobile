import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { UserProfile } from '../types';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

const USERS_COLLECTION = 'users';

export const db = {
  /**
   * Signs up a new user with email and password, then saves their profile to Firestore.
   */
  signUp: async (email: string, password: string, profile: UserProfile): Promise<UserProfile> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // We don't store the password in the profile document.
      const profileToSave = { ...profile };
      await setDoc(doc(firestore, USERS_COLLECTION, user.uid), profileToSave);
      return profile;
    } catch (error: any) {
      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      throw new Error(error.message || 'An unknown error occurred during sign up.');
    }
  },

  /**
   * Signs in a user and retrieves their profile from Firestore.
   */
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(firestore, USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        throw new Error('User profile not found. Please contact support.');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password.');
      }
      throw new Error(error.message || 'An unknown error occurred during sign in.');
    }
  },

  /**
   * Signs out the current user.
   */
  signOut: async () => {
    await signOut(auth);
  },

  /**
   * Checks the current authentication state and retrieves the user profile if logged in.
   * This is crucial for session persistence.
   */
  getSession: async (): Promise<UserProfile | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // We only need the initial state, so we unsubscribe immediately.
        if (user) {
          try {
            const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, user.uid));
            if (userDoc.exists()) {
              resolve(userDoc.data() as UserProfile);
            } else {
              // This case can happen if a user is in Auth but their Firestore doc was deleted.
              resolve(null);
            }
          } catch (error) {
            console.error("Error fetching user profile during session check:", error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  },
  
  /**
   * Updates the current user's profile in Firestore.
   */
  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated. Cannot update profile.");
    }

    const userDocRef = doc(firestore, USERS_COLLECTION, user.uid);
    await updateDoc(userDocRef, updates);

    const updatedDoc = await getDoc(userDocRef);
    if (!updatedDoc.exists()) {
        throw new Error("Failed to retrieve updated profile.");
    }
    
    return updatedDoc.data() as UserProfile;
  }
};