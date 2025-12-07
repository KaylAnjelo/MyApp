const { supabase } = require('./supabaseClient');

async function findValidIDs() {
  console.log('Finding valid test IDs from database...\n');
  
  // Find a customer
  const { data: customers, error: custError } = await supabase
    .from('users')
    .select('user_id, username, role')
    .eq('role', 'customer')
    .limit(5);
  
  if (custError) {
    console.error('Error fetching customers:', custError);
  } else if (customers && customers.length > 0) {
    console.log('Available Customers:');
    customers.forEach(c => {
      console.log(`  - ID: ${c.user_id}, Name: ${c.username}`);
    });
  } else {
    console.log('No customers found');
  }
  
  console.log('');
  
  // Find a vendor
  const { data: vendors, error: vendError } = await supabase
    .from('users')
    .select('user_id, username, role')
    .eq('role', 'vendor')
    .limit(5);
  
  if (vendError) {
    console.error('Error fetching vendors:', vendError);
  } else if (vendors && vendors.length > 0) {
    console.log('Available Vendors:');
    vendors.forEach(v => {
      console.log(`  - ID: ${v.user_id}, Name: ${v.username}`);
    });
  } else {
    console.log('No vendors found');
  }
  
  console.log('');
  
  // Find stores
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('store_id, store_name, owner_id')
    .limit(5);
  
  if (storeError) {
    console.error('Error fetching stores:', storeError);
  } else if (stores && stores.length > 0) {
    console.log('Available Stores:');
    stores.forEach(s => {
      console.log(`  - ID: ${s.store_id}, Name: ${s.store_name}, Owner ID: ${s.owner_id}`);
    });
  } else {
    console.log('No stores found');
  }
  
  console.log('');
  
  // Find products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(5);
  
  if (prodError) {
    console.error('Error fetching products:', prodError);
  } else if (products && products.length > 0) {
    console.log('Available Products:');
    products.forEach(p => {
      const id = p.id || p.product_id;
      const name = p.name || p.product_name;
      console.log(`  - ID: ${id}, Name: ${name}, Store: ${p.store_id}, Points: ${p.points_required || p.points || 'N/A'}`);
    });
  } else {
    console.log('No products found');
  }
  
  console.log('');
  
  // Find rewards
  const { data: rewards, error: rewError } = await supabase
    .from('rewards')
    .select('reward_id, reward_name, reward_type, discount_value')
    .limit(5);
  
  if (rewError) {
    console.error('Error fetching rewards:', rewError);
  } else if (rewards && rewards.length > 0) {
    console.log('Available Rewards:');
    rewards.forEach(r => {
      console.log(`  - ID: ${r.reward_id}, Name: ${r.reward_name}, Type: ${r.reward_type}, Discount: ${r.discount_value}%`);
    });
  } else {
    console.log('No rewards found');
  }
  
  console.log('\n========================================');
  console.log('Update TEST_CONFIG in test-transaction-scenarios.js with these IDs');
  console.log('========================================\n');
}

findValidIDs();
