import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
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
        Alert.alert('Error', result.errorMessage || 'Failed to select image');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert('Image Error', 'Could not read image data. Please try again.');
          return;
        }
        await handleUploadImage(asset);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleUploadImage = async (asset) => {
    try {
      setUploading(true);

      const userId = profile?.user_id || profile?.userId;
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
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

        Alert.alert('Success', 'Profile image updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
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

          <View style={styles.avatarWrapper}>
            <Image 
              source={{ 
                uri: profile?.profile_image || 'https://via.placeholder.com/120?text=No+Image' 
              }} 
              style={styles.avatarLarge} 
            />
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={Colors.white} />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editBadge}
              onPress={handleSelectImage}
              disabled={uploading}
            >
              <FontAwesome name="camera" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.blockTitle}>Personal Information</Text>
          {profileError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{profileError}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{displayName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{displayEmail}</Text>
            </View>
          </View>

          <Text style={styles.blockTitle}>Security</Text>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.8}>
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
  avatarWrapper: { alignSelf: 'center', position: 'relative', marginBottom: Spacing.lg },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0f0f0' },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTitle: { marginTop: Spacing.xl, fontSize: Typography.h3, fontWeight: '600', color: Colors.textPrimary },
  infoRow: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  infoLabel: { fontSize: Typography.small, color: Colors.textSecondary, marginBottom: Spacing.xs },
  infoValueBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  infoValue: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'right' },
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
