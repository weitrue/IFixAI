// API configuration
// In development, Vite proxy will forward /api requests to Go server (localhost:4000)
// In production, set VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build API endpoint
// Use relative URLs so Vite proxy works in development
export const api = (endpoint: string) => {
  // Remove leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  if (API_BASE_URL) {
    return `${API_BASE_URL}/${path}`;
  }
  // Use relative URL for Vite proxy
  return `/${path}`;
};

export const API_URL = API_BASE_URL || '/api';

