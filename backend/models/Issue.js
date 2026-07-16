const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    issueNumber: { type: String, required: true, unique: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
    status: {
      type: String,
      enum: [
        'Reported',
        'Assigned',
        'Inspection Started',
        'Maintenance In Progress',
        'Waiting for Parts',
        'Resolved',
        'Closed',
        'Reopened'
      ],
      default: 'Reported'
    },
    reporterInfo: {
      name: { type: String, default: 'Anonymous' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    evidenceUrls: { type: [String], default: [] },
    aiSuggested: { type: Boolean, default: false },
    aiEdited: { type: Boolean, default: false },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedBy: { type: String, default: null }, // name of the admin/superadmin who assigned it
  },
  { timestamps: true }
);

// Collision-safe issue number — timestamp + random suffix instead of
// "find last + 1" (which races when two reports are submitted close together)
issueSchema.pre('validate', function () {
  if (!this.issueNumber) {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  this.issueNumber = `ISS-${stamp}${rand}`;
  }
});

module.exports = mongoose.model('Issue', issueSchema);
