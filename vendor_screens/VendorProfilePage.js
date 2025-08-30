import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const VendorProfilePage = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.scrollContent}>
        {/* My Store Section */}
        <View style={styles.myStoreSection}>
          <Image
            source={{ uri: 'https://via.placeholder.com/70' }}
            style={styles.storeLogo}
          />
          <View style={styles.ownerInfo}>
            <Text style={styles.roleLabel}>Owner</Text>
            <Text style={styles.ownerName}>Kyle Almario</Text>
          </View>
        </View>

        {/* Profile Settings Section */}
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        <View style={styles.profilePicContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120' }}
            style={styles.profilePic}
          />
          <TouchableOpacity style={styles.editBtn}>
            <Icon name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoLabel}>Name</Text>
          <View style={styles.infoValueBox}>
            <Text style={styles.infoValue}>Jecka Acupido</Text>
          </View>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoLabel}>Email</Text>
          <View style={styles.infoValueBox}>
            <Text style={styles.infoValue}>acupidojecka@gmail.com</Text>
          </View>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.securityRow} onPress={() => {/* navigation to change password */}}>
          <Text style={styles.securityText}>Change Password</Text>
          <Icon name="chevron-forward" size={20} color="#D22B2B" />
        </TouchableOpacity>

        {/* Logout Section */}
        <Text style={styles.sectionTitle}>Logout</Text>
        <TouchableOpacity style={styles.logoutRow} onPress={() => {/* handle logout */}}>
          <Icon name="log-out-outline" size={20} color="#D22B2B" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 80 }} />
      </View>

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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateOrderPage')}>
          <Icon name="add-circle-outline" size={22} color="#555" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TransactionPage')}>
          <Icon name="receipt-outline" size={22} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorProfilePage')}>
          <Icon name="person-outline" size={22} color="#D22B2B" />
          <Text style={[styles.navText, { color: '#D22B2B', fontWeight: 'bold' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    backgroundColor: '#D22B2B',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  myStoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  storeLogo: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 16,
  },
  ownerInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  roleLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#D22B2B',
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
  },
  editBtn: {
    position: 'absolute',
    right: 30,
    bottom: 0,
    backgroundColor: '#D22B2B',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoField: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  infoValueBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  infoValue: {
    fontSize: 15,
    color: '#222',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  securityText: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    marginBottom: 18,
  },
  logoutText: {
    fontSize: 15,
    color: '#D22B2B',
    fontWeight: 'bold',
  },
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
  },
});

export default VendorProfilePage;
