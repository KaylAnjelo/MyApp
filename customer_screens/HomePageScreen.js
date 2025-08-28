import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function HomePageScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Image 
              source={require('../assets/logo_maroon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Icon name="notifications-outline" size={26} color="#7D0006" />
        </View>

        {/* Feature Cards Section */}
        <View style={styles.cardContainer}>
          {/* Big Left Card (Highest Available Points) */}
          <View style={styles.bigCard}>
            <Text style={styles.cardTitle}>Highest Available Points</Text>
            <View style={styles.cardContent}>
              <Image
                source={require('../assets/reward_points.png')}
                style={styles.rewardPointsImage}
                resizeMode="contain"
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.cardText}>Shawarma store</Text>
                <Text style={styles.cardPoints}>115 points</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.useNowText}>Use now</Text>
            </TouchableOpacity>
          </View>

          {/* Right Two Small Cards */}
          <View style={styles.cardRightContainer}>
            {/* Food Chase Card */}
            <View style={[styles.smallCard]}>
              <Text style={styles.cardTitle}>Food Chase</Text>
              <Text style={styles.cardSubtitle}>Explore Missions</Text>
              <Icon name="restaurant-outline" size={30} color="#fff" style={styles.smallCardIcon} />
            </View>
            
            {/* My Rewards Card */}
            <View style={[styles.smallCard, { marginBottom: 0 }]}>
              <Text style={styles.cardTitle}>My Rewards</Text>
              <Icon name="gift-outline" size={30} color="#fff" style={styles.smallCardIcon} />
            </View>
          </View>
        </View>

        {/* Popular Stores Section */}
        <Text style={styles.sectionTitle}>Popular Stores</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.storeCard}>
            {/* Store Logo positioned above the name */}
            <View style={styles.storeImagePlaceholder}>
              <Image 
                  source={{ uri: 'https://via.placeholder.com/80' }} // Replace with actual image source
                  style={styles.storeImage} 
              />
              <Icon name="heart" size={20} color="#7D0006" style={styles.favoriteIcon} />
            </View>
            <Text style={styles.storeName}>Waffles</Text>
            <View style={styles.storeRating}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.storeRatingText}>5.0</Text>
            </View>
          </View>
          {/* Add more store cards here */}
        </ScrollView>

        {/* Recent Activities Section */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.recentActivitiesCard}>
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>
            No recent activities yet
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Icon name="home" size={22} color="#7D0006" />
          <Text style={[styles.navText, { color: '#7D0006' }]}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="business-outline" size={22} color="#555" />
          <Text style={styles.navText}>Stores</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="qr-code-outline" size={22} color="#555" />
          <Text style={styles.navText}>QR Scan</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="receipt-outline" size={22} color="#555" />
          <Text style={styles.navText}>Activity</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="person-outline" size={22} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoImage: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
    marginLeft: -35, // ensures it’s at the very left
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bigCard: {
    backgroundColor: '#7D0006',
    borderRadius: 20,
    padding: 15,
    width: '60%',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  smallCard: {
    backgroundColor: '#7D0006',
    borderRadius: 20,
    padding: 15,
    height: '48%',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardRightContainer: {
    width: '38%',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#f0f0f0',
    marginTop: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  cardText: {
    color: '#fff',
    fontSize: 13,
  },
  cardPoints: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  useNowText: {
    color: '#fff',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#000',
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    width: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  storeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: '#7D0006',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  storeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 3,
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  storeRatingText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 5,
  },
  recentActivitiesCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    height: 150,
    marginTop: 10,
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
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
    color: '#555',
  },
  rewardPointsImage: {
    width: 20,
    height: 20,
  },
  smallCardIcon: {
    position: 'absolute',
    right: 15,
    bottom: 15,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
});
