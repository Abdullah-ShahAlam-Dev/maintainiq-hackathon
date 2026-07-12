const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    relatedIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', historySchema);
