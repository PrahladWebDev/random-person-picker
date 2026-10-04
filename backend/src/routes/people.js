const express = require('express');
const multer = require('multer');
const Entry = require('../models/Entry');
const Group = require('../models/Group');
const { uploadEntryPhoto, deleteEntryPhoto } = require('../config/cloudinary');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Photos are received as multipart/form-data and held in memory just long
// enough to stream them to Cloudinary — nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

function bufferToDataUri(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// Every route below requires a signed-in user (Authorization: Bearer
// <token>). requireAuth sets req.ownerId to that user's id, and every query
// filters or checks against it — this is what keeps one account's saved
// people/photos from ever being returned to a different account.
router.use(requireAuth);

// GET /api/people — list this account's saved entries, newest first
router.get('/', async (req, res) => {
  try {
    const people = await Entry.find({ ownerId: req.ownerId }).sort({ createdAt: -1 });
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load saved people.' });
  }
});

// POST /api/people — create a saved entry, optionally with a photo
router.post('/', upload.single('photo'), async (req, res) => {
  console.log('POST /api/people body:', req.body, 'file:', req.file && {
    field: req.file.fieldname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      console.warn('POST /api/people rejected: missing name');
      return res.status(400).json({ error: 'Name is required.' });
    }

    let imageUrl;
    let imagePublicId;
    if (req.file) {
      console.log('Uploading photo to Cloudinary...');
      const uploaded = await uploadEntryPhoto(bufferToDataUri(req.file));
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
      console.log('Cloudinary upload OK:', imagePublicId);
    }

    const entry = await Entry.create({
      name: name.trim(),
      imageUrl,
      imagePublicId,
      ownerId: req.ownerId,
    });
    console.log('Entry saved:', entry._id.toString());
    res.status(201).json(entry);
  } catch (err) {
    // Previously this logged the real error server-side but only ever sent
    // back a generic "Failed to save entry." — so a Cloudinary auth
    // failure, a bad MONGODB_URI, etc. all looked identical from the app
    // and there was no way to tell why a photo didn't store. Surface the
    // actual message (Cloudinary's errors are safe, human-readable strings
    // like "Invalid api_key" — no secrets in them), plus full details
    // server-side so the real cause is obvious in the terminal.
    console.error('POST /api/people failed:', {
      message: err.message,
      name: err.name,
      http_code: err.http_code, // present on Cloudinary errors
      stack: err.stack,
    });
    res.status(500).json({ error: err.message || 'Failed to save entry.' });
  }
});

// PUT /api/people/:id — update name and/or replace the photo
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, ownerId: req.ownerId });
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      entry.name = req.body.name.trim();
    }

    if (req.file) {
      const uploaded = await uploadEntryPhoto(bufferToDataUri(req.file));
      await deleteEntryPhoto(entry.imagePublicId);
      entry.imageUrl = uploaded.secure_url;
      entry.imagePublicId = uploaded.public_id;
    }

    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error('PUT /api/people/:id failed:', err);
    res.status(500).json({ error: err.message || 'Failed to update entry.' });
  }
});

// DELETE /api/people/:id — remove the saved entry and their Cloudinary photo
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, ownerId: req.ownerId });
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    await deleteEntryPhoto(entry.imagePublicId);
    // Drop this person from any groups they were in.
    await Group.updateMany(
      { ownerId: req.ownerId },
      { $pull: { memberIds: entry._id.toString() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

module.exports = router;
