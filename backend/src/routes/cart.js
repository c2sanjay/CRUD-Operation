const express = require('express');
const Cart = require('../models/Cart');

const router = express.Router();

async function getOrCreateCart() {
  let cart = await Cart.findOne();
  if (!cart) {
    cart = new Cart({ items: [] });
    await cart.save();
  }
  return cart;
}

// GET /api/cart - get current cart
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne().populate('items.product');
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// POST /api/cart - add item to cart { productId, quantity }
router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const cart = await getOrCreateCart();
    const existingItem = cart.items.find(
      (item) => String(item.product) === String(productId)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate('items.product');
    res.status(201).json(cart);
  } catch (err) {
    res.status(400).json({ message: 'Failed to add to cart', error: err.message });
  }
});

// PUT /api/cart/:itemId - update quantity
router.put('/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 1) {
      return res
        .status(400)
        .json({ message: 'quantity must be a positive number' });
    }

    const cart = await getOrCreateCart();
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update cart item', error: err.message });
  }
});

// DELETE /api/cart/:itemId - remove item from cart
router.delete('/:itemId', async (req, res) => {
  try {
    const cart = await getOrCreateCart();
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.remove();
    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: 'Failed to remove cart item', error: err.message });
  }
});

module.exports = router;

