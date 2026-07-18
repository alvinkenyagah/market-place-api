const Report = require('../models/Report');
const User = require('../models/User');

// @desc    Create a violation report against a service provider
// @route   POST /api/reports
// @access  Private (Customer Only)
exports.createReport = async (req, res, next) => {
  try {
    const { providerId, reason, description } = req.body;
    const reporterId = req.user._id;

    if (!providerId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Verify self-reporting boundaries
    if (String(providerId) === String(reporterId)) {
      return res.status(400).json({ success: false, message: 'You cannot file a report against yourself.' });
    }

    // Check if the target provider exists
    const providerExists = await User.findOne({ _id: providerId, role: 'provider' });
    if (!providerExists) {
      return res.status(404).json({ success: false, message: 'Target service provider not found.' });
    }

    // Check for existing duplicate records
    const duplicate = await Report.findOne({ reporterId, providerId });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'You have already submitted a compliance ticket for this provider.' });
    }

    const report = await Report.create({
      reporterId,
      providerId,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully for administrative evaluation.',
      report
    });
  } catch (error) {
    next(error);
  }
};