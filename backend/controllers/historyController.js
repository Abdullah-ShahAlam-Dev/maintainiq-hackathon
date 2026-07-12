const History = require('../models/History');

const getHistoryByAsset = async (req, res) => {
  try {
    const history = await History.find({ assetId: req.params.assetId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getHistoryByAsset };
