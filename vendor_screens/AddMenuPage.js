import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import apiService from '../services/apiService';

// --- Constants ---
const PRIMARY_RED = '#8B0000'; // Dark Red

// --- Custom Component for each Menu Item Row ---
const MenuItemTile = ({itemName, price, onAdd}) => (
  <>
    <View style={styles.menuItemRow}>
      {/* Item Name */}
      <Text style={styles.itemName} numberOfLines={1}>
        {itemName}
      </Text>
      {/* Price */}
      <Text style={styles.itemPrice}>₱ {price}</Text>
      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <Icon name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
    <View style={styles.divider} />
  </>
);

// --- Main Screen Component ---
const CreateOrderScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [cart, setCart] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [shortCode, setShortCode] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  // Cart modal and reward code state
  const [showCartModal, setShowCartModal] = useState(false);
  const [rewardCode, setRewardCode] = useState('');
  const [rewardCodeStatus, setRewardCodeStatus] = useState(null); // null | 'valid' | 'invalid' | 'checking'
  const [appliedReward, setAppliedReward] = useState(null);

  useEffect(() => {
    loadVendorProducts();
  }, []);

  const loadVendorProducts = async () => {
    try {
      // Get vendor's store_id from AsyncStorage
      const userStr = await AsyncStorage.getItem('@app_user');
      if (!userStr) {
        Alert.alert('Error', 'User data not found. Please login again.');
        navigation.replace('SignIn');
        return;
      }

      const user = JSON.parse(userStr);
      const vendorStoreId = user.store_id || user._raw?.store_id;
      const vendorUserId = user.user_id || user._raw?.user_id;

      if (!vendorStoreId) {
        Alert.alert('Error', 'No store assigned to your account. Please contact support.');
        setLoading(false);
        return;
      }

      setStoreId(vendorStoreId);
      setVendorId(vendorUserId);

      // Fetch products for this store
      const productsData = await apiService.getProductsByStore(vendorStoreId);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item.id !== productId);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Open cart modal instead of generating QR directly
  const generateQRCode = () => {
    // Always open the cart modal so vendor can enter a reward code even with empty cart
    setShowCartModal(true);
  };

  // Validate reward code
  const validateRewardCode = async () => {
    if (!rewardCode.trim()) return;
    setRewardCodeStatus('checking');
    try {
      // You may need to implement this endpoint in your backend
      const reward = await apiService.request('/rewards/validate-code', {
        method: 'POST',
        body: JSON.stringify({ code: rewardCode.trim(), store_id: storeId })
      });
      if (reward && reward.id) {
        setRewardCodeStatus('valid');
        setAppliedReward(reward);
      } else {
        setRewardCodeStatus('invalid');
        setAppliedReward(null);
      }
    } catch (e) {
      setRewardCodeStatus('invalid');
      setAppliedReward(null);
    }
  };

  // Finalize transaction after cart review and reward code
  const finalizeTransaction = async () => {
    if (!vendorId || !storeId) {
      Alert.alert('Error', 'Vendor or store information is missing. Please reload the page.');
      console.error('Missing vendorId or storeId:', { vendorId, storeId });
      return;
    }
    setGeneratingQR(true);
    try {
      const items = cart.map(item => ({
        product_id: item.id,
        product_name: item.name || item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.price)
      }));
      // Include reward code if user entered one (backend will validate it).
      // Previously we only sent the code when `appliedReward` was truthy (after client-side validation),
      // which could cause the server to never receive the code if validation endpoint failed.
      const payload = {
        vendor_id: vendorId,
        store_id: storeId,
        items,
        reward_code: rewardCode && rewardCode.trim() ? rewardCode.trim() : undefined
      };
      const response = await apiService.generateTransactionQR(payload);
      if (response && response.qr_string && response.short_code) {
        setQrData(response.qr_string);
        setShortCode(response.short_code);
        setShowQRModal(true);
        setShowCartModal(false);
      } else {
        Alert.alert('Error', 'Invalid response from server');
        console.error('Invalid response:', response);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', `Failed to generate QR code: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingQR(false);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrData(null);
    setShortCode(null);
    setCart([]); // Clear cart after QR is shown
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* Removed inline comment: was "Left spacer for centering" */}
          <View style={{width: 24}} /> 
          <Text style={styles.headerTitle}>Create Order</Text>
          {/* Removed inline comment: was "Right spacer for centering" */}
          <View style={{width: 24}} /> 
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_RED} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Header (App Bar) --- */}
      <View style={styles.header}>
        {/* Left spacer for centering - FIX: Removed inline comment that caused string error */}
        <View style={{width: 24}} /> 
        <Text style={styles.headerTitle}>Create Order</Text>
        {/* Right spacer for centering - FIX: Removed inline comment that caused string error */}
        <View style={{width: 24}} /> 
      </View>

      {/* --- Body (Scrollable Menu List) --- */}
      <ScrollView style={styles.body}>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="cube-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No products available</Text>
            <Text style={styles.emptySubtext}>Add products to your store menu</Text>
          </View>
        ) : (
          products.map(item => (
            <MenuItemTile 
              key={item.id} 
              itemName={item.name || item.product_name} 
              price={item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
              onAdd={() => addToCart(item)} 
            />
          ))
        )}
        {/* Add padding at the bottom to ensure the last item is not hidden by the cart bar */}
        <View style={{height: 10}} />
      </ScrollView>

      {/* --- Bottom Cart Summary Bar --- */}
      <TouchableOpacity 
        style={styles.bottomBar}
        onPress={generateQRCode}
        disabled={generatingQR}
      >
        {/* Left Side: Cart Icon and Cart Info */}
        <View style={styles.cartInfoContainer}>
          <View>
            {/* Cart Icon */}
            <Icon name="cart" size={28} color="#FFFFFF" />
            
            {/* Cart Count Badge */}
            {getCartItemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.viewCartText}>
            {generatingQR ? 'Generating...' : 'Generate QR Code'}
          </Text>
        </View>

        {/* Right Side: Total Price */}
        <Text style={styles.totalPriceText}>₱ {getCartTotal()}</Text>
      </TouchableOpacity>

      {/* --- Cart Review Modal --- */}
      <Modal
        visible={showCartModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20, width: '90%' }]}> 
            <Text style={styles.modalTitle}>Review Cart</Text>
            <ScrollView style={{ maxHeight: 250, width: '100%' }}>
              {cart.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ flex: 1 }}>{item.name || item.product_name} x{item.quantity}</Text>
                  <Text style={{ width: 60, textAlign: 'right' }}>₱{(item.price * item.quantity).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginLeft: 10 }}>
                    <Icon name="remove-circle-outline" size={22} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Total: ₱{getCartTotal()}</Text>
            {/* Reward Code Input */}
            <View style={{ marginTop: 20, width: '100%' }}>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>Reward Code (if any):</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: rewardCodeStatus === 'valid' ? '#4caf50' : rewardCodeStatus === 'invalid' ? '#d32f2f' : '#ccc',
                    borderRadius: 8,
                    padding: 8,
                    flex: 1,
                    marginRight: 10,
                  }}
                  placeholder="Enter reward code"
                  value={rewardCode}
                  onChangeText={text => {
                    setRewardCode(text);
                    setRewardCodeStatus(null);
                    setAppliedReward(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!generatingQR}
                />
                <TouchableOpacity onPress={validateRewardCode} disabled={!!generatingQR || !(rewardCode && rewardCode.trim().length > 0)} style={{ padding: 8 }}>
                  <Icon name="checkmark-circle-outline" size={24} color={rewardCodeStatus === 'valid' ? '#4caf50' : rewardCodeStatus === 'invalid' ? '#d32f2f' : '#888'} />
                </TouchableOpacity>
              </View>
              {rewardCodeStatus === 'valid' && appliedReward && (
                <Text style={{ color: '#4caf50', marginTop: 4 }}>Reward applied: {appliedReward.reward_name || appliedReward.name || appliedReward.title}</Text>
              )}
              {rewardCodeStatus === 'invalid' && (
                <Text style={{ color: '#d32f2f', marginTop: 4 }}>Invalid or already used code.</Text>
              )}
              {rewardCodeStatus === 'checking' && (
                <Text style={{ color: '#888', marginTop: 4 }}>Checking code...</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 30, width: '100%' }}>
              <TouchableOpacity
                style={[styles.closeButton, { flex: 1, backgroundColor: '#ccc', marginRight: 10 }]}
                onPress={() => setShowCartModal(false)}
                disabled={generatingQR}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeButton, { flex: 1, backgroundColor: '#FF6F61' }]}
                onPress={finalizeTransaction}
                disabled={
                  !!generatingQR ||
                  ((cart.length === 0) && !(rewardCode && rewardCode.trim().length > 0)) ||
                  (!!rewardCode && rewardCodeStatus !== 'valid' && rewardCodeStatus !== null)
                }
              >
                <Text style={styles.closeButtonText}>{generatingQR ? 'Processing...' : 'Finalize & Generate QR'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeQRModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transaction Code</Text>
            <Text style={styles.modalSubtext}>Customer can scan QR or enter code manually</Text>
            
            {/* Manual Entry Code */}
            {shortCode && (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Manual Entry Code:</Text>
                <Text style={styles.codeText}>{shortCode}</Text>
                <Text style={styles.codeExpiry}>Valid for 10 minutes</Text>
              </View>
            )}

            {/* QR Code */}
            {qrData && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrData}
                  size={200}
                  backgroundColor="white"
                />
              </View>
            )}

            <Text style={styles.modalInfo}>Total: ₱{getCartTotal()}</Text>
            <Text style={styles.modalInfo}>Items: {getCartItemCount()}</Text>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeQRModal}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorHomePage')}>
          <Icon name="home" size={22} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesPage')}>
          <Icon name="stats-chart-outline" size={22} color="#555" />
          <Text style={styles.navText}>Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="add-circle-outline" size={22} color="#8B0000" />
          <Text style={[styles.navText, { color: '#8B0000', fontWeight: 'bold' }]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TransactionPage')}>
          <Icon name="receipt-outline" size={22} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorProfilePage')}>
          <Icon name="person-outline" size={22} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 65, // Add padding to account for bottom navigation
  },
  // Header Styles
  header: {
    backgroundColor: PRIMARY_RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Menu List Styles
  body: {
    flex: 1,
    paddingHorizontal: 15,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 15,
  },
  addButton: {
    width: 30,
    height: 30,
    backgroundColor: PRIMARY_RED,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },

  // Bottom Bar Styles
  bottomBar: {
    backgroundColor: PRIMARY_RED,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  cartInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 18,
    minHeight: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: PRIMARY_RED,
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewCartText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  totalPriceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  // QR Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#FF6F61',
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6F61',
    letterSpacing: 4,
    marginVertical: 5,
  },
  codeExpiry: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalInfo: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginVertical: 4,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 65,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  // Bottom Navigation Bar Styles
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 65,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
    color: '#555',
  },
});

export default CreateOrderScreen;