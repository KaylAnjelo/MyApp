import AsyncStorage from '@react-native-async-storage/async-storage'; 

// Centralized API service for all backend communication
const API_BASE_URL = 'http://10.0.2.2:3000/api';
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
      console.error('Failed to load token from storage:', e);
      return null;
    }
  }

  async saveToken(newToken) {
    try {
      this.token = newToken;
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
    } catch (e) {
      console.error('Failed to save token to storage:', e);
    }
  }

  async removeToken() {
    try {
      this.token = null;
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove token from storage:', e);
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
      const responseClone = originalResponse.clone();

      if (!originalResponse.ok) {
        let errorMessage = `HTTP error! Status: ${originalResponse.status}.`;
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const text = await responseClone.text(); 
          if (text && text.trim().startsWith('<')) {
            errorMessage += ' Received HTML/non-JSON response. Check backend logs for crash or authentication failure.';
          } else {
            errorMessage += ' Could not parse response for details.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await originalResponse.json();
      return data;

    } catch (error) {
      console.error('API request failed:', endpoint, error.message);
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

  if (responseData && responseData.token) {
    await this.saveToken(responseData.token);
    // <-- add these lines:
    if (responseData.user) {
      await AsyncStorage.setItem('@app_user', JSON.stringify(responseData.user));
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
    return this.request('/stores');
  }

  async getStore(storeId) {
    return this.request(`/stores/${storeId}`);
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
