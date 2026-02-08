import express from 'express';
import { HPCL_PRODUCTS } from '../services/productInference.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json(HPCL_PRODUCTS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by category
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const category = req.params.category.replace(/_/g, ' ');
    const products = HPCL_PRODUCTS[category] || {};
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
