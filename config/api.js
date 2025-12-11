// Centralized API configuration
// Replace `API_HOST` with your production backend URL before building release APKs

// Local testing server URL 'http://localhost:3000'
// Production server URL 'https://suki-app.up.railway.app'

export const API_HOST = 'http://localhost:3000'; 
export const API_BASE_URL = `${API_HOST}/api`;

// For health checks you may want the host without the /api suffix
export const API_HEALTH_URL = API_HOST;

// Note: Do NOT commit real secrets or production credentials. Keep this file
// editable locally or use a more secure config flow (environment variables,
// react-native-config, or CI injection) for production builds.                             