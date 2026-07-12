const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, required: true },
    partsUsed: { type: [String], default: [] },
    cost: { type: Number, required: true, min: [0, 'Cost must be greater than or equal to 0'] },
    timeSpent: { type: Number, required: true }, // in minutes
    evidenceUrls: { type: [String], default: [] },
    finalCondition: { type: String, default: 'Good' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
