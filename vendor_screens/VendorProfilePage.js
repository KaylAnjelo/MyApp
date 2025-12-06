import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { ThemedAlert, showThemedAlert } from '../components/ThemedAlert';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function VendorProfilePage({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });

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

  // Function to get initials from first and last name
  const getUserInitials = () => {
    const firstName = profile?.first_name?.trim() || '';
    const lastName = profile?.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else {
      // Fallback to username or store name
      const username = profile?.username || profile?.name || displayStoreName || 'V';
      if (username.length >= 2) {
        return username.substring(0, 2).toUpperCase();
      }
      return username.charAt(0).toUpperCase();
    }
  };

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
  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  // 🛠 Placeholder actions
  const handleSelectImage = async () => {
    if (uploading) return; // Prevent multiple taps during upload
    
    const hasImage = profile?.profile_image && !profile.profile_image.includes('placeholder');
    
    showThemedAlert(
      setAlert,
      'Profile Photo',
      hasImage ? 'Choose how you\'d like to update your profile picture' : 'Add a profile picture to personalize your account',
      hasImage ? [
        {
          text: 'Change Photo',
          onPress: () => selectImageFromLibrary()
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => removeProfileImage()
        }
      ] : [
        {
          text: 'Choose Photo',
          onPress: () => selectImageFromLibrary()
        }
      ]
    );
  };

  const selectImageFromLibrary = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.5, // Reduced quality to decrease file size
      maxWidth: 500, // Smaller dimensions
      maxHeight: 500,
      includeBase64: true,
    };

    try {
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showThemedAlert(setAlert, 'Selection Error', result.errorMessage || 'Unable to select image. Please try again.');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.base64) {
          showThemedAlert(setAlert, 'Image Error', 'We couldn\'t read the selected image. Please try choosing a different photo.');
          return;
        }
        await handleUploadImage(asset);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      showThemedAlert(setAlert, 'Selection Error', 'Unable to access your photo library. Please try again.');
    }
  };

  const removeProfileImage = async () => {
    try {
      setUploading(true);
      
      const userId = profile?.user_id || profile?.userId;
      console.log('🔍 Remove image - userId:', userId);
      console.log('🔍 Remove image - profile:', profile);
      
      if (!userId) {
        showThemedAlert(setAlert, 'Error', 'User information not found. Please sign in again.');
        return;
      }

      // Remove image from server
      console.log('🗑️ Calling removeProfileImage API...');
      await apiService.removeProfileImage(userId);
      
      // Update local profile state to remove image
      setProfile(prev => ({ ...prev, profile_image: null }));
      
      // Update AsyncStorage
      const stored = await AsyncStorage.getItem('@app_user');
      if (stored) {
        const userData = JSON.parse(stored);
        userData.profile_image = null;
        await AsyncStorage.setItem('@app_user', JSON.stringify(userData));
      }
      
      showThemedAlert(setAlert, 'Photo Removed', 'Your profile photo has been removed successfully!');
    } catch (error) {
      console.error('Remove image error:', error);
      showThemedAlert(setAlert, 'Error', 'We couldn\'t remove your photo right now. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImage = async (asset) => {
    try {
      setUploading(true);

      const userId = profile?.user_id || profile?.userId;
      if (!userId) {
        showThemedAlert(setAlert, 'Error', 'User information not found. Please sign in again.');
        return;
      }

      const mime = asset.type || 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
      const imageBase64 = `data:${mime};base64,${asset.base64}`;
      const baseName = asset.fileName ? asset.fileName.replace(/\.[^.]+$/, '') : `profile_${Date.now()}`;
      const fileName = `${baseName}.${ext}`;

      const response = await apiService.uploadProfileImage(userId, imageBase64, fileName);

      if (response.imageUrl) {
        // Update local profile state
        const bust = `${response.imageUrl}${response.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setProfile(prev => ({ ...prev, profile_image: bust }));
        
        // Update AsyncStorage
        const stored = await AsyncStorage.getItem('@app_user');
        if (stored) {
          const userData = JSON.parse(stored);
          userData.profile_image = bust;
          await AsyncStorage.setItem('@app_user', JSON.stringify(userData));
        }

        showThemedAlert(setAlert, 'Success', 'Your profile photo has been updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showThemedAlert(setAlert, 'Upload Failed', 'We couldn\'t upload your photo right now. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = () => showThemedAlert(setAlert, 'Change Password', 'Password change will be implemented');

  // 📝 Name editing functions
  const handleEditName = () => {
    setTempFirstName(profile?.first_name || '');
    setTempLastName(profile?.last_name || '');
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempFirstName('');
    setTempLastName('');
  };

  const handleSaveName = async () => {
    if (!tempFirstName.trim() || !tempLastName.trim()) {
      showThemedAlert(setAlert, 'Error', 'Both first name and last name are required');
      return;
    }

    setUpdatingName(true);
    try {
      const response = await apiService.updateProfile({
        first_name: tempFirstName.trim(),
        last_name: tempLastName.trim()
      });

      if (response.success || response.user || response.message) {
        const updatedProfile = {
          ...profile,
          first_name: tempFirstName.trim(),
          last_name: tempLastName.trim()
        };
        
        setProfile(updatedProfile);
        setIsEditingName(false);
        
        // Update AsyncStorage to keep local data in sync
        await AsyncStorage.setItem('@app_user', JSON.stringify(updatedProfile));
        
        showThemedAlert(setAlert, 'Success', 'Name updated successfully');
      } else {
        showThemedAlert(setAlert, 'Error', response.message || 'Failed to update name');
      }
    } catch (error) {
      console.error('Update name error:', error);
      showThemedAlert(setAlert, 'Error', 'Failed to update name. Please try again.');
    } finally {
      setUpdatingName(false);
    }
  };

  // 🕑 Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
              <View style={styles.storeInfoRow}>
                <Text style={styles.storeInfoLabel}>Store Name</Text>
                <Text style={styles.storeInfoValue}>{displayStoreName}</Text>
              </View>
            </View>
            <View style={styles.storeInfoCard}>
              <View style={styles.storeInfoRow}>
                <Text style={styles.storeInfoLabel}>Owner</Text>
                <Text style={styles.storeInfoValue}>{displayOwnerName}</Text>
              </View>
            </View>
            <View style={styles.storeInfoCard}>
              <View style={styles.storeInfoRow}>
                <Text style={styles.storeInfoLabel}>Contact</Text>
                <Text style={styles.storeInfoValue}>{displayOwnerContact}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#888', marginBottom: 16 }}>
            You are not yet part of a store.
          </Text>
        )}

        {/* Profile Settings */}
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {profile?.profile_image ? (
              <Image 
                source={{ uri: profile.profile_image }} 
                style={styles.avatarLarge} 
              />
            ) : (
              <View style={[styles.avatarLarge, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{getUserInitials()}</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <View style={styles.uploadingContent}>
                  <ActivityIndicator size="large" color={Colors.white} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editBadge, uploading && styles.editBadgeDisabled]}
              onPress={handleSelectImage}
              disabled={uploading}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name={uploading ? "clock-o" : "camera"} 
                size={14} 
                color={Colors.white} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <Text style={styles.blockTitle}>Personal Information</Text>
        {profileError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{profileError}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempFirstName}
                onChangeText={setTempFirstName}
                placeholder="First Name"
                placeholderTextColor={Colors.textSecondary}
              />
              <TextInput
                style={styles.nameInput}
                value={tempLastName}
                onChangeText={setTempLastName}
                placeholder="Last Name"
                placeholderTextColor={Colors.textSecondary}
              />
              <View style={styles.editButtonsRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelEditName}
                  disabled={updatingName}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, updatingName && styles.saveButtonDisabled]}
                  onPress={handleSaveName}
                  disabled={updatingName}
                >
                  {updatingName ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{displayName}</Text>
              <TouchableOpacity 
                style={styles.editTextButton} onPress={handleEditName} activeOpacity={0.7}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <View style={styles.infoValueBox}>
            <Text style={styles.infoValue}>{displayEmail}</Text>
          </View>
        </View>

        <Text style={styles.blockTitle}>Security</Text>
        <TouchableOpacity style={styles.settingsRow} activeOpacity={0.8} onPress={handleChangePassword}>
          <Text style={styles.settingsText}>Change Password</Text>
          <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.blockTitle, styles.logoutTitle]}>Logout</Text>
        <TouchableOpacity
          style={styles.logoutRow} activeOpacity={0.8} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
          <View style={styles.logoutIconPill}>
            <FontAwesome name="arrow-right" size={14} color={Colors.textSecondary}/></View>
        </TouchableOpacity>
        <View style={{ height: 100 }}/>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent animationType="fade" visible={logoutModalVisible} onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalLogoutButton}
                onPress={async () => {
                  setLogoutModalVisible(false);
                  try {
                    await apiService.logout();
                    await AsyncStorage.removeItem('@app_user');
                    navigation.replace('SignIn');
                  } catch (error) {
                    console.error('Logout error:', error);
                    showThemedAlert(setAlert, 'Error', 'Failed to logout');
                  }
                }}
              >
                <Text style={styles.modalLogoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
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

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateOrder')}>
          <Icon name="add-circle-outline" size={22} color="#555" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TransactionPage')}>
          <Icon name="receipt-outline" size={22} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorProfilePage')}>
          <Icon name="person-outline" size={22} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary, fontWeight: 'bold' }]}>Profile</Text>
        </TouchableOpacity>
        
      </View>

      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ visible: false, title: '', message: '', buttons: [] })}
      />
    </SafeAreaView>
  );
};

// 🧱 Styles (unchanged)
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    backgroundColor: Colors.primary,
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
  storeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeInfoLabel: { 
    fontSize: 13, 
    color: '#333', 
    fontWeight: '400', 
    flex: 1,
  },
  storeInfoValue: { 
    fontSize: 13, 
    color: '#666', 
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 12, color: Colors.primary },
  avatarContainer: { 
    alignSelf: 'center', 
    alignItems: 'center',
    marginBottom: Spacing.xl 
  },
  avatarWrapper: { 
    position: 'relative', 
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarLarge: { 
    width: 130, 
    height: 130, 
    borderRadius: 65, 
    backgroundColor: '#f0f0f0',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingContent: {
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: Typography.small,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editBadgeDisabled: {
    backgroundColor: '#888',
  },
  changePhotoHint: {
    fontSize: Typography.small,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  blockTitle: { marginTop: Spacing.xl, fontSize: Typography.h3, fontWeight: '600', color: Colors.textPrimary },
  personalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    position: 'relative',
  },
  personalInfoEditBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  infoRow: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  infoLabel: { fontSize: Typography.small, color: Colors.textSecondary, marginBottom: Spacing.xs },
  infoValueBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: { fontSize: Typography.body, color: Colors.textSecondary, flex: 1 },
  editTextButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  infoValueContainer: {
    position: 'relative',
  },
  infoValueWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameEditBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  editButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  editNameContainer: {
    flex: 1,
  },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: Typography.small,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.small,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ffe6e6',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: '#b00020', fontSize: Typography.small },
  settingsRow: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.light,
  },
  settingsText: { fontSize: Typography.body, color: Colors.textPrimary },
  logoutTitle: { marginTop: Spacing.lg },
  logoutRow: {
    marginTop: Spacing.md,
    backgroundColor: '#f3f3f3',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutText: { fontSize: Typography.body, color: Colors.textPrimary },
  logoutIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e9eaec',
    alignItems: 'center',
    justifyContent: 'center',
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
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  retryButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '85%', 
    backgroundColor: Colors.white, 
    borderRadius: Radii.lg, 
    padding: Spacing.xl, 
    alignItems: 'center', 
    ...Shadows.light 
  },
  modalTitle: { 
    fontSize: Typography.h3, 
    fontWeight: '700', 
    color: Colors.textPrimary, 
    marginBottom: Spacing.sm 
  },
  modalMessage: { 
    fontSize: Typography.body, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    marginBottom: Spacing.lg 
  },
  modalButtonsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    gap: Spacing.md 
  },
  modalCancelButton: { 
    flex: 1, 
    paddingVertical: Spacing.sm, 
    borderRadius: Radii.md, 
    backgroundColor: '#f0f0f0', 
    alignItems: 'center' 
  },
  modalCancelButtonText: { 
    fontSize: Typography.body, 
    fontWeight: '600', 
    color: Colors.textSecondary 
  },
  modalLogoutButton: { 
    flex: 1, 
    paddingVertical: Spacing.sm, 
    borderRadius: Radii.md, 
    backgroundColor: Colors.primary, 
    alignItems: 'center' 
  },
  modalLogoutButtonText: { 
    fontSize: Typography.body, 
    fontWeight: '600', 
    color: Colors.white 
  },
});
