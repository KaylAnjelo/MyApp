import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ✅ Configure API base URL
const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'  // Android emulator uses 10.0.2.2 to access host's localhost
    : 'http://localhost:3000/api';


const TOKEN_KEY = '@app_auth_token';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // 🔑 TOKEN MANAGEMENT
  async loadToken() {
    if (this.token) return this.token;
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      this.token = storedToken;
      return storedToken;
    } catch (e) {
      console.warn('Failed to load token from storage:', e);
      return null;
    }
  }

  async saveToken(newToken) {
    try {
      this.token = newToken;
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
    } catch (e) {
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

  // 🧩 CORE REQUEST HANDLER
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const currentToken = await this.loadToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const originalResponse = await fetch(url, config);
      const responseClone = originalResponse.clone();
      const responseText = await responseClone.text();

      if (!originalResponse.ok) {
        let errorMessage = `HTTP error! Status: ${originalResponse.status}.`;

        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          if (responseText && responseText.trim().startsWith('<')) {
            errorMessage +=
              ' Received HTML response. Check backend logs for details.';
          } else if (responseText) {
            errorMessage += ` Server message: ${responseText.substring(
              0,
              100
            )}...`;
          } else {
            errorMessage += ' Could not parse error details.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await originalResponse.json();
      return data;
    } catch (error) {
      if (error && typeof error === 'object') {
        error.endpoint = endpoint;
      }
      console.debug(
        'API request debug:',
        endpoint,
        error && error.message ? error.message : error
      );
      throw error;
    }
  }

  // 👥 AUTHENTICATION
  async sendOTP(email) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTPAndRegister(userData) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async registerVendorWithStoreCode(userData) {
    return this.request('/auth/vendor-register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyOTPAndRegisterVendor(userData) {
    return this.request('/auth/vendor-verify-otp', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(username, password) {
    const responseData = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (responseData) {
      if (responseData.token) {
        await this.saveToken(responseData.token);
      }

      if (responseData.user) {
        try {
          const raw = responseData.user;
          const userId =
            raw.user_id || raw.userId || raw.id || raw.uid || raw.id?.toString();
          const name =
            (raw.first_name || raw.last_name
              ? `${(raw.first_name || '').trim()} ${(raw.last_name || '').trim()}`
              : raw.name || raw.full_name || raw.username) || null;
          const email = raw.email || raw.user_email || raw.userEmail || null;
          const role = raw.role || raw.user_type || 'customer';
          const storeId =
            raw.store_id || raw.storeId || raw.storeID || raw.store || null;

          const normalized = {
            user_id: userId,
            name,
            email,
            role,
            store_id: storeId,
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

  // 🔐 PASSWORD RESET
  async sendPasswordResetOTP(email) {
    return this.request('/auth/send-password-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyPasswordResetOTP(email, otp) {
    return this.request('/auth/verify-password-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async changePassword(email, resetToken, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetToken, newPassword }),
    });
  }

  // 👤 USER PROFILE
  async getUserProfile(userId) {
    return this.request(`/user/profile/${userId}`);
  }

  async updateUserProfile(userId, updates) {
    return this.request(`/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async uploadProfileImage(userId, imageBase64, fileName) {
    return this.request('/user/upload-profile-image', {
      method: 'POST',
      body: JSON.stringify({ userId, imageBase64, fileName }),
    });
  }

  // 🏪 STORES
  async getStores() {
    const data = await this.request('/stores');
    if (Array.isArray(data)) {
      return data.map((s) => ({
        ...s,
        name: s.name || s.store_name || s.storeName || s.store || null,
        address: s.address || s.location || s.city || null,
        image_url: s.image_url || s.logoUrl || s.logo_url || s.image || null,
        logoUrl: s.logoUrl || s.image_url || s.logo_url || s.image || null,
        rating: s.rating ?? s.store_rating ?? s.avg_rating ?? 5.0,
      }));
    }
    return data;
  }

  async getStoreBy(storeId) {
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

  // 🛍️ PRODUCTS
  async getProducts() {
    const response = await this.request('/products');
    const data = response.products || response;
    if (Array.isArray(data)) {
      return data.map((p) => ({
        ...p,
        id: p.id || p.product_id || p.uid || null,
        name: p.name || p.title || p.product_name || null,
        image_url: p.image_url || p.image || p.imageUrl || p.product_image || null,
        price: p.price ?? p.amount ?? null,
        product_type: p.product_type || p.type || null,
      }));
    }
    return data;
  }

  async getProductsByStore(storeId) {
    const response = await this.request(`/products/store/${storeId}`);
    const data = response.products || response;
    if (Array.isArray(data)) {
      return data.map((p) => ({
        ...p,
        id: p.id || p.product_id || p.uid || null,
        name: p.name || p.title || p.product_name || null,
        image_url: p.image_url || p.image || p.imageUrl || p.product_image || null,
        price: p.price ?? p.amount ?? null,
        product_type: p.product_type || p.type || null,
      }));
    }
    return data;
  }

  // 📊 DASHBOARD ANALYTICS
  async getStoreSalesSummary(storeId, month, year) {
    if (!storeId) throw new Error('Missing storeId');
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month);
    if (year !== undefined) params.append('year', year);
    const url = `/stores/${storeId}/sales-summary${params.toString() ? '?' + params.toString() : ''}`;
    const data = await this.request(url);
    console.log('API Response salesByType:', data.salesByType); // Debug log
    return {
      todayRevenue: parseFloat(data.todayRevenue || data.total_revenue || 0),
      todayOrders: parseInt(data.todayOrders || data.total_orders || 0),
      monthlySales: data.monthlySales || data.dailySales || data.sales_trend || [],
      salesByType: data.salesByType || {}, // Add salesByType field
      daysInMonth: data.daysInMonth || 30,
    };
  }

  async getTopSellingProducts(storeId) {
    if (!storeId) throw new Error('Missing storeId');
    const data = await this.request(`/stores/${storeId}/top-products`);
    if (Array.isArray(data)) {
      return data.map((p) => ({
        id: p.id || p.product_id || p.uid || null,
        name: p.name || p.product_name || p.title || 'Unnamed Product',
        image_url: p.image_url || p.image || p.imageUrl || 'https://via.placeholder.com/150',
        total_sold: p.total_sold || p.quantity_sold || 0,
        price: p.price ?? p.amount ?? 0,
      }));
    }
    return [];
  }

  async getSalesAnalytics(storeId, month, year) {
    if (!storeId) throw new Error('Missing storeId');
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month);
    if (year !== undefined) params.append('year', year);
    const url = `/stores/${storeId}/sales-analytics${params.toString() ? '?' + params.toString() : ''}`;
    return this.request(url);
  }

  // 💳 TRANSACTIONS
  async getUserTransactions(userId, role) {
    const url = role ? `/transactions/user/${userId}?role=${role}` : `/transactions/user/${userId}`;
    return this.request(url);
  }

  async generateTransactionQR(transactionData) {
    console.log('API: Generating transaction QR with data:', transactionData);
    try {
      const response = await this.request('/transactions/generate-qr', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      console.log('API: QR generation response:', response);
      return response;
    } catch (error) {
      console.error('API: QR generation error:', error);
      throw error;
    }
  }

  async processScannedQR(customerId, qrData) {
    return this.request('/transactions/process-qr', {
      method: 'POST',
      body: JSON.stringify({
        qr_data: qrData,
        customer_id: customerId
      }),
    });
  }

  async processManualCode(customerId, shortCode) {
    return this.request('/transactions/process-code', {
      method: 'POST',
      body: JSON.stringify({
        short_code: shortCode,
        customer_id: customerId
      }),
    });
  }

  // 💰 POINTS
  async getUserPointsByStore(userId) {
    return this.request(`/user/${userId}/points-by-store`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  // 🧠 HEALTH CHECK
  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;
