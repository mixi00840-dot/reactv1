const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    variant: mongoose.Schema.Types.Mixed,
    price: Number, // Snapshot of price when added
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Totals
  subtotal: {
    type: Number,
    default: 0
  },
  
  itemsCount: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

// Index (userId already has unique index from schema)
CartSchema.index({ 'items.productId': 1 });

// Method to add item
CartSchema.methods.addItem = async function(productId, quantity = 1, variant = null) {
  const existingItem = this.items.find(item => 
    item.productId.equals(productId) && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    this.items.push({
      productId,
      storeId: product.storeId,
      quantity,
      variant,
      price: product.price,
      addedAt: new Date()
    });
  }
  
  await this.calculateTotals();
  return this.save();
};

// Method to remove item
CartSchema.methods.removeItem = async function(productId, variant = null) {
  this.items = this.items.filter(item => 
    !(item.productId.equals(productId) && JSON.stringify(item.variant) === JSON.stringify(variant))
  );
  
  await this.calculateTotals();
  return this.save();
};

// Method to update quantity
CartSchema.methods.updateQuantity = async function(productId, quantity, variant = null) {
  const item = this.items.find(item => 
    item.productId.equals(productId) && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );
  
  if (item) {
    item.quantity = quantity;
    await this.calculateTotals();
    return this.save();
  }
  
  throw new Error('Item not found in cart');
};

// Method to clear cart
CartSchema.methods.clear = async function() {
  this.items = [];
  this.subtotal = 0;
  this.itemsCount = 0;
  return this.save();
};

// Calculate totals
CartSchema.methods.calculateTotals = async function() {
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;
