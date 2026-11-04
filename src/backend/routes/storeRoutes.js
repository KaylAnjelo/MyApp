const express = require("express");
const router = express.Router();

// Try to load Supabase client (matches pattern used in userRoutes.js)
const { supabase } = require('../supabaseClient');

// Example dummy stores data (replace with Supabase later)
const stores = [
  { id: 1, name: "Store A", location: "City Center" },
  { id: 2, name: "Store B", location: "Mall" }
];

// Helper to normalize store objects so the frontend can read `address`
const normalizeStores = (arr) => {
  return arr.map(s => ({
    // preserve existing fields and ensure `address` exists (fallback to `location`)
    ...s,
    address: s.address || s.location || null,
  }));
};

// GET /api/stores
router.get("/stores", async (req, res) => {
  try {
    // If Supabase client isn't configured (dev mode), return normalized dummy data
    if (!supabase) {
      return res.json(normalizeStores(stores));
    }

    // Query the `stores` table for active stores
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching stores from Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    // Normalize records so frontend sees `address`
    const normalized = normalizeStores(data || []);
    res.json(normalized);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stores/:storeId - Get single store by ID
router.get("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!supabase) {
      const store = stores.find(s => s.id === parseInt(storeId));
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      return res.json(normalizeStores([store])[0]);
    }

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching store from Supabase:', error);
      return res.status(404).json({ error: 'Store not found' });
    }

    // Normalize and include all fields including owner_id
    const normalized = {
      ...data,
      address: data.address || data.location || null,
    };
    
    res.json(normalized);
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stores/:storeId/sales-summary
router.get("/stores/:storeId/sales-summary", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { month, year } = req.query; // Get month and year from query params

    if (!supabase) {
      // Dev fallback
      return res.json({
        todayRevenue: 1750.00,
        todayOrders: 22,
        monthlySales: [22600, 23500, 9100, 15000, 21000, 25000, 18000, 12000, 14000, 16000],
        daysInMonth: 30
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Determine the month/year to query
    const targetYear = year ? parseInt(year) : today.getFullYear();
    const targetMonth = month !== undefined ? parseInt(month) : today.getMonth();

    // Get today's transactions
    const { data: todayTransactions, error: todayError } = await supabase
      .from('transactions')
      .select('total, price, quantity')
      .eq('store_id', storeId)
      .eq('transaction_type', 'Purchase')
      .gte('transaction_date', today.toISOString())
      .lt('transaction_date', tomorrow.toISOString());

    if (todayError) {
      console.error('Error fetching today transactions:', todayError);
      return res.status(500).json({ error: todayError.message });
    }

    // Calculate today's revenue and orders
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + parseFloat(t.price * t.quantity), 0);
    const uniqueReferences = new Set(todayTransactions.map(t => t.reference_number));
    const todayOrders = uniqueReferences.size || todayTransactions.length;

    // Get the selected month's date range
    const monthStart = new Date(targetYear, targetMonth, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0); // Last day of month
    monthEnd.setHours(23, 59, 59, 999);
    const daysInMonth = monthEnd.getDate();

    const { data: monthTransactions, error: monthError } = await supabase
      .from('transactions')
      .select(`
        transaction_date, 
        price, 
        quantity,
        products (
          product_type
        )
      `)
      .eq('store_id', storeId)
      .eq('transaction_type', 'Purchase')
      .gte('transaction_date', monthStart.toISOString())
      .lte('transaction_date', monthEnd.toISOString());

    if (monthError) {
      console.error('Error fetching month transactions:', monthError);
      return res.status(500).json({ error: monthError.message });
    }

    // Group by day of month and product type
    const monthlySales = new Array(daysInMonth).fill(0);
    const salesByType = {}; // { "Food": [0,0,0...], "Beverages": [0,0,0...] }
    
    monthTransactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const dayOfMonth = date.getDate() - 1; // 0-indexed
      const amount = parseFloat(t.price * t.quantity);
      const productType = t.products?.product_type || 'Other';
      
      if (dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
        monthlySales[dayOfMonth] += amount;
        
        // Initialize array for this product type if not exists
        if (!salesByType[productType]) {
          salesByType[productType] = new Array(daysInMonth).fill(0);
        }
        salesByType[productType][dayOfMonth] += amount;
      }
    });

    res.json({
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      todayOrders,
      monthlySales,
      salesByType, // New field: sales grouped by product type
      daysInMonth
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stores/:storeId/top-products
router.get("/stores/:storeId/top-products", async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!supabase) {
      // Dev fallback
      return res.json([
        { id: 1, name: 'Product 1', price: 120.00, total_sold: 45, image_url: 'https://via.placeholder.com/150' },
        { id: 2, name: 'Product 2', price: 130.00, total_sold: 38, image_url: 'https://via.placeholder.com/150' },
        { id: 3, name: 'Product 3', price: 140.00, total_sold: 32, image_url: 'https://via.placeholder.com/150' }
      ]);
    }

    // Query transactions grouped by product
    const { data: productSales, error } = await supabase
      .from('transactions')
      .select(`
        product_id,
        quantity,
        products (
          id,
          product_name,
          price,
          product_image
        )
      `)
      .eq('store_id', storeId)
      .eq('transaction_type', 'Purchase');

    if (error) {
      console.error('Error fetching top products:', error);
      return res.status(500).json({ error: error.message });
    }

    // Group by product and sum quantities
    const productMap = {};
    productSales.forEach(sale => {
      const productId = sale.product_id;
      if (!productMap[productId]) {
        productMap[productId] = {
          id: sale.products?.id || productId,
          name: sale.products?.product_name || 'Unknown Product',
          price: sale.products?.price || 0,
          image_url: sale.products?.product_image || 'https://via.placeholder.com/150',
          total_sold: 0
        };
      }
      productMap[productId].total_sold += sale.quantity;
    });

    // Convert to array and sort by total_sold
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 10); // Top 10 products

    res.json(topProducts);
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stores/:storeId/sales-analytics - Comprehensive sales analytics
router.get("/stores/:storeId/sales-analytics", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { month, year } = req.query;

    if (!supabase) {
      return res.json({
        todayRevenue: 1750.00,
        todayOrders: 22,
        weeklyPerformance: [
          { week: 'Week 1', revenue: 22600 },
          { week: 'Week 2', revenue: 23500 },
          { week: 'Week 3', revenue: 9100 },
          { week: 'Week 4', revenue: 15000 }
        ],
        topProducts: [
          { name: 'Pares', revenue: 15000 },
          { name: 'Lugaw', revenue: 17000 },
          { name: 'Canton', revenue: 8000 }
        ],
        salesByType: {
          'Food': [5000, 7000, 3000, 4000],
          'Beverages': [3000, 4000, 2000, 3000]
        },
        transactionProgress: { current: 580, target: 820 }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetYear = year ? parseInt(year) : today.getFullYear();
    const targetMonth = month !== undefined ? parseInt(month) : today.getMonth();

    // Today's stats
    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('total, price, quantity, reference_number')
      .eq('store_id', storeId)
      .eq('transaction_type', 'Purchase')
      .gte('transaction_date', today.toISOString())
      .lt('transaction_date', tomorrow.toISOString());

    const todayRevenue = (todayTransactions || []).reduce((sum, t) => sum + parseFloat(t.price * t.quantity), 0);
    const uniqueRefs = new Set((todayTransactions || []).map(t => t.reference_number));
    const todayOrders = uniqueRefs.size || (todayTransactions || []).length;

    // Monthly data for weekly performance
    const monthStart = new Date(targetYear, targetMonth, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const daysInMonth = monthEnd.getDate();

    const { data: monthTransactions } = await supabase
      .from('transactions')
      .select(`
        transaction_date,
        price,
        quantity,
        products (
          product_name,
          product_type
        )
      `)
      .eq('store_id', storeId)
      .eq('transaction_type', 'Purchase')
      .gte('transaction_date', monthStart.toISOString())
      .lte('transaction_date', monthEnd.toISOString());

    // Weekly performance
    const weeklyRevenue = [0, 0, 0, 0];
    const daysPerWeek = Math.ceil(daysInMonth / 4);
    
    // Sales by product type (weekly)
    const salesByType = {};
    
    // Product revenue aggregation
    const productRevenue = {};

    (monthTransactions || []).forEach(t => {
      const date = new Date(t.transaction_date);
      const dayOfMonth = date.getDate() - 1;
      const weekIndex = Math.floor(dayOfMonth / daysPerWeek);
      const revenue = parseFloat(t.price * t.quantity);
      
      // Weekly revenue
      if (weekIndex < 4) {
        weeklyRevenue[weekIndex] += revenue;
      }
      
      // Revenue by product type
      const productType = t.products?.product_type || 'Other';
      if (!salesByType[productType]) {
        salesByType[productType] = [0, 0, 0, 0];
      }
      if (weekIndex < 4) {
        salesByType[productType][weekIndex] += revenue;
      }
      
      // Product revenue
      const productName = t.products?.product_name || 'Unknown';
      if (!productRevenue[productName]) {
        productRevenue[productName] = 0;
      }
      productRevenue[productName] += revenue;
    });

    const weeklyPerformance = [
      { week: 'Week 1', revenue: weeklyRevenue[0] },
      { week: 'Week 2', revenue: weeklyRevenue[1] },
      { week: 'Week 3', revenue: weeklyRevenue[2] },
      { week: 'Week 4', revenue: weeklyRevenue[3] }
    ];

    // Top 5 products by revenue
    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    // Transaction progress (orders this month vs target of 50)
    const currentMonthOrders = new Set((monthTransactions || []).map(t => t.reference_number)).size;
    const targetOrders = 50; // Fixed target of 50 orders per month

    res.json({
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      todayOrders,
      weeklyPerformance,
      topProducts,
      salesByType,
      transactionProgress: {
        current: currentMonthOrders,
        target: targetOrders
      }
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
