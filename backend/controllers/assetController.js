const QRCode = require('qrcode');
const Asset = require('../models/Asset');
const logHistory = require('../utils/logHistory');

// Create asset — admin only. Also generates QR code pointing to public asset page.
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

    const asset = await Asset.create({
      assetCode: assetCode.trim(),
      name,
      category,
      location,
      condition,
      nextServiceDate: nextServiceDate || null,
      qrUrl
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

// PUBLIC route — only safe fields, no private data
const getPublicAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({ assetCode: req.params.code }).select(
      'assetCode name category location condition status lastServiceDate nextServiceDate'
    );
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateAsset = async (req, res) => {
  try {
    const { assetCode, ...updates } = req.body;
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

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  getAssetByCode,
  getPublicAsset,
  updateAsset,
  assignTechnician
};
