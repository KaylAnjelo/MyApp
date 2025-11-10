import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// --- Constants ---
const PRIMARY_RED = '#8B0000'; // Dark Red
const MENU_ITEMS = [
  {id: '1', name: 'Bistek (Half Order)', price: '25.00'},
  {id: '2', name: 'Chicken Pork Adob...', price: '25.00'},
  {id: '3', name: 'Chicharong Bulaklak (H...', price: '25.00'},
  {id: '4', name: 'Binagoongan', price: '25.00'},
  {id: '5', name: 'Ginataang kalabasa...', price: '15.00'},
  {id: '6', name: 'Half Rice', price: '5.00'},
];

// --- Custom Component for each Menu Item Row ---
const MenuItemTile = ({itemName, price}) => (
  <>
    <View style={styles.menuItemRow}>
      {/* Item Name */}
      <Text style={styles.itemName} numberOfLines={1}>
        {itemName}
      </Text>
      {/* Price */}
      <Text style={styles.itemPrice}>₱ {price}</Text>
      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => console.log(`Added ${itemName}`)}>
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
    <View style={styles.divider} />
  </>
);

// --- Main Screen Component ---
const CreateOrderScreen = ({ navigation }) => {
  const cartItemCount = 4;
  const cartTotal = '265.00';

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Header (App Bar) --- */}
      <View style={styles.header}>
        <View style={{width: 24}} /> {/* Left spacer for centering */}
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={{width: 24}} /> {/* Right spacer for centering */}
      </View>

      {/* --- Body (Scrollable Menu List) --- */}
      <ScrollView style={styles.body}>
        {MENU_ITEMS.map(item => (
          <MenuItemTile key={item.id} itemName={item.name} price={item.price} />
        ))}
        {/* Add padding at the bottom to ensure the last item is not hidden by the cart bar */}
        <View style={{height: 10}} />
      </ScrollView>

      {/* --- Bottom Cart Summary Bar --- */}
      <View style={styles.bottomBar}>
        {/* Left Side: Cart Icon and View Cart Text */}
        <View style={styles.cartInfoContainer}>
          <View>
            {/* Cart Icon */}
            <MaterialIcons name="shopping-cart" size={28} color="#FFFFFF" />
            
            {/* Cart Count Badge */}
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          </View>
          <Text style={styles.viewCartText}>View Cart</Text>
        </View>

        {/* Right Side: Total Price */}
        <Text style={styles.totalPriceText}>₱ {cartTotal}</Text>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorHomePage')}>
          <MaterialIcons name="home" size={22} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesPage')}>
          <MaterialIcons name="bar-chart" size={22} color="#555" />
          <Text style={styles.navText}>Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="add-circle-outline" size={22} color="#7D0006" />
          <Text style={[styles.navText, { color: '#7D0006', fontWeight: 'bold' }]}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TransactionPage')}>
          <MaterialIcons name="receipt" size={22} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorProfilePage')}>
          <MaterialIcons name="person-outline" size={22} color="#555" />
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