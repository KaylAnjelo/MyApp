// Centralized API configuration
// Replace `API_HOST` with your production backend URL before building release APKs
// Example: export const API_HOST = 'https://api.myapp.com';

export const API_HOST = 'https://suki-app.up.railway.app';
export const API_BASE_URL = `${API_HOST}/api`;

// For health checks you may want the host without the /api suffix
export const API_HEALTH_URL = API_HOST; // e.g. 'https://suki-app.up.railway.app'

// Note: Do NOT commit real secrets or production credentials. Keep this file
// editable locally or use a more secure config flow (environment variables,
// react-native-config, or CI injection) for production builds.
