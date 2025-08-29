// stray import below was causing an error, remove it if present
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';

export default function ProfilePageScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.pageContent}>
        {/* Red top with header and quick actions */}
        <View style={styles.topSection}>
          <View style={styles.headerRow}>
            <View style={{ width: 22 }} />
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.quickActionsRow}>
            <View style={styles.quickAction}>
              <FontAwesome name="ticket" size={18} color={Colors.textPrimary} />
              <Text style={styles.quickActionLabel}>Vouchers</Text>
            </View>
            <View style={styles.quickAction}>
              <FontAwesome name="comment-o" size={18} color={Colors.textPrimary} />
              <Text style={styles.quickActionLabel}>Messages</Text>
            </View>
            <View style={styles.quickAction}>
              <FontAwesome name="users" size={18} color={Colors.textPrimary} />
              <Text style={styles.quickActionLabel}>Invite Friends</Text>
            </View>
          </View>
        </View>

        {/* Body content */}
        <View style={styles.bodyContent}>
          <Text style={styles.sectionHeader}>Profile Settings</Text>

          <View style={styles.avatarWrapper}>
            <Image source={{ uri: 'https://via.placeholder.com/120' }} style={styles.avatarLarge} />
            <TouchableOpacity style={styles.editBadge}>
              <FontAwesome name="camera" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.blockTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>Jecka Acupido</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>acupidojecka@gmail.com</Text>
            </View>
          </View>

          <Text style={styles.blockTitle}>Security</Text>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.8}>
            <Text style={styles.settingsText}>Change Password</Text>
            <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Logout */}
          <Text style={[styles.blockTitle, styles.logoutTitle]}>Logout</Text>
          <TouchableOpacity style={styles.logoutRow} activeOpacity={0.8}>
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
        <View style={styles.navItem}>
          <Ionicons name="storefront-outline" size={22} color="#555" />
          <Text style={styles.navText}>Stores</Text>
        </View>
        <View style={styles.navItem}>
          <FontAwesome name="qrcode" size={20} color="#555" />
          <Text style={styles.navText}>QR Scan</Text>
        </View>
        <View style={styles.navItem}>
          <FontAwesome name="list-alt" size={20} color="#555" />
          <Text style={styles.navText}>Activity</Text>
        </View>
        <View style={styles.navItem}>
          <FontAwesome name="user-o" size={20} color="#7D0006" />
          <Text style={[styles.navText, { color: '#7D0006' }]}>Profile</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  pageContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.quad,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  quickAction: {
    backgroundColor: Colors.white,
    width: '30%',
    borderRadius: Radii.md,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    ...Shadows.light,
  },
  quickActionLabel: {
    marginTop: Spacing.xs,
    fontSize: Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bodyContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.quad * 2,
  },
  sectionHeader: {
    fontSize: Typography.h3,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  nameText: {
    marginTop: Spacing.lg,
    fontSize: Typography.h2,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subText: {
    marginTop: Spacing.xs,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  blockTitle: {
    marginTop: Spacing.xl,
    fontSize: Typography.h3,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoValueBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  infoValue: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
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
  settingsText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  logoutTitle: {
    marginTop: Spacing.lg,
  },
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
  logoutText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
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
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
    color: '#555',
  },
});

 
