import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

export default function VendorProfilePage({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // 🧩 Display helpers
  const displayName = profile?.full_name ||
    profile?.name ||
    (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
    profile?.username ||
    'Not set';

  const displayEmail = profile?.user_email ||
    profile?.email ||
    profile?.userEmail ||
    profile?.username ||
    'Not set';

  const displayStoreName = store?.store_name ||
    store?.name ||
    'Store Name';

  const displayOwnerName = store?.owner_name ||
    (store?.first_name && store?.last_name ? `${store.first_name} ${store.last_name}` : null) ||
    store?.username ||
    'Not set';

  const displayOwnerContact = store?.owner_contact ||
    store?.contact_number ||
    'Not set';

  const displayProfilePic = profile?.avatar_url ||
    profile?.profile_picture ||
    profile?.avatar ||
    'https://via.placeholder.com/120';

  // ✅ 1. Fetch profile first
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setProfileError(null);

        // Check local storage
        const storedUser = await AsyncStorage.getItem('@app_user');
        let currentUserId = null;

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setProfile(userData);
          currentUserId = userData.user_id || userData.id || userData.userId;
          console.log('📦 Stored user:', userData);
        }

        // Fetch fresh profile from API
        if (currentUserId) {
          try {
            const profileData = await apiService.getUserProfile(currentUserId);
            if (profileData) {
              console.log('✅ Fresh profile loaded:', profileData);
              setProfile(profileData);
              await AsyncStorage.setItem('@app_user', JSON.stringify(profileData));
            }
          } catch (err) {
            console.warn('⚠️ Failed to fetch fresh profile:', err.message);
          }
        } else {
          console.warn('⚠️ No user ID found to fetch profile');
        }
      } catch (error) {
        console.error('❌ Error fetching profile data:', error);
        setProfileError(error.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // ✅ 2. Fetch store once profile is ready
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!profile) return;

      try {
        const storesData = await apiService.getStores();
        console.log('🛒 Stores fetched:', storesData?.length);
        console.log('🧩 Stores Data Sample:', storesData);


        if (storesData && storesData.length > 0) {
          const userId = profile.user_id || profile.id;
          console.log('👤 Current user ID:', userId);

          // Find store where the vendor is part of
          const userStore = storesData.find(
            store => store.store_id === profile.store_id
          );

          if (userStore) {
            console.log('✅ Store found:', userStore);

            // Fetch owner details if missing
            if (!userStore.owner_name || !userStore.owner_contact) {
              try {
                const ownerData = await apiService.getUserProfile(userStore.owner_id);
                if (ownerData) {
                  userStore.owner_name =
                    ownerData.first_name && ownerData.last_name
                      ? `${ownerData.first_name} ${ownerData.last_name}`
                      : ownerData.username;
                  userStore.owner_contact = ownerData.contact_number;
                }
              } catch (ownerErr) {
                console.warn('⚠️ Failed to fetch owner details:', ownerErr.message);
              }
            }

            setStore(userStore);
          } else {
            console.log('⚠️ No store found for user:', userId);
          }
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch store data:', err.message);
      }
    };

    fetchStoreData();
  }, [profile]);

  // 🧹 Logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              await AsyncStorage.removeItem('@app_user');
              navigation.replace('SignIn');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  // 🛠 Placeholder actions
  const handleEditProfile = () => Alert.alert('Edit Profile', 'Profile editing will be implemented');
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword', { email: displayEmail });
  };

  // 🕑 Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D22B2B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ❌ Error state
  if (profileError) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{profileError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setProfileError(null);
              setLoading(true);
              setProfile(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Main UI
  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* My Store Section */}
        <Text style={styles.myStoreTitle}>My Store</Text>

        {store ? (
          <View style={styles.storeInfoContainer}>
            <View style={styles.storeInfoCard}>
              <Text style={styles.storeInfoLabel}>Store Name</Text>
              <Text style={styles.storeInfoValue}>{displayStoreName}</Text>
            </View>
            <View style={styles.storeInfoCard}>
              <Text style={styles.storeInfoLabel}>Owner</Text>
              <Text style={styles.storeInfoValue}>{displayOwnerName}</Text>
            </View>
            <View style={styles.storeInfoCard}>
              <Text style={styles.storeInfoLabel}>Contact</Text>
              <Text style={styles.storeInfoValue}>{displayOwnerContact}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#888', marginBottom: 16 }}>
            You are not yet part of a store.
          </Text>
        )}

        {/* Profile Settings */}
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        <View style={styles.profilePicContainer}>
          <Image source={{ uri: displayProfilePic }} style={styles.profilePic} />
          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
            <Icon name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoLabel}>Name</Text>
          <View style={styles.infoValueBox}>
            <Text style={styles.infoValue}>{displayName}</Text>
          </View>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoLabel}>Email</Text>
          <View style={styles.infoValueBox}>
            <Text style={styles.infoValue}>{displayEmail}</Text>
          </View>
        </View>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.securityRow} onPress={handleChangePassword}>
          <Text style={styles.securityText}>Change Password</Text>
          <Icon name="chevron-forward" size={20} color="#D22B2B" />
        </TouchableOpacity>

        {/* Logout */}
        <Text style={styles.sectionTitle}>Logout</Text>
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color="#D22B2B" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>

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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateOrder')}>
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

// 🧱 Styles (unchanged)
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  myStoreTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 16, marginTop: 8 },
  storeInfoContainer: { flex: 1, gap: 12 },
  storeInfoCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  storeInfoLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 4 },
  storeInfoValue: { fontSize: 15, color: '#666', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 12, color: '#D22B2B' },
  profilePicContainer: { alignItems: 'center', marginBottom: 18, position: 'relative' },
  profilePic: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
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
  infoField: { marginBottom: 14 },
  infoLabel: { fontSize: 13, color: '#888', marginBottom: 4, fontWeight: 'bold' },
  infoValueBox: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  infoValue: { fontSize: 15, color: '#222' },
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
  securityText: { fontSize: 15, color: '#222', fontWeight: 'bold' },
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
  logoutText: { fontSize: 15, color: '#222', fontWeight: 'bold' },
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
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 16, color: '#D22B2B', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#D22B2B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
