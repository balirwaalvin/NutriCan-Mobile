/**
 * Central config for the NutriCan frontend.
 *
 * During development the Vite dev server runs on :5173 and the Express
 * backend runs on :4000.  In production, set VITE_API_URL in your hosting
 * environment to point to wherever the backend is deployed.
 */
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000';
