// Quick script to check if the code-only redemption transaction exists in the database
const { supabase } = require('./config/supabase');

async function checkTransaction() {
  const refNumber = 'NUTE-20251207-7159'; // Latest test
  console.log(`Checking for transaction with reference ${refNumber}...\n`);
  
  // Check transactions table
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference_number', refNumber);
  
  if (txError) {
    console.error('Error querying transactions:', txError);
  } else {
    console.log('Transactions found:', transactions?.length || 0);
    if (transactions && transactions.length > 0) {
      console.log('Transaction details:');
      transactions.forEach(tx => {
        console.log(`  - ID: ${tx.id}`);
        console.log(`  - Type: ${tx.transaction_type}`);
        console.log(`  - Points: ${tx.points}`);
        console.log(`  - Amount: ${tx.price}`);
        console.log(`  - Customer: ${tx.user_id}`);
        console.log(`  - Product: ${tx.product_id}`);
        console.log('---');
      });
    }
  }
  
  // Check pending_transactions table
  const { data: pending, error: pendError } = await supabase
    .from('pending_transactions')
    .select('*')
    .or('short_code.eq.PIGBQ0,short_code.eq.HU9U6P');
  
  if (pendError) {
    console.error('Error querying pending transactions:', pendError);
  } else {
    console.log('\nPending transactions found:', pending?.length || 0);
    if (pending && pending.length > 0) {
      pending.forEach(p => {
        console.log(`  - Code: ${p.short_code}`);
        console.log(`  - Used: ${p.used}`);
        console.log(`  - Expires: ${p.expires_at}`);
        console.log('---');
      });
    }
  }
  
  process.exit(0);
}

checkTransaction();
