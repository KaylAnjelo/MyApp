const axios = require('axios');

async function testAPIEndpoint() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const baseURL = 'http://localhost:3000/api';
  
  try {
    // Test store with products (Store 1)
    console.log('1. Testing Store 1 (should have products):');
    const response1 = await axios.get(`${baseURL}/products/store/1`);
    console.log(`✅ Store 1: ${response1.data.products.length} products returned`);
    if (response1.data.products.length > 0) {
      console.log('Sample product:', response1.data.products[0]);
    }

    // Test store with products (Store 2)
    console.log('\n2. Testing Store 2 (should have products):');
    const response2 = await axios.get(`${baseURL}/products/store/2`);
    console.log(`✅ Store 2: ${response2.data.products.length} products returned`);
    if (response2.data.products.length > 0) {
      console.log('Sample product:', response2.data.products[0]);
    }

    // Test store without products (Store 3)
    console.log('\n3. Testing Store 3 (should be empty):');
    const response3 = await axios.get(`${baseURL}/products/store/3`);
    console.log(`✅ Store 3: ${response3.data.products.length} products returned`);

    // Test nonexistent store
    console.log('\n4. Testing Store 99 (nonexistent):');
    const response99 = await axios.get(`${baseURL}/products/store/99`);
    console.log(`✅ Store 99: ${response99.data.products.length} products returned`);

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testAPIEndpoint();