import express from 'express';
import Source from '../models/Source.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all sources
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sources = await Source.find().sort('-metadata.addedAt');
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new source
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const source = new Source({
      ...req.body,
      'metadata.addedBy': req.user.email
    });
    await source.save();
    res.status(201).json(source);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update source
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const source = await Source.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete source
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Source.findByIdAndDelete(req.params.id);
    res.json({ message: 'Source deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
