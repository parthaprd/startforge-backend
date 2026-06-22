const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const Application = require('../models/Application.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.getFounderStats = asyncHandler(async (req, res) => {
  const startup = await Startup.findOne({ founder_email: req.user.email });

  if (!startup) {
    return res.status(200).json({
      success: true,
      data: {
        totalOpportunities: 0,
        totalApplications: 0,
        acceptedMembers: 0,
        pendingReviews: 0,
        recentApplications: [],
      },
    });
  }

  const opportunities = await Opportunity.find({ startup_id: startup._id });
  const opportunityIds = opportunities.map(opp => opp._id);

  const totalApplications = await Application.countDocuments({
    opportunity_id: { $in: opportunityIds },
  });

  const acceptedMembers = await Application.countDocuments({
    opportunity_id: { $in: opportunityIds },
    status: 'accepted',
  });

  const pendingReviews = await Application.countDocuments({
    opportunity_id: { $in: opportunityIds },
    status: 'pending',
  });

  const recentApplications = await Application.find({
    opportunity_id: { $in: opportunityIds },
  })
    .sort({ applied_at: -1 })
    .limit(5)
    .populate('opportunity_id', 'role_title')
    .select('applicant_email status applied_at');

  res.status(200).json({
    success: true,
    data: {
      totalOpportunities: opportunities.length,
      totalApplications,
      acceptedMembers,
      pendingReviews,
      recentApplications,
    },
  });
});

exports.getCollaboratorStats = asyncHandler(async (req, res) => {
  const totalApplications = await Application.countDocuments({
    applicant_email: req.user.email,
  });

  const pendingApplications = await Application.countDocuments({
    applicant_email: req.user.email,
    status: 'pending',
  });

  const acceptedApplications = await Application.countDocuments({
    applicant_email: req.user.email,
    status: 'accepted',
  });

  const rejectedApplications = await Application.countDocuments({
    applicant_email: req.user.email,
    status: 'rejected',
  });

  const recentApplications = await Application.find({
    applicant_email: req.user.email,
  })
    .sort({ applied_at: -1 })
    .limit(5)
    .populate({
      path: 'opportunity_id',
      select: 'role_title',
      populate: { path: 'startup_id', select: 'startup_name' },
    })
    .select('status applied_at');

  res.status(200).json({
    success: true,
    data: {
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      recentApplications,
    },
  });
});
