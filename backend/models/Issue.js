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
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

// Pre-validate hook to assign sequential issueNumber if not present
issueSchema.pre('validate', async function (next) {
  if (this.issueNumber) return next();
  try {
    const Issue = mongoose.model('Issue');
    const lastIssue = await Issue.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNum = 1001;
    if (lastIssue && lastIssue.issueNumber) {
      const match = lastIssue.issueNumber.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    this.issueNumber = `ISS-${nextNum}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Issue', issueSchema);
