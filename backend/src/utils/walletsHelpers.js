const db = require('./database');
const { FieldValue } = require('@google-cloud/firestore');

/**
 * Wallets Helpers - Firestore Operations
 * Collection: wallets
 */

// Create wallet for user
async function createWallet(userId) {
  const walletRef = db.collection('wallets').doc(userId);
  const wallet = {
    userId,
    balance: 0,
    currency: 'USD',
    totalEarned: 0,
    totalSpent: 0,
    totalWithdrawn: 0,
    pendingBalance: 0,
    transactions: [],
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await walletRef.set(wallet);
  return { ...wallet, walletId: userId };
}

// Get wallet by user ID
async function getWalletByUserId(userId) {
  const doc = await db.collection('wallets').doc(userId).get();
  
  if (!doc.exists) {
    // Create wallet if it doesn't exist
    return await createWallet(userId);
  }
  
  return { id: doc.id, ...doc.data() };
}

// Get all wallets (Admin)
async function getAllWallets(options = {}) {
  const { limit = 100, status, minBalance } = options;
  
  let query = db.collection('wallets');
  
  if (status) {
    query = query.where('status', '==', status);
  }
  
  if (minBalance !== undefined) {
    query = query.where('balance', '>=', minBalance);
  }
  
  query = query.orderBy('balance', 'desc').limit(limit);
  
  const snapshot = await query.get();
  const wallets = [];
  
  snapshot.forEach(doc => {
    wallets.push({ id: doc.id, ...doc.data() });
  });
  
  return wallets;
}

// Add funds to wallet
async function addFunds(userId, amount, transactionDetails = {}) {
  const walletRef = db.collection('wallets').doc(userId);
  const doc = await walletRef.get();
  
  if (!doc.exists) {
    throw new Error('Wallet not found');
  }
  
  const transaction = {
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'credit',
    amount,
    description: transactionDetails.description || 'Funds added',
    source: transactionDetails.source || 'admin',
    status: 'completed',
    timestamp: new Date()
  };
  
  await walletRef.update({
    balance: FieldValue.increment(amount),
    totalEarned: FieldValue.increment(amount),
    transactions: FieldValue.arrayUnion(transaction),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, transaction };
}

// Deduct funds from wallet
async function deductFunds(userId, amount, transactionDetails = {}) {
  const walletRef = db.collection('wallets').doc(userId);
  const doc = await walletRef.get();
  
  if (!doc.exists) {
    throw new Error('Wallet not found');
  }
  
  const wallet = doc.data();
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const transaction = {
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'debit',
    amount,
    description: transactionDetails.description || 'Funds deducted',
    destination: transactionDetails.destination || 'purchase',
    status: 'completed',
    timestamp: new Date()
  };
  
  await walletRef.update({
    balance: FieldValue.increment(-amount),
    totalSpent: FieldValue.increment(amount),
    transactions: FieldValue.arrayUnion(transaction),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, transaction };
}

// Create withdrawal request
async function createWithdrawalRequest(userId, amount, withdrawalDetails = {}) {
  const walletRef = db.collection('wallets').doc(userId);
  const doc = await walletRef.get();
  
  if (!doc.exists) {
    throw new Error('Wallet not found');
  }
  
  const wallet = doc.data();
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const withdrawalRef = db.collection('withdrawals').doc();
  const withdrawal = {
    withdrawalId: withdrawalRef.id,
    userId,
    amount,
    method: withdrawalDetails.method || 'bank_transfer',
    accountDetails: withdrawalDetails.accountDetails || {},
    status: 'pending',
    requestedAt: FieldValue.serverTimestamp(),
    processedAt: null
  };
  
  await withdrawalRef.set(withdrawal);
  
  // Deduct from balance and add to pending
  await walletRef.update({
    balance: FieldValue.increment(-amount),
    pendingBalance: FieldValue.increment(amount),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, withdrawal };
}

// Process withdrawal (Admin)
async function processWithdrawal(withdrawalId, status, adminNotes = '') {
  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  const doc = await withdrawalRef.get();
  
  if (!doc.exists) {
    throw new Error('Withdrawal not found');
  }
  
  const withdrawal = doc.data();
  const walletRef = db.collection('wallets').doc(withdrawal.userId);
  
  if (status === 'approved') {
    await withdrawalRef.update({
      status: 'approved',
      processedAt: FieldValue.serverTimestamp(),
      adminNotes
    });
    
    await walletRef.update({
      pendingBalance: FieldValue.increment(-withdrawal.amount),
      totalWithdrawn: FieldValue.increment(withdrawal.amount),
      updatedAt: FieldValue.serverTimestamp()
    });
  } else if (status === 'rejected') {
    await withdrawalRef.update({
      status: 'rejected',
      processedAt: FieldValue.serverTimestamp(),
      adminNotes
    });
    
    // Refund to balance
    await walletRef.update({
      pendingBalance: FieldValue.increment(-withdrawal.amount),
      balance: FieldValue.increment(withdrawal.amount),
      updatedAt: FieldValue.serverTimestamp()
    });
  }
  
  return { success: true };
}

// Get wallet transactions
async function getTransactions(userId, options = {}) {
  const { limit = 50 } = options;
  
  const wallet = await getWalletByUserId(userId);
  const transactions = wallet.transactions || [];
  
  return transactions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// Get wallet statistics
async function getWalletsStats() {
  const walletsSnapshot = await db.collection('wallets').get();
  
  let totalBalance = 0;
  let totalEarned = 0;
  let totalSpent = 0;
  let totalWithdrawn = 0;
  let totalPending = 0;
  let activeWallets = 0;
  
  walletsSnapshot.forEach(doc => {
    const wallet = doc.data();
    totalBalance += wallet.balance || 0;
    totalEarned += wallet.totalEarned || 0;
    totalSpent += wallet.totalSpent || 0;
    totalWithdrawn += wallet.totalWithdrawn || 0;
    totalPending += wallet.pendingBalance || 0;
    if (wallet.status === 'active') activeWallets++;
  });
  
  // Get pending withdrawals count
  const pendingWithdrawalsSnapshot = await db.collection('withdrawals')
    .where('status', '==', 'pending')
    .count()
    .get();
  
  return {
    totalWallets: walletsSnapshot.size,
    activeWallets,
    totalBalance,
    totalEarned,
    totalSpent,
    totalWithdrawn,
    totalPending,
    pendingWithdrawals: pendingWithdrawalsSnapshot.data().count
  };
}

// Transfer funds between wallets
async function transferFunds(fromUserId, toUserId, amount, description = '') {
  const fromWalletRef = db.collection('wallets').doc(fromUserId);
  const toWalletRef = db.collection('wallets').doc(toUserId);
  
  const fromDoc = await fromWalletRef.get();
  if (!fromDoc.exists) {
    throw new Error('Sender wallet not found');
  }
  
  const fromWallet = fromDoc.data();
  if (fromWallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const toDoc = await toWalletRef.get();
  if (!toDoc.exists) {
    // Create receiver wallet if it doesn't exist
    await createWallet(toUserId);
  }
  
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const debitTransaction = {
    transactionId,
    type: 'transfer_out',
    amount,
    description: description || `Transfer to ${toUserId}`,
    destination: toUserId,
    status: 'completed',
    timestamp: new Date()
  };
  
  const creditTransaction = {
    transactionId,
    type: 'transfer_in',
    amount,
    description: description || `Transfer from ${fromUserId}`,
    source: fromUserId,
    status: 'completed',
    timestamp: new Date()
  };
  
  // Execute transfer
  await fromWalletRef.update({
    balance: FieldValue.increment(-amount),
    totalSpent: FieldValue.increment(amount),
    transactions: FieldValue.arrayUnion(debitTransaction),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  await toWalletRef.update({
    balance: FieldValue.increment(amount),
    totalEarned: FieldValue.increment(amount),
    transactions: FieldValue.arrayUnion(creditTransaction),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, transactionId };
}

module.exports = {
  createWallet,
  getWalletByUserId,
  getAllWallets,
  addFunds,
  deductFunds,
  createWithdrawalRequest,
  processWithdrawal,
  getTransactions,
  getWalletsStats,
  transferFunds
};
