const User = require('../models/User.model');
const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const Application = require('../models/Application.model');
const Payment = require('../models/Payment.model');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');

const listUsers = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};
  if (query.role && ['founder', 'collaborator', 'admin'].includes(query.role)) {
    filter.role = query.role;
  }
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }
  if (query.isBlocked !== undefined) {
    filter.isBlocked = String(query.isBlocked) === 'true';
  }

  const [count, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const blockUser = async (id) => {
  const user = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true });
  if (!user) throw ApiError.notFound('User not found.');
  return user;
};

const unblockUser = async (id) => {
  const user = await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true });
  if (!user) throw ApiError.notFound('User not found.');
  return user;
};

const listStartups = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.industry) filter.industry = query.industry;
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { startup_name: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  const [count, docs] = await Promise.all([
    Startup.countDocuments(filter),
    Startup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const approveStartup = async (id) => {
  const startup = await Startup.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  if (!startup) throw ApiError.notFound('Startup not found.');
  return startup;
};

const rejectStartup = async (id) => {
  const startup = await Startup.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
  if (!startup) throw ApiError.notFound('Startup not found.');
  return startup;
};

const deleteStartup = async (id) => {
  const startup = await Startup.findById(id);
  if (!startup) throw ApiError.notFound('Startup not found.');

  const oppIds = await Opportunity.find({ startup_id: startup._id }).distinct('_id');
  if (oppIds.length) {
    await Application.deleteMany({ opportunity_id: { $in: oppIds } });
    await Opportunity.deleteMany({ _id: { $in: oppIds } });
  }
  await startup.deleteOne();
  return { id: startup._id };
};

const listTransactions = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};
  if (query.payment_status) filter.payment_status = query.payment_status;
  if (query.user_email) filter.user_email = String(query.user_email).toLowerCase();

  const [count, docs] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const getAnalytics = async () => {
  const [
    totalUsers,
    founders,
    collaborators,
    admins,
    blockedUsers,
    premiumUsers,
    totalStartups,
    pendingStartups,
    approvedStartups,
    rejectedStartups,
    totalOpportunities,
    activeOpportunities,
    totalApplications,
    pendingApplications,
    acceptedApplications,
    rejectedApplications,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'founder' }),
    User.countDocuments({ role: 'collaborator' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ isPremium: true }),
    Startup.countDocuments(),
    Startup.countDocuments({ status: 'pending' }),
    Startup.countDocuments({ status: 'approved' }),
    Startup.countDocuments({ status: 'rejected' }),
    Opportunity.countDocuments(),
    Opportunity.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    Application.countDocuments({ status: 'accepted' }),
    Application.countDocuments({ status: 'rejected' }),
    Payment.aggregate([
      { $match: { payment_status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const revenue = revenueAgg[0] || { total: 0, count: 0 };

  return {
    users: {
      total: totalUsers,
      founders,
      collaborators,
      admins,
      blocked: blockedUsers,
      premium: premiumUsers,
    },
    startups: {
      total: totalStartups,
      pending: pendingStartups,
      approved: approvedStartups,
      rejected: rejectedStartups,
    },
    opportunities: {
      total: totalOpportunities,
      active: activeOpportunities,
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      accepted: acceptedApplications,
      rejected: rejectedApplications,
    },
    revenue: {
      total: revenue.total,
      currency: 'usd',
      successfulPayments: revenue.count,
    },
  };
};

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
