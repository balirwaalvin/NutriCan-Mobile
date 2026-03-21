/**
 * NutriCan API client – Migrated to Appwrite BaaS
 *
 * This refactored version uses the Appwrite Web SDK while preserving the exact 
 * public interface (`db.*`) so that component code doesn't need to change.
 */

import { Client, Account, Databases, Storage, ID, Query, OAuthProvider } from 'appwrite';
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_PROFILES_COLLECTION,
  APPWRITE_JOURNAL_COLLECTION,
  APPWRITE_MEALS_COLLECTION,
  APPWRITE_DOCS_BUCKET,
  APPWRITE_BOOKS_BUCKET
} from './config';
import {
  UserProfile,
  JournalEntry,
  LoggedMeal,
  NutrientInfo,
  CancerType,
  CancerStage,
} from '../types';

// ── Appwrite Initialization ───────────────────────────────────────────────────

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// ── Helper: map a raw Appwrite document to the UserProfile type ───────────────

function mapProfile(raw: any): UserProfile {
  let bmi = raw.bmi;
  
  if (!bmi && raw.height && raw.weight) {
    const heightInMeters = raw.height / 100;
    if (heightInMeters > 0) {
      bmi = parseFloat((raw.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }
  }

  return {
    name: raw.name,
    age: raw.age,
    email: raw.email,
    height: raw.height,
    weight: raw.weight,
    cancerType: raw.cancerType as CancerType,
    cancerStage: raw.cancerStage as CancerStage,
    otherConditions: raw.otherConditions && Array.isArray(raw.otherConditions) ? raw.otherConditions : [],
    treatmentStages: raw.treatmentStages && Array.isArray(raw.treatmentStages) ? raw.treatmentStages : [],
    plan: raw.plan ?? 'Free',
    isVerified: raw.isVerified ?? false,
    documentsSubmitted: raw.documentsSubmitted ?? false,
    isGuest: raw.isGuest ?? false,
    createdAt: raw.createdAt || raw.$createdAt,
    trialStartedAt: raw.trialStartedAt,
    bmi: bmi,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const clearToken = () => {
    // Kept to prevent missing module exported function error, but session management is now cookie-based via Appwrite.
}

export const db = {
  /**
   * Sign up a new user with email and password.
   */
  signUp: async (
    email: string,
    password: string,
    profile: UserProfile
  ): Promise<UserProfile> => {
    const user = await account.create(ID.unique(), email, password, profile.name);
    await account.createEmailPasswordSession(email, password);
    
    // Create profile document natively using the Auth ID so it matches:
    const profileDoc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_PROFILES_COLLECTION,
      user.$id,
      {
        ...profile,
        email,        
      }
    );

    return mapProfile(profileDoc);
  },

  /**
   * Save profile for an already-authenticated user (kept for API parity).
   */
  saveProfile: async (profile: UserProfile): Promise<UserProfile> => {
      const user = await account.get();
      const profileDoc = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PROFILES_COLLECTION,
          user.$id,
          profile
      );
      return mapProfile(profileDoc);
  },

  /**
   * Reset current user password.
   */
  resetPassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await account.updatePassword(newPassword, currentPassword);
  },

  /**
   * Sign in with email and password.
   */
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    try {
        await account.createEmailPasswordSession(email, password);
    } catch (e: any) {
        // Handle case where a session already exists
        if(e.code !== 401) {
            try { await account.get(); } catch (innerError) { throw e; }
        } else {
            throw e;
        }
    }

    const user = await account.get();
    try {
        const profileDoc = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILES_COLLECTION,
            user.$id
        );
        return mapProfile(profileDoc);
    } catch (error) {
        // Fallback for missing profile
        return mapProfile({ name: user.name, email: user.email });
    }
  },

  /**
   * Sign in as a guest.
   */
  signInAnonymously: async (): Promise<UserProfile> => {
    await account.createAnonymousSession();
    const user = await account.get();
    
    const profileDoc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_PROFILES_COLLECTION,
      user.$id,
      {
        name: 'Guest User',
        email: `guest_${user.$id}@anonymous.local`,
        age: 0,
        height: 0,
        weight: 0,
        isGuest: true,
        cancerType: 'Breast',
        cancerStage: 'Stage I'
      }
    );
    return mapProfile(profileDoc);
  },

  /**
   * Google Sign-In is not supported with the JWT backend.
   * Kept for API parity – will throw a clear error.
   */
  signInWithGoogle: async (): Promise<{ profile: UserProfile; isNewUser: boolean }> => {
    account.createOAuth2Session(OAuthProvider.Google, `${window.location.origin}/`, `${window.location.origin}/`);
    // Flow requires redirect. In a synchronous block, returning error to indicate redirect logic flow.
    throw new Error('Redirecting to Google. Ensure you handle the OAuth callback separately.');
  },

  /**
   * Sign out – clears the stored Appwrite cookie session.
   */
  signOut: async (): Promise<void> => {
    await account.deleteSession('current');
  },

  /**
   * Check for an existing session by validating via Appwrite.
   * Returns null if no session.
   */
  getSession: async (): Promise<UserProfile | null> => {
    try {
      const user = await account.get();
      const profileDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PROFILES_COLLECTION,
        user.$id
      );
      return mapProfile(profileDoc);
    } catch (error) {
      return null;
    }
  },

  /**
   * Update the current user's profile.
   */
  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const user = await account.get();
    const profileDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PROFILES_COLLECTION,
        user.$id,
        updates
    );
    return mapProfile(profileDoc);
  },

  /**
   * Upload medical documents to Appwrite Storage Bucket
   */
  uploadMedicalDocs: async (file: File): Promise<void> => {
    // Using simple Appwrite storage bucket method
    await storage.createFile(
        APPWRITE_DOCS_BUCKET,
        ID.unique(),
        file
    );
  },

  /**
   * Get a signed download URL for a book.
   */
  getBookDownloadUrl: async (bookKey: string): Promise<string> => {
    const url = storage.getFileDownload(APPWRITE_BOOKS_BUCKET, bookKey);
    return url.toString();
  },

  /**
   * Upgrade the current user to the Premium plan.
   */
  upgradeToPremium: async (_uid: string): Promise<void> => {
    const user = await account.get();
    await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PROFILES_COLLECTION,
        user.$id,
        { plan: 'Premium' }
    );
  },

  /**
   * Fetch journal entries for the current user.
   */
  getJournalEntries: async (): Promise<JournalEntry[]> => {
    const user = await account.get();
    const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_JOURNAL_COLLECTION,
        [
            Query.equal('userId', user.$id),
            Query.orderDesc('$createdAt')
        ]
    );
    return result.documents.map(doc => ({
        id: doc.$id,
        weight: doc.weight,
        bp: doc.bp,
        energy: doc.energy,
        notes: doc.notes,
        timestamp: doc.createdAt || doc.$createdAt,
        name: doc.name || 'Entry'
    }));
  },

  /**
   * Add a new journal entry.
   */
  addJournalEntry: async (entry: {
    weight: number;
    bp?: number;
    energy: number;
    notes?: string;
  }): Promise<string> => {
    const user = await account.get();
    const doc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_JOURNAL_COLLECTION,
        ID.unique(),
        {
            ...entry,
            userId: user.$id,
            createdAt: new Date().toISOString()
        }
    );
    return doc.$id;
  },

  /**
   * Log a meal for the current user.
   */
  addMealLog: async (meal: { name: string; nutrients: NutrientInfo }): Promise<string> => {
    const user = await account.get();
    // Stringify nutrients object if Appwrite schema does not support nested JSON immediately,
    // although standard Appwrite databases support String attributes formatted as JSON or object relationships.
    // Assuming nutrients is an object block or JSON string:
    const doc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MEALS_COLLECTION,
        ID.unique(),
        {
            name: meal.name,
            nutrients: JSON.stringify(meal.nutrients), // Safe serialization
            userId: user.$id,
            createdAt: new Date().toISOString()
        }
    );
    return doc.$id;
  },

  /**
   * Fetch meal logs for the current user.
   */
  getMealLogs: async (): Promise<LoggedMeal[]> => {
    const user = await account.get();
    const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_MEALS_COLLECTION,
        [
            Query.equal('userId', user.$id),
            Query.orderDesc('$createdAt')
        ]
    );

    return result.documents.map(doc => {
        let parsedNutrients: NutrientInfo = { calories: 0, salt: 0, sugar: 0 };
        try {
            parsedNutrients = typeof doc.nutrients === 'string' ? JSON.parse(doc.nutrients) : doc.nutrients;
        } catch (e) {
            // Ignore parse errors
        }

        return {
            id: doc.$id,
            name: doc.name,
            nutrients: parsedNutrients,
            timestamp: doc.createdAt || doc.$createdAt
        };
    });
  },
};
