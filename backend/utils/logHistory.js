const History = require('../models/History');

const logHistory = async ({ assetId, actor, action, relatedIssueId = null }) => {
  try {
    await History.create({ assetId, actor, action, relatedIssueId });
  } catch (err) {
    console.error('History log failed:', err.message);
  }
};

module.exports = logHistory;
