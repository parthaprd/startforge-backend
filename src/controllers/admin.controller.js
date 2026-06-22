const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');
const User = require('../models/User.model');
const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const Payment = require('../models/Payment.model');

const listUsers = asyncHandler(async (req, res) => {
  const { docs, pagination } = await adminService.listUsers(req.query);
  return ApiResponse.paginated(res, 'Users fetched successfully.', docs, pagination);
});

const blockUser = asyncHandler(async (req, res) => {
  const user = await adminService.blockUser(req.params.id);
  return ApiResponse.ok(res, 'User blocked successfully.', { id: user._id, isBlocked: true });
});

const unblockUser = asyncHandler(async (req, res) => {
  const user = await adminService.unblockUser(req.params.id);
  return ApiResponse.ok(res, 'User unblocked successfully.', { id: user._id, isBlocked: false });
});

const listStartups = asyncHandler(async (req, res) => {
  const { docs, pagination } = await adminService.listStartups(req.query);
  return ApiResponse.paginated(res, 'Startups fetched successfully.', docs, pagination);
});

const approveStartup = asyncHandler(async (req, res) => {
  const startup = await adminService.approveStartup(req.params.id);
  return ApiResponse.ok(res, 'Startup approved successfully.', startup);
});

const rejectStartup = asyncHandler(async (req, res) => {
  const startup = await adminService.rejectStartup(req.params.id);
  return ApiResponse.ok(res, 'Startup rejected successfully.', startup);
});

const deleteStartup = asyncHandler(async (req, res) => {
  await adminService.deleteStartup(req.params.id);
  return ApiResponse.ok(res, 'Startup deleted successfully.', { id: req.params.id });
});

const listTransactions = asyncHandler(async (req, res) => {
  const { docs, pagination } = await adminService.listTransactions(req.query);
  return ApiResponse.paginated(res, 'Transactions fetched successfully.', docs, pagination);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStartups,
    totalOpportunities,
    totalRevenue,
  ] = await Promise.all([
    User.countDocuments(),
    Startup.countDocuments(),
    Opportunity.countDocuments(),
    Payment.aggregate([
      { $match: { payment_status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const usersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $count: {} } } },
  ]);

  const startupsByIndustry = await Startup.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$industry', count: { $count: {} } } },
  ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role createdAt');

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalStartups,
      totalOpportunities,
      totalRevenue: totalRevenue[0]?.total || 0,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      startupsByIndustry: startupsByIndustry.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentUsers,
    },
  });
});

module.exports = {
  listUsers,
  blockUser,
  unblockUser,
  listStartups,
  approveStartup,
  rejectStartup,
  deleteStartup,
  listTransactions,
  getAnalytics,
};
