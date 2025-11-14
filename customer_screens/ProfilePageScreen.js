import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function ProfilePageScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  const displayName =
    (profile &&
      (((profile.first_name || profile.last_name)
        ? `${(profile.first_name || '').trim()} ${(profile.last_name || '').trim()}`.trim()
        : null) ||
        profile.name ||
        profile.full_name ||
        profile.username ||
        'N/A')) ||
    'N/A';

  const displayEmail =
    (profile &&
      (profile.email || profile.user_email || profile.userEmail || profile.username)) ||
    'N/A';

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
      // Fallback to username if no first/last name
      const username = profile?.username || profile?.name || 'U';
      if (username.length >= 2) {
        return username.substring(0, 2).toUpperCase();
      }
      return username.charAt(0).toUpperCase();
    }
  };

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
      Alert.alert('Error', 'Both first name and last name are required');
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
        
        Alert.alert('Success', 'Name updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update name');
      }
    } catch (error) {
      console.error('Update name error:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setUpdatingName(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@app_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setProfileError(null);
          const userId =
            parsed.user_id ||
            parsed.userId ||
            parsed.id ||
            (parsed._raw && (parsed._raw.user_id || parsed._raw.id));
          if (userId) {
            try {
              const fresh = await apiService.getUserProfile(userId);
              if (fresh) {
                setProfile(fresh);
                setProfileError(null);
              }
            } catch (refreshErr) {
              console.warn('Failed to refresh profile from server:', refreshErr.message || refreshErr);
            }
          }
          return;
        }
        // No stored user found; show error instead of calling a non-existent API
        setProfileError('User not found. Please sign in again.');
      } catch (error) {
        const msg = error?.message || 'Failed to fetch profile';
        setProfileError(msg);
      }
    };
    fetchProfile();
  }, []);

  const handleSelectImage = async () => {
    if (uploading) return; // Prevent multiple taps during upload
    
    const hasImage = profile?.profile_image && !profile.profile_image.includes('placeholder');
    
    Alert.alert(
      'Profile Photo',
      hasImage ? 'Update profile picture' : 'Add profile picture',
      hasImage ? [
        {
          text: 'Change Photo',
          onPress: () => selectImageFromLibrary()
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => removeProfileImage()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ] : [
        {
          text: 'Choose Photo',
          onPress: () => selectImageFromLibrary()
        },
        {
          text: 'Cancel',
          style: 'cancel'
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
      Alert.alert('Selection Error', result.errorMessage || 'Unable to select image. Please try again.');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.base64) {
        Alert.alert('Image Error', 'Unable to select image. Please try choosing a different photo.');
          return;
        }
        await handleUploadImage(asset);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Selection Error', 'Unable to access your photo library. Please try again.');
    }
  };

  const removeProfileImage = async () => {
    try {
      setUploading(true);
      
      const userId = profile?.user_id || profile?.userId;
      console.log('Remove image - userId:', userId);
      console.log('Remove image - profile:', profile);
      
      if (!userId) {
        Alert.alert('Error', 'User information not found. Please sign in again.');
        return;
      }

      // Remove image from server
      console.log('Calling removeProfileImage API...');
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
      
      Alert.alert('Photo Removed', 'Profile removed successfully!');
    } catch (error) {
      console.error('Remove image error:', error);
      Alert.alert('Error', 'Couldn\'t remove photo.');
    } finally { 
      setUploading(false);
    }
  };

  const handleUploadImage = async (asset) => {
    try {
      setUploading(true);

      const userId = profile?.user_id || profile?.userId;
      if (!userId) {
        Alert.alert('Error', 'User information not found. Please sign in again.');
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

      Alert.alert('✅ Success', 'Your profile photo has been updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Couldn\'t upload your photo right now. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.pageContent}>
        {/* Header matching StoresScreen: centered title with spacers */}
        <View style={styles.headerTop}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Body content */}
        <View style={styles.bodyContent}>
          <Text style={styles.sectionHeader}>Profile Settings</Text>

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
                  style={styles.editTextButton}
                  onPress={handleEditName}
                  activeOpacity={0.7}
                >
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
          <TouchableOpacity 
            style={styles.settingsRow} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ChangePassword', { email: displayEmail })}
          >
            <Text style={styles.settingsText}>Change Password</Text>
            <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.blockTitle, styles.logoutTitle]}>Logout</Text>
          <TouchableOpacity
            style={styles.logoutRow}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
            <View style={styles.logoutIconPill}>
              <FontAwesome name="arrow-right" size={14} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('HomePage')}>
          <FontAwesome name="home" size={20} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('Stores')}>
          <Ionicons name="storefront-outline" size={22} color="#555" />
          <Text style={styles.navText}>Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ScannerScreen')}>
          <FontAwesome name="qrcode" size={20} color="#555" />
          <Text style={styles.navText}>QR Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ActivityScreen')}>
          <FontAwesome name="list-alt" size={20} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ProfilePage')}>
          <FontAwesome name="user-o" size={20} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  pageContent: { flexGrow: 1 },
  topSection: {
    backgroundColor: Colors.primary,
    // keep some vertical padding so the header has presence similar to Stores
    paddingTop: Spacing.quad + 6,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTop: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: { width: 20 },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: '700',
  },
  bodyContent: { padding: Spacing.xl, paddingBottom: Spacing.quad * 2 },
  sectionHeader: { fontSize: Typography.h3, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.lg },
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
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.white,
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
    color: Colors.white,
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
    borderColor: Colors.white,
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
    backgroundColor: Colors.textSecondary,
  },
  changePhotoHint: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  blockTitle: { marginTop: Spacing.xl, fontSize: Typography.h3, fontWeight: '600', color: Colors.textPrimary },
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
  editTextButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.small,
    color: Colors.primary,
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
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, marginTop: 2, color: '#555' },
});
