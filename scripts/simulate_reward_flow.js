// Quick simulation script to mirror createTransaction + processScannedQRInternal logic
// Run: node scripts/simulate_reward_flow.js

function simulateCreateTransaction({vendor_id, store_id, items, appliedReward}){
  const cart = items && items.length ? items.map(i => ({...i})) : [];
  let rewardPointsCost = appliedReward && (appliedReward.points_required || appliedReward.points_cost) ? (appliedReward.points_required || appliedReward.points_cost) : 0;

  if (appliedReward) {
    if (appliedReward.reward_type === 'free_item' && appliedReward.free_item_product_id) {
      cart.push({ product_id: appliedReward.free_item_product_id, product_name: appliedReward.free_item_name || null, quantity: 1, price: 0, is_reward: true });
    }
    if (appliedReward.reward_type === 'buy_x_get_y' && appliedReward.buy_x_product_id && appliedReward.get_y_product_id) {
      const buyXItem = cart.find(item => Number(item.product_id) === Number(appliedReward.buy_x_product_id));
      const needed = Number(appliedReward.buy_x_quantity || 1);
      const getYPer = Number(appliedReward.get_y_quantity || 1);
      if (buyXItem) {
        const available = Number(buyXItem.quantity || 0);
        const multiplier = needed > 0 ? Math.floor(available / needed) : 0;
        if (multiplier > 0) {
          cart.push({ product_id: appliedReward.get_y_product_id, product_name: appliedReward.get_y_name || null, quantity: multiplier * getYPer, price: 0, is_reward: true });
        }
      }
    }
  }

  // totals & discount
  let totalAmount = cart.reduce((s,it)=> s + (Number(it.price||0) * Number(it.quantity||0)), 0);
  let discountFraction = 0;
  if (appliedReward && appliedReward.reward_type === 'discount'){
    const discountRaw = Number(appliedReward.discount_value) || 0;
    if (discountRaw > 0 && discountRaw <=1) discountFraction = discountRaw;
    else if (discountRaw > 1 && discountRaw <= 100) discountFraction = discountRaw/100;
    else if (discountRaw > 100) discountFraction = 1;
    if (discountFraction>0) totalAmount = parseFloat((totalAmount * (1-discountFraction)).toFixed(2));
  }
  const totalPoints = parseFloat((totalAmount * 0.1).toFixed(2));

  const qrData = {
    reference_number: 'SIM-20251122-0001',
    short_code: 'SIM123',
    transaction_date: new Date().toISOString(),
    vendor_id, store_id,
    items: cart.map(i=> ({product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: Number(i.price), is_reward: !!i.is_reward})),
    total_amount: totalAmount,
    total_points: totalPoints,
    transaction_type: 'Purchase',
    reward_id: appliedReward && appliedReward.reward_id ? Number(appliedReward.reward_id) : null,
    reward_points: rewardPointsCost,
    reward_type: appliedReward && appliedReward.reward_type ? appliedReward.reward_type : null,
    discount_value: appliedReward && discountFraction>0 ? (discountFraction*100) : (appliedReward && appliedReward.discount_value != null ? appliedReward.discount_value : null),
    free_item_product_id: appliedReward && appliedReward.free_item_product_id ? appliedReward.free_item_product_id : null
  };

  return qrData;
}

function simulateProcessScannedQR(qr_data, customer_id){
  const reward_id = qr_data.reward_id != null ? Number(qr_data.reward_id) : null;
  const reward_points = qr_data.reward_points != null ? Number(qr_data.reward_points) : 0;
  const rewardType = (qr_data.reward_type || '').toLowerCase();
  const discountValue = qr_data.discount_value != null ? Number(qr_data.discount_value) : 0;

  const fallbackProductId = qr_data.free_item_product_id != null ? Number(qr_data.free_item_product_id) : (qr_data.items && qr_data.items.length ? qr_data.items[0].product_id : null);

  const transactionRows = (qr_data.items || []).map(item => {
    const rawPrice = Number(item.price || 0);
    let effectivePrice = rawPrice;
    if (rewardType === 'discount' && discountValue > 0) {
      effectivePrice = parseFloat((rawPrice * (1 - (discountValue / 100))).toFixed(2));
    }
    const productId = item.product_id != null ? Number(item.product_id) : (fallbackProductId != null ? Number(fallbackProductId) : 0);
    return {
      reference_number: qr_data.reference_number,
      product_id: productId,
      quantity: item.quantity,
      price: effectivePrice,
      points: parseFloat((effectivePrice * item.quantity * 0.1).toFixed(2)),
      reward_id: reward_id
    };
  });

  // redemption row if needed
  if (reward_id && rewardType !== 'discount' && qr_data.reward_points) {
    const deductionProductId = fallbackProductId != null ? Number(fallbackProductId) : 0;
    transactionRows.push({ product_id: deductionProductId, quantity:1, price:0, points: -(Number(qr_data.reward_points)||0), reference_number: qr_data.reference_number, reward_id });
  }

  return transactionRows;
}

// Example scenarios
const scenarios = [
  {
    name: 'Buy 1 get 1 (single buy)',
    vendor_id: 9,
    store_id: 2,
    items: [{ product_id: 10, product_name: 'Product X', quantity: 1, price: 45 }],
    appliedReward: { reward_id: 100, reward_type: 'buy_x_get_y', buy_x_product_id: 10, buy_x_quantity: 1, get_y_product_id: 20, get_y_quantity: 1 }
  },
  {
    name: 'Buy 2 get 1 (buy 4 should give 2 freebies)',
    vendor_id: 9,
    store_id: 2,
    items: [{ product_id: 11, product_name: 'Product A', quantity: 4, price: 30 }],
    appliedReward: { reward_id: 101, reward_type: 'buy_x_get_y', buy_x_product_id: 11, buy_x_quantity: 2, get_y_product_id: 21, get_y_quantity: 1 }
  },
  {
    name: 'Free item only (empty cart)',
    vendor_id: 9,
    store_id: 2,
    items: [],
    appliedReward: { reward_id: 102, reward_type: 'free_item', free_item_product_id: 30 }
  }
];

for (const s of scenarios){
  console.log('\n=== Scenario:', s.name, '===');
  const qr = simulateCreateTransaction({vendor_id: s.vendor_id, store_id: s.store_id, items: s.items, appliedReward: s.appliedReward});
  console.log('QR Data:', JSON.stringify(qr, null, 2));
  const txRows = simulateProcessScannedQR(qr, 123);
  console.log('Simulated transaction rows to insert:', JSON.stringify(txRows, null, 2));
}
