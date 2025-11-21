import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
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

  // New state for logout modal
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

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
      const username = profile?.username || profile?.name || 'U';
      if (username.length >= 2) return username.substring(0, 2).toUpperCase();
      return username.charAt(0).toUpperCase();
    }
  };

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
              if (fresh) setProfile(fresh);
            } catch (refreshErr) {
              console.warn('Failed to refresh profile from server:', refreshErr.message || refreshErr);
            }
          }
          return;
        }
        setProfileError('User not found. Please sign in again.');
      } catch (error) {
        setProfileError(error?.message || 'Failed to fetch profile');
      }
    };
    fetchProfile();
  }, []);

  const handleSelectImage = async () => {
    if (uploading) return;
    const hasImage = profile?.profile_image && !profile.profile_image.includes('placeholder');
    
    Alert.alert(
      'Profile Photo',
      hasImage ? 'Update profile picture' : 'Add profile picture',
      hasImage ? [
        { text: 'Change Photo', onPress: () => selectImageFromLibrary() },
        { text: 'Remove Photo', style: 'destructive', onPress: () => removeProfileImage() },
        { text: 'Cancel', style: 'cancel' }
      ] : [
        { text: 'Choose Photo', onPress: () => selectImageFromLibrary() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectImageFromLibrary = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.5,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: true,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Selection Error', result.errorMessage || 'Unable to select image.');
        return;
      }
      if (result.assets && result.assets[0]) await handleUploadImage(result.assets[0]);
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Selection Error', 'Unable to access your photo library.');
    }
  };

  const removeProfileImage = async () => {
    try {
      setUploading(true);
      const userId = profile?.user_id || profile?.userId;
      if (!userId) {
        Alert.alert('Error', 'User information not found.');
        return;
      }
      await apiService.removeProfileImage(userId);
      setProfile(prev => ({ ...prev, profile_image: null }));
      const stored = await AsyncStorage.getItem('@app_user');
      if (stored) {
        const userData = JSON.parse(stored);
        userData.profile_image = null;
        await AsyncStorage.setItem('@app_user', JSON.stringify(userData));
      }
      Alert.alert('Photo Removed', 'Profile photo removed successfully!');
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
        Alert.alert('Error', 'User information not found.');
        return;
      }

      const mime = asset.type || 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
      const imageBase64 = `data:${mime};base64,${asset.base64}`;
      const baseName = asset.fileName ? asset.fileName.replace(/\.[^.]+$/, '') : `profile_${Date.now()}`;
      const fileName = `${baseName}.${ext}`;

      const response = await apiService.uploadProfileImage(userId, imageBase64, fileName);

      if (response.imageUrl) {
        const bust = `${response.imageUrl}${response.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setProfile(prev => ({ ...prev, profile_image: bust }));
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
      Alert.alert('Upload Failed', 'Couldn\'t upload your photo right now.');
    } finally {
      setUploading(false);
    }
  };

  // New logout handler to show modal
  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.pageContent}>
        <View style={styles.headerTop}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.bodyContent}>
          <Text style={styles.sectionHeader}>Profile Settings</Text>

          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {profile?.profile_image ? (
                <Image source={{ uri: profile.profile_image }} style={styles.avatarLarge} />
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
                <FontAwesome name={uploading ? "clock-o" : "camera"} size={14} color={Colors.white} />
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
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEditName} disabled={updatingName}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveButton, updatingName && styles.saveButtonDisabled]} onPress={handleSaveName} disabled={updatingName}>
                    {updatingName ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.infoValueBox}>
                <Text style={styles.infoValue}>{displayName}</Text>
                <TouchableOpacity style={styles.editTextButton} onPress={handleEditName} activeOpacity={0.7}>
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
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.8} onPress={() => navigation.navigate('ChangePassword', { email: displayEmail })}>
            <Text style={styles.settingsText}>Change Password</Text>
            <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.blockTitle, styles.logoutTitle]}></Text>
          <TouchableOpacity style={styles.logoutRow} activeOpacity={0.8} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
            <View style={styles.logoutIconPill}>
              <FontAwesome name="arrow-right" size={14} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
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
    shadowOffset: { width: 0, height: 4 },
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
  avatarInitials: { color: Colors.white, fontSize: 42, fontWeight: 'bold' },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  uploadingContent: { alignItems: 'center' },
  uploadingText: { color: Colors.white, fontSize: Typography.small, fontWeight: '600', marginTop: Spacing.sm },
  editBadge: { position: 'absolute', right: 4, bottom: 4, backgroundColor: Colors.primary, padding: 6, borderRadius: 16, borderWidth: 2, borderColor: Colors.white },
  editBadgeDisabled: { backgroundColor: Colors.textSecondary },
  blockTitle: { fontSize: Typography.h4, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.md, color: Colors.textPrimary },
  infoRow: { marginBottom: Spacing.md },
  infoLabel: { fontSize: Typography.body, color: Colors.textSecondary, marginBottom: 4 },
  infoValueBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.sm, backgroundColor: '#f7f7f7', borderRadius: Radii.md },
  infoValue: { fontSize: Typography.body, color: Colors.textPrimary },
  editTextButton: { marginLeft: Spacing.sm },
  editButtonText: { color: Colors.primary, fontWeight: '600', fontSize: Typography.body },
  editNameContainer: { backgroundColor: '#f7f7f7', padding: Spacing.sm, borderRadius: Radii.md },
  nameInput: { backgroundColor: Colors.white, padding: Spacing.sm, borderRadius: Radii.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: '#ddd' },
  editButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  cancelButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radii.md, backgroundColor: '#ddd' },
  cancelButtonText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },
  saveButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radii.md, backgroundColor: Colors.primary },
  saveButtonText: { color: Colors.white, fontWeight: '600' },
  saveButtonDisabled: { backgroundColor: '#aaa' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.sm, backgroundColor: '#f7f7f7', borderRadius: Radii.md, marginBottom: Spacing.md },
  settingsText: { fontSize: Typography.body, color: Colors.textPrimary },
  logoutTitle: { marginTop: Spacing.xl },
  logoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.sm, backgroundColor: '#fdecea', borderRadius: Radii.md },
  logoutText: { fontSize: Typography.body, color: '#d32f2f', fontWeight: '600' },
  logoutIconPill: { backgroundColor: '#fcdcdc', borderRadius: 12, padding: 4, alignItems: 'center', justifyContent: 'center' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 64, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: '#eee' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: Typography.small, color: '#555' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.xl, alignItems: 'center', ...Shadows.light },
  modalTitle: { fontSize: Typography.h3, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  modalMessage: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: Spacing.md },
  modalCancelButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radii.md, backgroundColor: '#f0f0f0', alignItems: 'center' },
  modalCancelButtonText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },
  modalLogoutButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center' },
  modalLogoutButtonText: { fontSize: Typography.body, fontWeight: '600', color: Colors.white },
});
