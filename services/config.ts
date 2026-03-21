/**
 * Central config for the NutriCan frontend.
 */
// Appwrite Configuration
export const APPWRITE_ENDPOINT = (import.meta as any).env?.VITE_APPWRITE_ENDPOINT ?? 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID ?? '69be824c0009f8aaccd5';

export const APPWRITE_DATABASE_ID = (import.meta as any).env?.VITE_APPWRITE_DATABASE_ID ?? 'nutrican_db';
export const APPWRITE_PROFILES_COLLECTION = (import.meta as any).env?.VITE_APPWRITE_PROFILES_COLLECTION ?? 'profiles';
export const APPWRITE_JOURNAL_COLLECTION = (import.meta as any).env?.VITE_APPWRITE_JOURNAL_COLLECTION ?? 'journal';
export const APPWRITE_MEALS_COLLECTION = (import.meta as any).env?.VITE_APPWRITE_MEALS_COLLECTION ?? 'meals';
export const APPWRITE_CHAT_COLLECTION = (import.meta as any).env?.VITE_APPWRITE_CHAT_COLLECTION ?? 'chat';

export const APPWRITE_DOCS_BUCKET = (import.meta as any).env?.VITE_APPWRITE_DOCS_BUCKET ?? 'medical_docs';
export const APPWRITE_BOOKS_BUCKET = (import.meta as any).env?.VITE_APPWRITE_BOOKS_BUCKET ?? 'books';

// Groq AI Configuration
export const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY ?? '';

// Backend configuration (Kept for fallback/other tools if needed)
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000';
