import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { firebaseConfig } from './firebaseConfig';
import { UserProfile, JournalEntry } from '../types';

// Initialize Firebase once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();

let isInitialized = false;

const ensureInitialized = async (): Promise<void> => {
  if (isInitialized) return;
  isInitialized = true;
  console.log("✅ Firebase Firestore initialized");
};

/**
 * Fetch user profile from Firestore
 */
const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
  await ensureInitialized();
  try {
    const docSnapshot = await firestore.collection('users').doc(uid).get();
    if (docSnapshot.exists) {
      return docSnapshot.data() as UserProfile;
    }
    console.warn(`⚠️ No profile found for user: ${uid}`);
    return null;
  } catch (error: any) {
    console.error("❌ Error fetching profile:", error);
    throw error;
  }
};

export const db = {
  /**
   * Sign up a new user with email and password
   */
  signUp: async (email: string, password: string, profile: UserProfile): Promise<UserProfile> => {
    try {
      console.log("📝 Attempting sign up for:", email);
      await ensureInitialized();

      // Create user account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("✅ User account created:", user?.uid);

      // Save profile to Firestore
      await firestore.collection('users').doc(user?.uid).set({
        ...profile,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✅ User profile saved to Firestore");

      return profile;
    } catch (error: any) {
      console.error("❌ Sign up error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      
      throw new Error(error.message || "An unexpected error occurred during sign up.");
    }
  },

  /**
   * Sign in user with email and password
   */
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    try {
      console.log("🔐 Attempting sign in for:", email);
      await ensureInitialized();

      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("✅ User signed in:", user?.uid);

      const profile = await fetchProfile(user?.uid!);
      if (!profile) {
        throw new Error('User profile not found in Firestore.');
      }

      return profile;
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        throw new Error('Invalid email or password.');
      }
      
      throw new Error(error.message || "An unexpected error occurred during sign in.");
    }
  },

  /**
   * Sign out current user
   */
  signOut: async (): Promise<void> => {
    try {
      console.log("👋 Signing out user...");
      await ensureInitialized();
      await auth.signOut();
      console.log("✅ User signed out successfully");
    } catch (error: any) {
      console.error("❌ Sign out error:", error);
      throw new Error(error.message || "Failed to sign out.");
    }
  },

  /**
   * Get current user session
   */
  getSession: async (): Promise<UserProfile | null> => {
    return new Promise((resolve) => {
      (async () => {
        try {
          console.log("🔍 Checking for existing session...");
          await ensureInitialized();

          auth.onAuthStateChanged(async (user) => {
            try {
              if (user) {
                console.log("✅ Found active session for user:", user.uid);
                const profile = await fetchProfile(user.uid);
                resolve(profile);
              } else {
                console.log("ℹ️ No active session found");
                resolve(null);
              }
            } catch (error: any) {
              console.error("❌ Error fetching session profile:", error);
              resolve(null);
            }
          });
        } catch (error: any) {
          console.error("❌ Session check error:", error);
          resolve(null);
        }
      })();
    });
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      console.log("✏️ Updating profile...");
      await ensureInitialized();

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated. Cannot update profile.");
      }

      // Update in Firestore
      await firestore.collection('users').doc(user.uid).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✅ Profile updated successfully");

      const updatedProfile = await fetchProfile(user.uid);
      if (!updatedProfile) {
        throw new Error("Failed to retrieve updated profile.");
      }

      return updatedProfile;
    } catch (error: any) {
      console.error("❌ Update profile error:", error);
      throw new Error(error.message || "Failed to update profile.");
    }
  },

  /**
   * Get all journal entries for the current user
   */
  getJournalEntries: async (): Promise<JournalEntry[]> => {
    try {
      await ensureInitialized();
      const user = auth.currentUser;
      if (!user) {
        console.warn("⚠️ No user authenticated. Cannot get journal entries.");
        return [];
      }
      
      const snapshot = await firestore
        .collection('users')
        .doc(user.uid)
        .collection('journal')
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();
        
      if (snapshot.empty) {
        return [];
      }

      const entries: JournalEntry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = (data.timestamp as firebase.firestore.Timestamp).toDate();
        return {
          id: doc.id,
          timestamp: timestamp.toISOString(),
          name: timestamp.toLocaleDateString(undefined, { weekday: 'short' }),
          weight: data.weight,
          energy: data.energy,
          bp: data.bp,
          notes: data.notes,
        };
      });
      
      return entries;
    } catch (error: any) {
      console.error("❌ Error fetching journal entries:", error);
      throw error;
    }
  },
  
  /**
   * Add a new journal entry for the current user
   */
  addJournalEntry: async (entry: { weight: number; bp: number; energy: number; notes?: string; }): Promise<string> => {
    try {
      await ensureInitialized();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated. Cannot add journal entry.");
      }
      
      const docRef = await firestore
        .collection('users')
        .doc(user.uid)
        .collection('journal')
        .add({
          ...entry,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
      return docRef.id;
    } catch (error: any) {
      console.error("❌ Error adding journal entry:", error);
      throw error;
    }
  },
};
