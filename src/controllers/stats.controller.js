const User = require('../models/User.model');
const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const Application = require('../models/Application.model');
const asyncHandler = require('../utils/asyncHandler');

exports.getPublicStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalStartups, totalOpportunities, successfulHires] = await Promise.all([
    User.countDocuments({ isBlocked: false }),
    Startup.countDocuments({ status: 'approved' }),
    Opportunity.countDocuments({ isActive: true }),
    Application.countDocuments({ status: 'accepted' }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalStartups,
      totalOpportunities,
      successfulHires,
    },
  });
});
