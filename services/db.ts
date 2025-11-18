
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { firebaseConfig } from './firebaseConfig';
import { UserProfile, JournalEntry, CancerType, CancerStage } from '../types';

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
   * Save profile for a user who is already authenticated (e.g. via Google)
   */
  saveProfile: async (profile: UserProfile): Promise<UserProfile> => {
      try {
          await ensureInitialized();
          const user = auth.currentUser;
          if (!user) throw new Error("No authenticated user found");

          await firestore.collection('users').doc(user.uid).set({
              ...profile,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          console.log("✅ User profile saved to Firestore for Google user");
          return profile;
      } catch (error: any) {
          console.error("❌ Error saving profile:", error);
          throw error;
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
   * Sign in with Google
   */
  signInWithGoogle: async (): Promise<{ profile: UserProfile, isNewUser: boolean }> => {
    try {
      console.log("🌐 Initiating Google Sign In...");
      await ensureInitialized();
      const provider = new firebase.auth.GoogleAuthProvider();
      
      // Force selection to avoid instant login loop issues during testing
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      
      if (!user) throw new Error("Google Sign In failed - No user returned");
      
      // Check if profile exists
      const existingProfile = await fetchProfile(user.uid);
      if (existingProfile) {
        console.log("✅ Found existing profile for Google user");
        return { profile: existingProfile, isNewUser: false };
      }

      // Return a template profile for new users to fill out
      console.log("📝 New Google user detected, preparing for profile creation...");
      const templateProfile: UserProfile = {
        name: user.displayName || 'User',
        age: 30, 
        email: user.email || '',
        gender: 'Prefer not to say',
        height: 165,
        weight: 60,
        cancerType: CancerType.CERVICAL,
        cancerStage: CancerStage.EARLY,
        otherConditions: [],
        treatmentStages: [],
        plan: 'Free',
      };

      return { profile: templateProfile, isNewUser: true };
    } catch (error: any) {
      console.error("❌ Google Sign In error:", error);
      if (error.code === 'auth/operation-not-supported-in-this-environment') {
          throw new Error("Google Sign In is not supported in this preview environment. Please try opening the app in a new window or deploying it.");
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("Sign in cancelled.");
      }
      throw new Error(error.message || "Google Sign In failed.");
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
                // If profile is missing, it might be a new Google user who hasn't finished setup
                // In that case, we return null so the UI redirects them to auth/setup
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
        // Handle potential timestamp issues safely
        let timestamp = new Date();
        if (data.timestamp && (data.timestamp as firebase.firestore.Timestamp).toDate) {
          timestamp = (data.timestamp as firebase.firestore.Timestamp).toDate();
        }
        
        return {
          id: doc.id,
          timestamp: timestamp.toISOString(),
          name: timestamp.toLocaleDateString(undefined, { weekday: 'short' }),
          weight: data.weight,
          energy: data.energy,
          bp: data.bp, // Optional now
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
  addJournalEntry: async (entry: { weight: number; bp?: number; energy: number; notes?: string; }): Promise<string> => {
    try {
      await ensureInitialized();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated. Cannot add journal entry.");
      }
      
      // Sanitize input to remove undefined values which Firestore rejects
      const payload: Record<string, any> = {
        weight: entry.weight,
        energy: entry.energy,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (entry.bp !== undefined && entry.bp !== null && !isNaN(entry.bp)) {
        payload.bp = entry.bp;
      }
      
      if (entry.notes !== undefined && entry.notes !== null && entry.notes.trim() !== "") {
        payload.notes = entry.notes;
      }

      const docRef = await firestore
        .collection('users')
        .doc(user.uid)
        .collection('journal')
        .add(payload);
        
      return docRef.id;
    } catch (error: any) {
      console.error("❌ Error adding journal entry:", error);
      throw error;
    }
  },
};
