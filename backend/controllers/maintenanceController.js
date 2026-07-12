const MaintenanceRecord = require('../models/MaintenanceRecord');
const Issue = require('../models/Issue');
const Asset = require('../models/Asset');
const logHistory = require('../utils/logHistory');

// Create a maintenance record — technician only, must be assigned to the issue
const createMaintenanceRecord = async (req, res) => {
  try {
    const { issueId, notes, partsUsed, cost, timeSpent, evidenceUrls, finalCondition, nextServiceDate } = req.body;

    if (!issueId || !notes || cost === undefined || timeSpent === undefined) {
      return res.status(400).json({ message: 'issueId, notes, cost and timeSpent are required' });
    }

    if (cost < 0) {
      return res.status(400).json({ message: 'Cost cannot be negative' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (req.user.role === 'technician') {
      if (!issue.assignedTechnician || issue.assignedTechnician.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only add maintenance notes for issues assigned to you' });
      }
    }

    const record = await MaintenanceRecord.create({
      issueId,
      technicianId: req.user.id,
      notes,
      partsUsed: partsUsed || [],
      cost,
      timeSpent,
      evidenceUrls: evidenceUrls || [],
      finalCondition: finalCondition || 'Good'
    });

    // Optionally update asset service dates
    const asset = await Asset.findById(issue.assetId);
    if (asset) {
      const completionDate = new Date();
      if (nextServiceDate) {
        const nextDate = new Date(nextServiceDate);
        if (nextDate < completionDate) {
          return res.status(400).json({ message: 'Next service date cannot be before the maintenance completion date' });
        }
        asset.nextServiceDate = nextDate;
      }
      asset.lastServiceDate = completionDate;
      asset.condition = finalCondition || asset.condition;
      await asset.save();
    }

    await logHistory({
      assetId: issue.assetId,
      actor: req.user.role + ':' + req.user.id,
      action: `Maintenance recorded for issue ${issue.issueNumber}`,
      relatedIssueId: issue._id
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getRecordsByIssue = async (req, res) => {
  try {
    const records = await MaintenanceRecord.find({ issueId: req.params.issueId })
      .populate('technicianId', 'name email')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createMaintenanceRecord, getRecordsByIssue };
