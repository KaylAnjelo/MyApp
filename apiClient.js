import { API_BASE_URL } from './config/api';


class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(username, password) {   // ✅ changed email → username
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // User profile methods
  async getUserProfile(userId) {
    return this.request(`/user/profile/${userId}`);
  }

  async updateUserProfile(userId, updates) {
    return this.request(`/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Store methods
  async getStores() {
    return this.request('/stores');
  }

  async getStore(storeId) {
    return this.request(`/stores/${storeId}`);
  }

  // Transaction methods
  async getUserTransactions(userId) {
    return this.request(`/transactions/${userId}`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  // Rewards methods
  async getUserRewards(userId) {
    return this.request(`/rewards/${userId}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export individual methods for convenience
export const {
  register,
  login,
  getUserProfile,
  updateUserProfile,
  getStores,
  getStore,
  getUserTransactions,
  createTransaction,
  getUserRewards,
  healthCheck,
} = apiClient;
