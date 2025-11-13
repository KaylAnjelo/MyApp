const { supabase } = require('./supabaseClient.js');

async function testProductsAPI() {
  console.log('🧪 Testing Products API...\n');

  try {
    // Test 1: Get all products from the database directly
    console.log('1. Testing direct database query for all products:');
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('*');
    
    if (allError) {
      console.error('❌ Error fetching all products:', allError);
    } else {
      console.log(`✅ Found ${allProducts.length} total products in database`);
      if (allProducts.length > 0) {
        console.log('Sample product:', allProducts[0]);
      }
    }

    // Test 2: Get products for specific stores
    console.log('\n2. Testing products by store_id:');
    const storeIds = [1, 2, 3, 4, 5];
    
    for (const storeId of storeIds) {
      const { data: storeProducts, error: storeError } = await supabase
        .from('products')
        .select('id, product_name, price, store_id, product_type, product_image')
        .eq('store_id', storeId)
        .order('product_name', { ascending: true });

      if (storeError) {
        console.error(`❌ Error fetching products for store ${storeId}:`, storeError);
      } else {
        console.log(`Store ${storeId}: ${storeProducts.length} products`);
        if (storeProducts.length > 0) {
          console.log(`  Sample: ${storeProducts[0].product_name} - ₱${storeProducts[0].price}`);
        }
      }
    }

    // Test 3: Get all stores
    console.log('\n3. Testing stores in database:');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('store_id, store_name, is_active');
    
    if (storesError) {
      console.error('❌ Error fetching stores:', storesError);
    } else {
      console.log(`✅ Found ${stores.length} stores in database:`);
      stores.forEach(store => {
        console.log(`  Store ${store.store_id}: ${store.store_name} (Active: ${store.is_active})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProductsAPI();