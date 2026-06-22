const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const opportunityService = require('../services/opportunity.service');
const Opportunity = require('../models/Opportunity.model');
const Startup = require('../models/Startup.model');

const listOpportunities = asyncHandler(async (req, res) => {
  const { docs, pagination } = await opportunityService.listOpportunities(req.query);
  return ApiResponse.paginated(res, 'Opportunities fetched successfully.', docs, pagination);
});

const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.getOpportunity(req.params.id);
  return ApiResponse.ok(res, 'Opportunity fetched successfully.', opportunity);
});

const createOpportunity = asyncHandler(async (req, res) => {
  if (req.user.role !== 'founder') {
    throw ApiError.forbidden('Only founders can create opportunities.');
  }
  const opportunity = await opportunityService.createOpportunity(req.user, req.body);
  return ApiResponse.created(res, 'Opportunity created successfully.', opportunity);
});

const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.updateOpportunity(req.user, req.params.id, req.body);
  return ApiResponse.ok(res, 'Opportunity updated successfully.', opportunity);
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  await opportunityService.deleteOpportunity(req.user, req.params.id);
  return ApiResponse.ok(res, 'Opportunity deleted successfully.', { id: req.params.id });
});

const listMyOpportunities = asyncHandler(async (req, res) => {
  if (req.user.role !== 'founder') {
    throw ApiError.forbidden('Only founders can access this endpoint.');
  }
  const { docs, pagination } = await opportunityService.listMyOpportunities(req.user, req.query);
  return ApiResponse.paginated(res, 'Your opportunities fetched successfully.', docs, pagination);
});

const getFeaturedOpportunities = asyncHandler(async (req, res) => {
  const opportunities = await Opportunity.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('startup_id', 'startup_name logo industry funding_stage');

  res.status(200).json({
    success: true,
    data: opportunities,
  });
});

const getMyOpportunityCount = asyncHandler(async (req, res) => {
  const startup = await Startup.findOne({ founder_email: req.user.email });

  if (!startup) {
    return res.status(200).json({
      success: true,
      data: {
        count: 0,
        isPremium: req.user.isPremium || false,
        limit: 3,
        canCreateMore: req.user.isPremium || false,
      },
    });
  }

  const count = await Opportunity.countDocuments({ startup_id: startup._id });

  const isPremium = req.user.isPremium || false;
  const limit = isPremium ? Infinity : 3;
  const canCreateMore = isPremium || count < 3;

  res.status(200).json({
    success: true,
    data: {
      count,
      isPremium,
      limit: isPremium ? 'Unlimited' : 3,
      canCreateMore,
      remaining: isPremium ? 'Unlimited' : Math.max(0, 3 - count),
    },
  });
});

module.exports = {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  listMyOpportunities,
  getFeaturedOpportunities,
  getMyOpportunityCount,
};
