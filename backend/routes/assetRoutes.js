const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const {
  createAsset,
  getAssets,
  getAssetById,
  getAssetByCode,
  updateAsset,
  assignTechnician,
  deleteAsset
} = require('../controllers/assetController');

// All these routes require login (internal dashboard use)
router.post('/', protect, allowRoles('admin'), createAsset);
router.get('/', protect, getAssets);
router.get('/code/:code', protect, getAssetByCode);
router.get('/:id', protect, getAssetById);
router.put('/:id', protect, allowRoles('admin'), updateAsset); // admin + superadmin
router.put('/:id/assign', protect, allowRoles('admin'), assignTechnician);
router.delete('/:id', protect, allowRoles('superadmin'), deleteAsset); // superadmin ONLY

module.exports = router;