import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Platform } from 'react-native';

// Centralized API service for all backend communication
// Use emulator-friendly host: Android emulator -> 10.0.2.2, iOS simulator -> localhost
const API_BASE_URL = Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api'
      : 'http://localhost:3000/api';
const TOKEN_KEY = '@app_auth_token'; 

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null; 
  }

  // --- 🔑 TOKEN MANAGEMENT HELPERS ---

  async loadToken() {
    if (this.token) return this.token; 
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      this.token = storedToken;
      return storedToken;
    } catch (e) {
                  // Lower-severity log: token load failures are non-fatal and can be handled by caller
                  console.warn('Failed to load token from storage:', e);
      return null;
    }
  }

  async saveToken(newToken) {
    try {
      this.token = newToken;
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
    } catch (e) {
                  // Lower-severity log: surface as a warning so it doesn't duplicate with request/server errors
                  console.warn('Failed to save token to storage:', e);
    }
  }

  async removeToken() {
    try {
      this.token = null;
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
                  console.warn('Failed to remove token from storage:', e);
    }
  }

  // --- CORE REQUEST METHOD (FIXED) ---
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const currentToken = await this.loadToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}), 
        ...options.headers,
      },
      ...options,
    };

    try {
      const originalResponse = await fetch(url, config); 
      
      // Use a clone to safely read the body, but read it as text ONCE.
      const responseClone = originalResponse.clone();
      const responseText = await responseClone.text(); // Read the body stream once

      if (!originalResponse.ok) {
        let errorMessage = `HTTP error! Status: ${originalResponse.status}.`;
        
        try {
          // Now parse the text we already read
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Handle non-JSON response using the text we already have
          if (responseText && responseText.trim().startsWith('<')) {
            errorMessage += ' Received HTML/non-JSON response. Check backend logs for crash or authentication failure.';
          } else if (responseText) {
                // Show the first part of the response text if available
                errorMessage = `${errorMessage} Server message: ${responseText.substring(0, 100)}...`
            } else {
              errorMessage += ' Could not parse response for details.';
          }
        }
        throw new Error(errorMessage);
      }

      // If successful, read the JSON from the ORIGINAL response (which is still unread)
      const data = await originalResponse.json();
      return data;

    } catch (error) {
                  // Avoid noisy duplicate error logs here (server or higher-level UI should log if needed).
                  // Attach endpoint metadata for callers and rethrow so UI can decide what to display.
                  try {
                        if (error && typeof error === 'object') {
                              error.endpoint = endpoint;
                        }
                  } catch (attachErr) {
                        // ignore
                  }
                  if (typeof console.debug === 'function') {
                        console.debug('API request debug:', endpoint, error && error.message ? error.message : error);
                  }
                  throw error;
    }
  }

  // --- AUTHENTICATION METHODS ---

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(username, password) { 
  const responseData = await this.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
      // Persist token if provided, and always persist the returned user object when present.
      if (responseData) {
            if (responseData.token) {
                  await this.saveToken(responseData.token);
            }
                        if (responseData.user) {
                              try {
                                    // Normalize common field names into a consistent shape so client/server agree
                                    const raw = responseData.user;
                                    const userId = raw.user_id || raw.userId || raw.id || raw.uid || raw.id?.toString();
                                                      // Prefer explicit first_name + last_name from backend over username or other name fields
                                                      const name = (
                                                            (raw.first_name || raw.last_name)
                                                                  ? `${(raw.first_name || '').trim()} ${(raw.last_name || '').trim()}`.trim()
                                                                  : (raw.name || raw.full_name || raw.username)
                                                      ) || null;
                                    const email = raw.email || raw.user_email || raw.userEmail || null;
                                    const role = raw.role || raw.user_type || 'customer';

                                    const normalized = {
                                          user_id: userId,
                                          name,
                                          email,
                                          role,
                                          // keep original payload for debugging
                                          _raw: raw,
                                    };

                                    await AsyncStorage.setItem('@app_user', JSON.stringify(normalized));
                              } catch (e) {
                                    console.warn('Failed to persist user after login:', e);
                              }
                        }
      }
  
  return responseData;
}
  
  async logout() {
    await this.removeToken();
  }

  // --- USER PROFILE, STORE, PRODUCT, TRANSACTION, HEALTH CHECK METHODS ---

  async getCurrentUserProfile() {
    return this.request('/user/profile'); // ✅ Use token to identify user
  }

  async getUserProfile(userId) {
    return this.request(`/user/profile/${userId}`);
  }

  async updateUserProfile(userId, updates) {
    return this.request(`/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getStores() {
            const data = await this.request('/stores');
            // Normalize common DB field names into the shape the client expects
            if (Array.isArray(data)) {
                              return data.map(s => ({
                                    ...s,
                                    // name normalization (store_name in DB -> name expected by UI)
                                    name: s.name || s.store_name || s.storeName || s.store || null,
                                    // address normalization (location -> address)
                                    address: s.address || s.location || s.city || null,
                                    // image normalization (support various column names)
                                    image_url: s.image_url || s.logoUrl || s.logo_url || s.image || null,
                                    logoUrl: s.logoUrl || s.image_url || s.logo_url || s.image || null,
                                    // rating fallback
                                    rating: s.rating ?? s.store_rating ?? s.avg_rating ?? 5.0,
                              }));
            }
            return data;
  }

  async getStore(storeId) {
            const data = await this.request(`/stores/${storeId}`);
            if (data && typeof data === 'object') {
                              return {
                                    ...data,
                                    name: data.name || data.store_name || data.storeName || data.store || null,
                                    address: data.address || data.location || data.city || null,
                                    image_url: data.image_url || data.logoUrl || data.logo_url || data.image || null,
                                    logoUrl: data.logoUrl || data.image_url || data.logo_url || data.image || null,
                                    rating: data.rating ?? data.store_rating ?? data.avg_rating ?? 5.0,
                              };
            }
            return data;
  }

                  async getProducts() {
                        const data = await this.request('/products');
                        if (Array.isArray(data)) {
                              return data.map(p => ({
                                    ...p,
                                    id: p.id || p.product_id || p.uid || null,
                                    name: p.name || p.title || p.product_name || null,
                                    image_url: p.image_url || p.image || p.imageUrl || null,
                                    price: p.price ?? p.amount ?? null,
                              }));
                        }
                        return data;
                  }

                  async getProductsByStore(storeId) {
                        const data = await this.request(`/products/${storeId}`);
                        if (Array.isArray(data)) {
                              return data.map(p => ({
                                    ...p,
                                    id: p.id || p.product_id || p.uid || null,
                                    name: p.name || p.title || p.product_name || null,
                                    image_url: p.image_url || p.image || p.imageUrl || null,
                                    price: p.price ?? p.amount ?? null,
                              }));
                        }
                        return data;
                  }

  async getProducts() {
    return this.request('/products');
  }

  async getProductsByStore(storeId) {
    return this.request(`/products/${storeId}`);
  }

  async getUserTransactions(userId) {
    return this.request(`/transactions/${userId}`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;