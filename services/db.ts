
import { UserProfile } from '../types';

const USERS_KEY = 'nutrican_users';
const SESSION_KEY = 'nutrican_session';

interface UserRecord {
  profile: UserProfile;
  password: string; // Note: In a real production app, never store passwords in plain text.
}

// Helper to get all users from storage
const getUsers = (): Record<string, UserRecord> => {
  try {
    const usersJSON = localStorage.getItem(USERS_KEY);
    return usersJSON ? JSON.parse(usersJSON) : {};
  } catch (e) {
    console.error("Error reading users from storage", e);
    return {};
  }
};

// Helper to save users to storage
const saveUsers = (users: Record<string, UserRecord>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const db = {
  signUp: async (email: string, password: string, profile: UserProfile): Promise<UserProfile> => {
    // Simulate network delay for a realistic feel
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const users = getUsers();
    if (users[email]) {
      throw new Error('User already exists with this email.');
    }

    users[email] = {
      profile,
      password
    };
    saveUsers(users);
    
    // Auto login after sign up
    localStorage.setItem(SESSION_KEY, email);
    return profile;
  },

  signIn: async (email: string, password: string): Promise<UserProfile> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = getUsers();
    const user = users[email];

    if (!user) {
      throw new Error('User not found. Please sign up first.');
    }

    if (user.password !== password) {
      throw new Error('Invalid password.');
    }

    localStorage.setItem(SESSION_KEY, email);
    return user.profile;
  },

  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: async (): Promise<UserProfile | null> => {
     // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;

    const users = getUsers();
    const userRecord = users[email];
    
    if (userRecord) {
        return userRecord.profile;
    } else {
        // Session exists but user doesn't (data corruption or deletion), clear session
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
  },
  
  // Method to update user profile in the "database"
  updateProfile: async (email: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const users = getUsers();
      if (!users[email]) throw new Error("User not found");
      
      const updatedProfile = { ...users[email].profile, ...updates };
      users[email].profile = updatedProfile;
      saveUsers(users);
      
      return updatedProfile;
  }
};
