// Test manual code entry for code-only redemption
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';
const CUSTOMER_ID = 1; // Change to your test customer ID
const SHORT_CODE = 'PIGBQ0'; // The vendor's generated code

async function testManualCode() {
  console.log('\n=== Testing Manual Code Entry ===');
  console.log('Customer ID:', CUSTOMER_ID);
  console.log('Short Code:', SHORT_CODE);
  console.log('URL:', `${API_URL}/transactions/process-code`);
  
  try {
    const response = await fetch(`${API_URL}/transactions/process-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: CUSTOMER_ID,
        short_code: SHORT_CODE
      })
    });
    
    const data = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

testManualCode();
