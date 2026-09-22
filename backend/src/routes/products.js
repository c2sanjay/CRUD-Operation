const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products - list all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid product id' });
  }
});

// POST /api/products - create product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, imageUrl, inStock } = req.body;
    const product = new Product({ name, description, price, imageUrl, inStock });
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create product', error: err.message });
  }
});

// PUT /api/products/:id - update product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, imageUrl, inStock } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, imageUrl, inStock },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update product', error: err.message });
  }
});

// DELETE /api/products/:id - delete product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete product', error: err.message });
  }
});

module.exports = router;

