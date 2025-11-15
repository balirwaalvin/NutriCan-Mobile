
import { UserProfile } from '../types';

/**
 * =============================================================================
 * IMPORTANT ARCHITECTURAL NOTE
 * =============================================================================
 * This file simulates a connection to a backend server for handling user data.
 * Directly connecting to a database (like MongoDB) from a frontend application
 * is a major security vulnerability. It would expose sensitive credentials
 * (username, password, connection strings) to anyone using the browser.
 *
 * The correct approach is:
 * 1. A backend server (e.g., using Node.js, Python, Go) connects to the database.
 * 2. The frontend communicates with this backend server via a secure API (e.g., REST or GraphQL).
 * 3. The backend handles all database operations (creating, reading, updating, deleting data).
 *
 * For this application, we are MOCKING the API calls. The functions below
 * will continue to use localStorage to simulate a database, but their structure
 * demonstrates how they would be written to interact with a real backend API.
 * =============================================================================
 */

const USERS_KEY = 'nutrican_users';
const SESSION_KEY = 'nutrican_session';
const API_BASE_URL = '/api'; // Placeholder for the real backend URL

interface UserRecord {
  profile: UserProfile;
  password: string; // Note: In a real production app, never store passwords in plain text. Hashing should be done server-side.
}

// Helper to get all users from storage (simulates a database)
const getUsers = (): Record<string, UserRecord> => {
  try {
    const usersJSON = localStorage.getItem(USERS_KEY);
    return usersJSON ? JSON.parse(usersJSON) : {};
  } catch (e) {
    console.error("Error reading users from mock storage", e);
    return {};
  }
};

// Helper to save users to storage (simulates a database)
const saveUsers = (users: Record<string, UserRecord>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};


export const db = {
  /**
   * Registers a new user.
   * In a real app, this would send a POST request to a `/api/auth/signup` endpoint.
   */
  signUp: async (email: string, password: string, profile: UserProfile): Promise<UserProfile> => {
    console.log(`[MOCK API] POST ${API_BASE_URL}/auth/signup`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    /*
    // Example of a real API call:
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, profile }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sign up failed');
    }
    const { userProfile, token } = await response.json();
    localStorage.setItem(SESSION_KEY, token); // Store auth token, not email
    return userProfile;
    */
    
    // --- MOCK IMPLEMENTATION ---
    const users = getUsers();
    if (users[email]) {
      throw new Error('User already exists with this email.');
    }

    users[email] = { profile, password };
    saveUsers(users);
    
    localStorage.setItem(SESSION_KEY, email); // Mocking session with email
    return profile;
  },

  /**
   * Signs in a user.
   * In a real app, this would send a POST request to a `/api/auth/signin` endpoint.
   */
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    console.log(`[MOCK API] POST ${API_BASE_URL}/auth/signin`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    /*
    // Example of a real API call:
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sign in failed');
    }
    const { userProfile, token } = await response.json();
    localStorage.setItem(SESSION_KEY, token); // Store auth token
    return userProfile;
    */

    // --- MOCK IMPLEMENTATION ---
    const users = getUsers();
    const user = users[email];

    if (!user) {
      throw new Error('User not found. Please sign up first.');
    }

    if (user.password !== password) {
      throw new Error('Invalid password.');
    }

    localStorage.setItem(SESSION_KEY, email); // Mocking session with email
    return user.profile;
  },

  /**
   * Signs out the current user.
   * In a real app, this might call a `/api/auth/signout` endpoint.
   */
  signOut: async () => {
    console.log(`[MOCK API] POST ${API_BASE_URL}/auth/signout`);
    await new Promise(resolve => setTimeout(resolve, 300));

    // --- MOCK IMPLEMENTATION ---
    localStorage.removeItem(SESSION_KEY);
  },

  /**
   * Retrieves the current user session.
   * In a real app, this would send a GET request with an auth token to `/api/auth/session`.
   */
  getSession: async (): Promise<UserProfile | null> => {
    console.log(`[MOCK API] GET ${API_BASE_URL}/auth/session`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    /*
    // Example of a real API call:
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    const userProfile = await response.json();
    return userProfile;
    */

    // --- MOCK IMPLEMENTATION ---
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;

    const users = getUsers();
    const userRecord = users[email];
    
    if (userRecord) {
        return userRecord.profile;
    } else {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
  },
  
  /**
   * Updates a user's profile.
   * In a real app, this would send a PATCH or PUT request to `/api/user/profile`.
   */
  updateProfile: async (email: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
      console.log(`[MOCK API] PATCH ${API_BASE_URL}/user/profile`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      /*
      // Example of a real API call:
      const token = localStorage.getItem(SESSION_KEY);
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }
      return await response.json();
      */

      // --- MOCK IMPLEMENTATION ---
      const users = getUsers();
      if (!users[email]) throw new Error("User not found");
      
      const updatedProfile = { ...users[email].profile, ...updates };
      users[email].profile = updatedProfile;
      saveUsers(users);
      
      return updatedProfile;
  }
};
