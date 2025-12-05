/**
 * API Configuration
 * Centralizes API base URL configuration from environment variables
 */

// Vite exposes env variables via import.meta.env
// Variables must be prefixed with VITE_ to be exposed to the client
// In tests, import.meta.env might not be available, so we provide a fallback
//
// For monorepo deployment (same domain):
// - Production: Use empty string (relative URLs like /api/users)
// - Development: Use localhost:8000 (backend runs separately)
export const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production' ? '' : 'http://localhost:8000');
