import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default function AllProductsScreen({ route, navigation }) {
  const { storeId, storeName, products } = route.params || {};

  // Debug logging
  console.log('=== ALL PRODUCTS SCREEN ===');
  console.log('Store ID:', storeId);
  console.log('Store Name:', storeName);
  console.log('Products count:', products?.length || 0);

  const renderProduct = ({ item, index }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuImageWrap}>
        <Image
          source={{ 
            uri: item.product_image || item.image_url || item.imageUrl || 'https://via.placeholder.com/150/c0c0c0' 
          }}
          style={styles.menuImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.menuLabelWrap}>
        <Text style={styles.menuLabel} numberOfLines={2}>
          {item.product_name || item.name || item.title || 'Product'}
        </Text>
        <Text style={styles.menuPoints}>
          {item.price ? (() => {
            let points = Math.round(item.price / 0.6);
            let lastDigit = points % 10;
            if (lastDigit !== 0 && lastDigit !== 5) {
              if (lastDigit < 5) {
                points = points - lastDigit + 5;
              } else {
                points = points + (10 - lastDigit);
              }
            }
            return `${points} points`;
          })() : 'points_value'}
        </Text>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          accessibilityLabel="Back"
        >
          <FontAwesome name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{storeName || 'All Products'}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.sectionTitle}>Menu</Text>
        </View>

        {products && products.length > 0 ? (
          <FlatList
            data={products}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            numColumns={2}
            columnWrapperStyle={styles.menuRow}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        ) : (
          <View style={styles.noProductsContainer}>
            <FontAwesome name="cutlery" size={48} color="#c0c0c0" style={styles.noProductsIcon} />
            <Text style={styles.noProductsText}>No products available</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 20,
  },
  content: {
    flex: 1,
    padding: Spacing.large,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  titleSection: {
    marginBottom: 15,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  productCount: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  productsList: {
    paddingBottom: Spacing.large,
  },
  menuRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  menuCard: {
    width: '47%',
    height: 220,
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.light,
  },
  menuImageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#c0c0c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuImage: { 
    width: '100%', 
    height: '100%',
  },
  menuLabelWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLabel: { 
    fontSize: Typography.small, 
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  menuPoints: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  buyButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: Typography.small,
    fontWeight: 'bold',
  },
  noProductsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: Radii.medium,
    padding: Spacing.large,
    ...Shadows.light,
  },
  noProductsIcon: {
    marginBottom: Spacing.medium,
  },
  noProductsText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});