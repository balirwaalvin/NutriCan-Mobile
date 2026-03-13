/**
 * NutriCan API client  –  replaces the old Firebase/Firestore layer.
 *
 * All authentication is handled via JWT.  The token is stored in
 * localStorage under the key "nutrican_token" and sent as a Bearer header
 * on every authenticated request.
 *
 * The public interface (`db.*`) is intentionally identical to the old
 * Firebase implementation so that no component code needs to change.
 */

import { API_BASE_URL } from './config';
import {
  UserProfile,
  JournalEntry,
  LoggedMeal,
  NutrientInfo,
  CancerType,
  CancerStage,
} from '../types';

// ── Token helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'nutrican_token';

const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── Low-level fetch wrapper ───────────────────────────────────────────────────

type FetchOptions = RequestInit & { auth?: boolean };

async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = false, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (!token) throw new Error('No auth token found. Please sign in.');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as any).message || `HTTP ${response.status}`);
  }

  return data as T;
}

// ── Helper: map a raw API profile to the UserProfile type ────────────────────

function mapProfile(raw: any): UserProfile {
  return {
    name: raw.name,
    age: raw.age,
    email: raw.email,
    height: raw.height,
    weight: raw.weight,
    cancerType: raw.cancerType as CancerType,
    cancerStage: raw.cancerStage as CancerStage,
    otherConditions: raw.otherConditions ?? [],
    treatmentStages: raw.treatmentStages ?? [],
    plan: raw.plan ?? 'Free',
    isVerified: raw.isVerified ?? false,
    documentsSubmitted: raw.documentsSubmitted ?? false,
    isGuest: raw.isGuest ?? false,
    createdAt: raw.createdAt,
    trialStartedAt: raw.trialStartedAt,
    bmi: raw.bmi,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const db = {
  /**
   * Sign up a new user with email and password.
   */
  signUp: async (
    email: string,
    password: string,
    profile: UserProfile
  ): Promise<UserProfile> => {
    const { token, profile: raw } = await apiFetch<{ token: string; profile: any }>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ ...profile, email, password }),
      }
    );
    saveToken(token);
    return mapProfile(raw);
  },

  /**
   * Save profile for an already-authenticated user (kept for API parity).
   */
  saveProfile: async (profile: UserProfile): Promise<UserProfile> => {
    const { profile: raw } = await apiFetch<{ profile: any }>('/api/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(profile),
    });
    return mapProfile(raw);
  },

  /**
   * Sign in with email and password.
   */
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    const { token, profile: raw } = await apiFetch<{ token: string; profile: any }>(
      '/api/auth/signin',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    saveToken(token);
    return mapProfile(raw);
  },

  /**
   * Sign in as a guest.
   */
  signInAnonymously: async (): Promise<UserProfile> => {
    const { token, profile: raw } = await apiFetch<{ token: string; profile: any }>(
      '/api/auth/guest',
      { method: 'POST' }
    );
    saveToken(token);
    return mapProfile(raw);
  },

  /**
   * Google Sign-In is not supported with the JWT backend.
   * Kept for API parity – will throw a clear error.
   */
  signInWithGoogle: async (): Promise<{ profile: UserProfile; isNewUser: boolean }> => {
    throw new Error(
      'Google Sign-In is not available in this version. Please use Email/Password.'
    );
  },

  /**
   * Sign out – clears the stored JWT.
   */
  signOut: async (): Promise<void> => {
    clearToken();
  },

  /**
   * Check for an existing session by validating the stored JWT against the
   * server.  Returns null if no token exists or the token is invalid/expired.
   */
  getSession: async (): Promise<UserProfile | null> => {
    const token = getToken();
    if (!token) return null;

    try {
      const { profile: raw } = await apiFetch<{ profile: any }>('/api/auth/me', {
        auth: true,
      });
      return mapProfile(raw);
    } catch {
      clearToken(); // Token is invalid or expired
      return null;
    }
  },

  /**
   * Update the current user's profile.
   */
  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { profile: raw } = await apiFetch<{ profile: any }>('/api/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(updates),
    });
    return mapProfile(raw);
  },

  /**
   * Upload medical documents to DigitalOcean Spaces via the backend.
   */
  uploadMedicalDocs: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('document', file);

    const token = getToken();
    if (!token) throw new Error('No auth token found. Please sign in.');

    const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Upload failed');
    }
  },

  /**
   * Get a signed download URL for a book.
   */
  getBookDownloadUrl: async (bookKey: string): Promise<string> => {
    const key = bookKey.startsWith('books/') ? bookKey : `books/${bookKey}`;
    const { url } = await apiFetch<{ url: string }>(`/api/documents/book-signed-url?key=${encodeURIComponent(key)}`, {
      auth: true,
    });
    return url;
  },

  /**
   * Upgrade the current user to the Premium plan.
   */
  upgradeToPremium: async (_uid: string): Promise<void> => {
    await apiFetch('/api/profile/upgrade', { method: 'POST', auth: true });
  },

  /**
   * Fetch journal entries for the current user.
   */
  getJournalEntries: async (): Promise<JournalEntry[]> => {
    const { entries } = await apiFetch<{ entries: JournalEntry[] }>('/api/journal', {
      auth: true,
    });
    return entries;
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
    const { id } = await apiFetch<{ id: string }>('/api/journal', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(entry),
    });
    return id;
  },

  /**
   * Log a meal for the current user.
   */
  addMealLog: async (meal: { name: string; nutrients: NutrientInfo }): Promise<string> => {
    const { id } = await apiFetch<{ id: string }>('/api/meals', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(meal),
    });
    return id;
  },

  /**
   * Fetch meal logs for the current user.
   */
  getMealLogs: async (): Promise<LoggedMeal[]> => {
    const { meals } = await apiFetch<{ meals: LoggedMeal[] }>('/api/meals', {
      auth: true,
    });
    return meals;
  },
};
