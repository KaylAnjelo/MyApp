import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList, Image, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';

// Dummy data for the UI
const topSellingProducts = [
  { id: '1', name: 'Pares Bagnet Overlord', price: '₱120.00', rating: 4.5, image: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Pares Mami Overlord', price: '₱130.00', rating: 4.0, image: 'https://via.placeholder.com/150' },
  { id: '3', name: 'Diwata Fried Chicken', price: '₱140.00', rating: 4.8, image: 'https://via.placeholder.com/150' },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const data = {
  labels: ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'],
  datasets: [
    {
      data: [22600, 23500, 9100, 15000, 21000, 25000],
      color: (opacity = 1) => `rgba(0, 191, 165, ${opacity})`,
      strokeWidth: 3
    }
  ]
};

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#fff"
  }
};

const legendColors = [
  { label: 'Mon', color: '#2196F3', value: 22600 },
  { label: 'Tues', color: '#F44336', value: 23500 },
  { label: 'Wed', color: '#FFD600', value: 9100 },
  { label: 'Thu', color: '#4CAF50', value: 15000 },
  { label: 'Fri', color: '#FF9800', value: 21000 },
  { label: 'Sat', color: '#9C27B0', value: 25000 },
];

const ProductCard = ({ product }) => (
  <View style={styles.productCard}>
    <Image source={{ uri: product.image }} style={styles.productImage} />
    <Text style={styles.productName}>{product.name}</Text>
    <View style={styles.ratingContainer}>
      <Icon name="star" size={12} color="#FFD700" />
      <Text style={styles.ratingText}>{product.rating}</Text>
    </View>
    <Text style={styles.productPrice}>{product.price}</Text>
  </View>
);

const VendorHomePage = () => {
  const [activeMonth, setActiveMonth] = useState(0);

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>SUKI</Text>
          <TouchableOpacity>
            <Icon name="notifications" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* KPIs */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₱1,750.00</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          <View style={[styles.statCard, styles.ordersCard]}>
            <Text style={styles.statValue}>22</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
        </View>

        {/* Monthly Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tab, activeMonth === index && styles.activeTab]}
                onPress={() => setActiveMonth(index)}
              >
                <Text style={[styles.tabText, activeMonth === index && styles.activeTabText]}>{month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Graph */}
        <View style={styles.chartContainer}>
          <LineChart
            data={data}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 15 }}
          />
          {/* Legend below the graph */}
          <View style={styles.legendContainer}>
            {legendColors.map((item, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>{item.value.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Selling Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Selling products</Text>
        </View>
        <FlatList
          horizontal
          data={topSellingProducts}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
        {/* Add some bottom padding so content doesn't get hidden behind nav */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Icon name="home" size={22} color="#D22B2B" />
          <Text style={[styles.navText, { color: '#D22B2B', fontWeight: 'bold' }]}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="stats-chart-outline" size={22} color="#555" />
          <Text style={styles.navText}>Sales</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="add-circle-outline" size={22} color="#555" />
          <Text style={styles.navText}>Create</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="receipt-outline" size={22} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </View>
        <View style={styles.navItem}>
          <Icon name="person-outline" size={22} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D22B2B',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#D22B2B',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersCard: {
    backgroundColor: '#991A1A',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  tab: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    color: '#000',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  chartContainer: {
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    marginRight: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  legendValue: {
    fontSize: 12,
    color: '#888',
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  productsList: {
    paddingLeft: 5,
  },
  productCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
  },
  productImage: {
    width: 130,
    height: 130,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  productPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#D22B2B',
    marginTop: 5,
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
    color: '#555',
  },
});

export default VendorHomePage;