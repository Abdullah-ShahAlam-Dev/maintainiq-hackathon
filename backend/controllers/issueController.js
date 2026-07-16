const jwt = require('jsonwebtoken');
const Issue = require('../models/Issue');
const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const logHistory = require('../utils/logHistory');
const User = require('../models/User');

// Which issue status can move to which next statuses
const ALLOWED_TRANSITIONS = {
  Reported: ['Assigned'],
  Assigned: ['Inspection Started'],
  'Inspection Started': ['Maintenance In Progress', 'Waiting for Parts'],
  'Waiting for Parts': ['Maintenance In Progress'],
  'Maintenance In Progress': ['Waiting for Parts', 'Resolved'],
  Resolved: ['Closed', 'Reopened'],
  Closed: ['Reopened'],
  Reopened: ['Assigned']
};

// Maps an issue status to what the parent Asset status should become
const ASSET_STATUS_MAP = {
  Reported: 'Issue Reported',
  'Inspection Started': 'Under Inspection',
  'Maintenance In Progress': 'Under Maintenance',
  Resolved: 'Operational'
};

// Create issue — used by both public reporting page and internal dashboard.
// Guests must prove they completed OTP verification via a signed reportToken;
// logged-in users (req.user set by optionalAuth) bypass this entirely.
const createIssue = async (req, res) => {
  try {
    const {
      assetCode,
      title,
      description,
      category,
      priority,
      reporterInfo,
      evidenceUrls,
      aiSuggested,
      aiEdited,
      reportToken
    } = req.body;

    if (!assetCode || !title || !description || !category || !priority) {
      return res.status(400).json({ message: 'assetCode, title, description, category and priority are required' });
    }

    let finalReporterInfo = reporterInfo || {};

    if (req.user) {
      // Logged-in reporter — trust the session, bypass OTP entirely.
      finalReporterInfo = {
        name: req.user.name || finalReporterInfo.name || 'Registered user',
        email: finalReporterInfo.email || '',
        phone: finalReporterInfo.phone || ''
      };
    } else {
      // Guest reporter — must present a valid, unexpired reportToken issued
      // by POST /api/public/otp/verify, and it must match the email they typed.
      if (!reportToken) {
        return res.status(403).json({ message: 'Email verification required before submitting an issue' });
      }
      if (!finalReporterInfo.email) {
        return res.status(400).json({ message: 'reporterInfo.email is required for guest reports' });
      }

      let decoded;
      try {
        decoded = jwt.verify(reportToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ message: 'Verification expired — please verify your email again' });
      }

      if (decoded.purpose !== 'guest-report' || decoded.email !== finalReporterInfo.email.toLowerCase().trim()) {
        return res.status(403).json({ message: 'Verification does not match the email provided' });
      }
    }

    const asset = await Asset.findOne({ assetCode: assetCode.trim() });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const issue = await Issue.create({
      assetId: asset._id,
      title,
      description,
      category,
      priority,
      reporterInfo: finalReporterInfo,
      evidenceUrls: evidenceUrls || [],
      aiSuggested: !!aiSuggested,
      aiEdited: !!aiEdited
    });

    asset.status = 'Issue Reported';
    await asset.save();

    await logHistory({
      assetId: asset._id,
      actor: finalReporterInfo?.name || 'Public reporter',
      action: `Issue ${issue.issueNumber} reported: ${title}`,
      relatedIssueId: issue._id
    });

    res.status(201).json(issue);
  } catch (err) {
    console.error('createIssue error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List issues — internal dashboard, supports filters
const getIssues = async (req, res) => {
  try {
    const { status, priority, category, technician, assetId, reporterEmail } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (technician) query.assignedTechnician = technician;
    if (assetId) query.assetId = assetId;
    if (reporterEmail) query['reporterInfo.email'] = reporterEmail.toLowerCase().trim();

const issues = await Issue.find(query)
  .populate('assetId', 'assetCode name location category qrUrl')
  .populate('assignedTechnician', 'name email')
  .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('assetId', 'assetCode name location category')
      .populate('assignedTechnician', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Assign a technician — admin Or adminstrator
const assignIssue = async (req, res) => {
  try {
    const { technicianId } = req.body;
    if (!technicianId) return res.status(400).json({ message: 'technicianId is required' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const actor = await User.findById(req.user.id).select('name');

    issue.assignedTechnician = technicianId;
    issue.assignedBy = actor?.name || req.user.name || 'Unknown';
    issue.status = 'Assigned';
    await issue.save();

    await logHistory({
      assetId: issue.assetId,
      actor: req.user.role + ':' + req.user.id,
      action: `Issue ${issue.issueNumber} assigned to technician`,
      relatedIssueId: issue._id
    });

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Update issue status — technician only, only if assigned to them. Validates transitions.
const updateIssueStatus = async (req, res) => {
  try {
    const { status, markOutOfService } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.status === 'Closed') {
      return res.status(400).json({ message: 'Closed issue cannot be edited until reopened' });
    }

    // Technicians may only update issues assigned to them
    if (req.user.role === 'technician') {
      if (!issue.assignedTechnician || issue.assignedTechnician.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only update issues assigned to you' });
      }
    }

    const allowedNext = ALLOWED_TRANSITIONS[issue.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({ message: `Cannot move from ${issue.status} to ${status}` });
    }

    // Business rule: cannot resolve without at least one maintenance note
    if (status === 'Resolved') {
      const hasRecord = await MaintenanceRecord.findOne({ issueId: issue._id });
      if (!hasRecord) {
        return res.status(400).json({ message: 'Add a maintenance note before resolving this issue' });
      }
    }

    issue.status = status;
    await issue.save();

    const asset = await Asset.findById(issue.assetId);
    if (asset) {
      if (markOutOfService) {
        asset.status = 'Out of Service';
      } else if (ASSET_STATUS_MAP[status]) {
        asset.status = ASSET_STATUS_MAP[status];
      }
      await asset.save();
    }

    await logHistory({
      assetId: issue.assetId,
      actor: req.user.role + ':' + req.user.id,
      action: `Issue ${issue.issueNumber} status changed to ${status}`,
      relatedIssueId: issue._id
    });

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Reopen a resolved/closed issue — admin or supervisor
const reopenIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (!['Resolved', 'Closed'].includes(issue.status)) {
      return res.status(400).json({ message: 'Only a Resolved or Closed issue can be reopened' });
    }

    issue.status = 'Reopened';
    await issue.save();

    await logHistory({
      assetId: issue.assetId,
      actor: req.user.role + ':' + req.user.id,
      action: `Issue ${issue.issueNumber} reopened`,
      relatedIssueId: issue._id
    });

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  assignIssue,
  updateIssueStatus,
  reopenIssue
};
