import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../styles/theme';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const lineChartData = {
  labels: ['Mon', 'Tues', 'Wed'],
  datasets: [
    {
      data: [22600, 0, 0],
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue
      strokeWidth: 3,
    },
    {
      data: [0, 23500, 0],
      color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red
      strokeWidth: 3,
    },
    {
      data: [0, 0, 9100],
      color: (opacity = 1) => `rgba(255, 214, 0, ${opacity})`, // Yellow
      strokeWidth: 3,
    },
  ],
};

const barChartData = {
  labels: ['Pares', 'Lugaw', 'Canton'],
  datasets: [
    {
      data: [15000, 17000, 8000],
      colors: [
        (opacity = 1) => `rgba(0, 191, 165, ${opacity})`, // Teal blue
        (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red
        (opacity = 1) => `rgba(255, 214, 0, ${opacity})`, // Yellow
      ],
    },
  ],
};

const SalesPage = ({ navigation }) => {
  const [activeMonth, setActiveMonth] = useState(0);

  // Progress bar values
  const progressValue = 580;
  const progressMax = 820;
  const progressPercent = Math.round((progressValue / progressMax) * 100);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>My Sales</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₱1,750.00</Text>
            <Text style={styles.summaryLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>22</Text>
            <Text style={styles.summaryLabel}>Today's Orders</Text>
          </View>
        </View>

        {/* Month Filter */}
        <View style={styles.monthTabs}>
          {months.map((month, idx) => (
            <TouchableOpacity
              key={month}
              style={[styles.monthTab, activeMonth === idx && styles.activeMonthTab]}
              onPress={() => setActiveMonth(idx)}
            >
              <Text style={[styles.monthTabText, activeMonth === idx && styles.activeMonthTabText]}>{month}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sales Performance Chart */}
        <Text style={styles.sectionTitle}>Sales Performance</Text>
        <LineChart
          data={lineChartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#fff"
            },
            yAxisInterval: 5000,
          }}
          bezier
          fromZero
          yLabelsOffset={10}
          segments={5}
          yAxisSuffix=""
          yAxisInterval={5000}
          style={{ borderRadius: 15, marginBottom: 20 }}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={true}
          yAxisMax={25000}
        />

        {/* Transactions Progress Bar */}
        <Text style={styles.sectionTitle}>Transactions</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>₱{progressValue} / ₱{progressMax} ({progressPercent}%)</Text>
        </View>

        {/* Top Selling Products Bar Chart */}
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        <BarChart
          data={barChartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            barPercentage: 0.5,
          }}
          fromZero
          showValuesOnTopOfBars
          style={{ borderRadius: 15, marginBottom: 80 }}
          yAxisSuffix=""
          yLabelsOffset={10}
          segments={5}
          yAxisInterval={5000}
          yAxisMax={25000}
        />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorHomePage')}>
          <Icon name="home" size={22} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesPage')}>
          <Icon name="stats-chart-outline" size={22} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary, fontWeight: 'bold' }]}>Sales</Text>
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
          <Icon name="person-outline" size={22} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 20,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  monthTabs: {
    flexDirection: 'row',
    marginBottom: 18,
    justifyContent: 'center',
  },
  monthTab: {
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
  },
  activeMonthTab: {
    backgroundColor: Colors.primary,
  },
  monthTabText: {
    color: '#333',
    fontWeight: '600',
  },
  activeMonthTabText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#222',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
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

export default SalesPage;