const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API at http://localhost:3000/api/products/store/1');
    const response = await fetch('http://localhost:3000/api/products/store/1');
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();