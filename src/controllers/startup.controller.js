const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const startupService = require('../services/startup.service');
const Startup = require('../models/Startup.model');

const listStartups = asyncHandler(async (req, res) => {
  const { docs, pagination } = await startupService.listApprovedStartups(req.query);
  return ApiResponse.paginated(res, 'Startups fetched successfully.', docs, pagination);
});

const getStartup = asyncHandler(async (req, res) => {
  const startup = await startupService.getStartup(req.params.id);
  return ApiResponse.ok(res, 'Startup fetched successfully.', startup);
});

const getMyStartup = asyncHandler(async (req, res) => {
  if (req.user.role !== 'founder') {
    throw ApiError.forbidden('Only founders can access this endpoint.');
  }
  const startup = await startupService.getMyStartup(req.user.email);
  return ApiResponse.ok(res, 'Your startup.', startup);
});

const createStartup = asyncHandler(async (req, res) => {
  if (req.user.role !== 'founder') {
    throw ApiError.forbidden('Only founders can create startups.');
  }
  const startup = await startupService.createStartup(req.user.email, req.body);
  return ApiResponse.created(res, 'Startup created. Pending admin approval.', startup);
});

const updateStartup = asyncHandler(async (req, res) => {
  const startup = await startupService.updateStartup(req.user.email, req.params.id, req.body);
  return ApiResponse.ok(res, 'Startup updated successfully.', startup);
});

const deleteStartup = asyncHandler(async (req, res) => {
  await startupService.deleteStartup(req.user.email, req.params.id);
  return ApiResponse.ok(res, 'Startup deleted successfully.', { id: req.params.id });
});

const getFeaturedStartups = asyncHandler(async (req, res) => {
  const startups = await Startup.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(6)
    .select('startup_name logo industry funding_stage team_size createdAt');

  res.status(200).json({
    success: true,
    data: startups,
  });
});

module.exports = {
  listStartups,
  getStartup,
  getMyStartup,
  createStartup,
  updateStartup,
  deleteStartup,
  getFeaturedStartups,
};
