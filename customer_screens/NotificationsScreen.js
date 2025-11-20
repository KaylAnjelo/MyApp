import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function NotificationsScreen({ navigation }) {
  console.log('NotificationsScreen mounted');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;
      console.log('Fetched userId for notifications:', userId);
      if (!userId) return;
      const response = await apiService.getUserNotifications(userId);
      console.log('Notifications API response:', response);
      if (response && response.notifications) {
        setNotifications(response.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.patch(`/notifications/read/${notificationId}`);
      setNotifications((prev) => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const renderItem = ({ item }) => {
    console.log('Notification item:', item);
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.is_read && styles.unreadNotification]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconArea}>
          <Ionicons name={item.is_read ? 'notifications-outline' : 'notifications'} size={24} color={item.is_read ? Colors.primary : '#d32f2f'} />
        </View>
        <View style={styles.textArea}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button and centered NOTIFICATIONS text */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('HomePage')}>
          <Ionicons name="arrow-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitleOnly}>NOTIFICATIONS</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {console.log('Notifications state:', notifications)}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
        contentContainerStyle={notifications.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleOnly: {
    fontSize: Typography.title || 22,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    borderRadius: Radii.md,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    ...Shadows.light,
  },
  unreadNotification: {
    backgroundColor: '#ffeaea',
  },
  iconArea: {
    marginRight: 14,
    marginTop: 2,
  },
  textArea: {
    flex: 1,
  },
  title: {
    fontSize: Typography.body,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: Typography.small,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: 'center',
    marginTop: 40,
  },
});
