const express = require('express');
const Group = require('../models/Group');
const Entry = require('../models/Entry');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Only keep member ids that really are this account's saved people.
async function cleanMemberIds(ownerId, memberIds) {
  if (!Array.isArray(memberIds)) return [];
  const ids = [...new Set(memberIds.map(String))];
  const valid = await Entry.find({ ownerId, _id: { $in: ids } }).select('_id');
  return valid.map((e) => e._id.toString());
}

// GET /api/groups
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ ownerId: req.ownerId }).sort({ name: 1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load groups.' });
  }
});

// POST /api/groups  { name, memberIds }
router.post('/', async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'Group name is required.' });
    const memberIds = await cleanMemberIds(req.ownerId, req.body.memberIds);
    if (memberIds.length === 0) {
      return res.status(400).json({ error: 'Pick at least one saved person for the group.' });
    }
    const group = await Group.create({ name, memberIds, ownerId: req.ownerId });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create group.' });
  }
});

// PUT /api/groups/:id  { name?, memberIds? }
router.put('/:id', async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ownerId: req.ownerId });
    if (!group) return res.status(404).json({ error: 'Group not found.' });

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      group.name = req.body.name.trim();
    }
    if (Array.isArray(req.body.memberIds)) {
      group.memberIds = await cleanMemberIds(req.ownerId, req.body.memberIds);
    }
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update group.' });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({ _id: req.params.id, ownerId: req.ownerId });
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete group.' });
  }
});

module.exports = router;
