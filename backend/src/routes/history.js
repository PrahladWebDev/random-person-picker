const express = require('express');
const History = require('../models/History');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/history — newest first, capped so the list stays fast
router.get('/', async (req, res) => {
  try {
    const items = await History.find({ ownerId: req.ownerId }).sort({ createdAt: -1 }).limit(200);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history.' });
  }
});

// POST /api/history  { winners: [{ name, imageUrl? }], poolSize }
router.post('/', async (req, res) => {
  try {
    const { winners, poolSize } = req.body;
    if (!Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ error: 'At least one winner is required.' });
    }
    const clean = winners
      .filter((w) => w && typeof w.name === 'string' && w.name.trim())
      .slice(0, 50)
      .map((w) => ({
        name: w.name.trim(),
        // Only remote photos are kept — a local file:// path means nothing
        // on any other device.
        imageUrl: typeof w.imageUrl === 'string' && /^https?:\/\//.test(w.imageUrl) ? w.imageUrl : undefined,
      }));
    if (clean.length === 0) return res.status(400).json({ error: 'Winners need names.' });

    const entry = await History.create({
      winners: clean,
      poolSize: Number.isFinite(Number(poolSize)) ? Number(poolSize) : clean.length,
      ownerId: req.ownerId,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save history.' });
  }
});

// DELETE /api/history — clear everything for this account
router.delete('/', async (req, res) => {
  try {
    await History.deleteMany({ ownerId: req.ownerId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history.' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', async (req, res) => {
  try {
    const item = await History.findOneAndDelete({ _id: req.params.id, ownerId: req.ownerId });
    if (!item) return res.status(404).json({ error: 'History entry not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete history entry.' });
  }
});

module.exports = router;
