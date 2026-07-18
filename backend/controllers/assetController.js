const QRCode = require('qrcode');
const Asset = require('../models/Asset');
const logHistory = require('../utils/logHistory');
const cloudinary = require('../config/cloudinary');

const uploadAssetImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'maintainiq-assets' },
      (error, result) => (result ? resolve(result) : reject(error))
    );
    stream.end(buffer);
  });

// Create asset — admin only. Also generates QR code pointing to public asset page.
// req.file (optional) is the asset's photo, uploaded via multer memoryStorage.
const createAsset = async (req, res) => {
  try {
    const { assetCode, name, category, location, condition, nextServiceDate } = req.body;

    if (!assetCode || !name || !category || !location) {
      return res.status(400).json({ message: 'assetCode, name, category and location are required' });
    }

    const existing = await Asset.findOne({ assetCode: assetCode.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Asset code already exists' });
    }

    const publicUrl = `${process.env.FRONTEND_URL}/asset/${assetCode.trim()}`;
    const qrUrl = await QRCode.toDataURL(publicUrl);

    let imageUrl = null;
    if (req.file) {
      const result = await uploadAssetImage(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const asset = await Asset.create({
      assetCode: assetCode.trim(),
      name,
      category,
      location,
      condition,
      nextServiceDate: nextServiceDate || null,
      qrUrl,
      imageUrl
    });

    await logHistory({
      assetId: asset._id,
      actor: req.user.role + ':' + req.user.id,
      action: 'Asset registered'
    });

    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAssets = async (req, res) => {
  try {
    const { search, status, category, location, technician } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;
    if (location) query.location = location;
    if (technician) query.assignedTechnician = technician;

    const assets = await Asset.find(query).populate('assignedTechnician', 'name email').sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTechnician', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAssetByCode = async (req, res) => {
  try {
    const asset = await Asset.findOne({ assetCode: req.params.code });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUBLIC route — asset registry list for the "/" landing page, safe fields only
const getPublicAssets = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetCode: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query)
      .select('assetCode name category location status qrUrl imageUrl')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUBLIC route — only safe fields, no private data
const getPublicAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({ assetCode: req.params.code }).select(
      'assetCode name category location condition status lastServiceDate nextServiceDate imageUrl'
    );
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// req.file (optional) replaces the existing image if a new one is uploaded.
const updateAsset = async (req, res) => {
  try {
    const { assetCode, ...updates } = req.body;

    if (req.file) {
      const result = await uploadAssetImage(req.file.buffer);
      updates.imageUrl = result.secure_url;
    }

    const asset = await Asset.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    await logHistory({
      assetId: asset._id,
      actor: req.user.role + ':' + req.user.id,
      action: 'Asset details updated'
    });

    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { assignedTechnician: technicianId },
      { new: true }
    );
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    await logHistory({
      assetId: asset._id,
      actor: req.user.role + ':' + req.user.id,
      action: 'Technician assigned to asset'
    });

    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Super Admin only (enforced in the route). Deliberately does NOT touch any
// Issue documents that reference this asset — they stay as historical
// records. Issue.assetId will simply fail to populate (resolves to null)
// after this, and the frontend shows "Asset Removed" wherever that happens.
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    await logHistory({
      assetId: asset._id,
      actor: req.user.role + ':' + req.user.id,
      action: `Asset ${asset.assetCode} deleted`
    });

    await asset.deleteOne();

    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  getAssetByCode,
  getPublicAssets,
  getPublicAsset,
  updateAsset,
  assignTechnician,
  deleteAsset
};