const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const Application = require('../models/Application.model');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');

const listApprovedStartups = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { status: 'approved' };

  const search = query.search?.trim();
  if (search) {
    filter.$or = [
      { startup_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (query.industry) filter.industry = query.industry;
  if (query.funding_stage) filter.funding_stage = query.funding_stage;

  const [count, docs] = await Promise.all([
    Startup.countDocuments(filter),
    Startup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const getStartup = async (id, { requireApproved = true } = {}) => {
  const startup = await Startup.findById(id);
  if (!startup) throw ApiError.notFound('Startup not found.');
  if (requireApproved && startup.status !== 'approved') {
    throw ApiError.notFound('Startup not found.');
  }
  return startup;
};

const getMyStartup = async (founderEmail) => {
  const startup = await Startup.findOne({ founder_email: founderEmail });
  if (!startup) throw ApiError.notFound('You do not have a startup yet.');
  return startup;
};

const createStartup = async (founderEmail, payload) => {
  const existing = await Startup.findOne({ founder_email: founderEmail });
  if (existing) {
    throw ApiError.conflict('You already have a startup. A founder can only create one.');
  }

  const startup = await Startup.create({
    ...payload,
    founder_email: founderEmail,
    status: 'pending',
  });

  return startup;
};

const updateStartup = async (founderEmail, id, payload) => {
  const startup = await Startup.findById(id);
  if (!startup) throw ApiError.notFound('Startup not found.');

  if (startup.founder_email !== founderEmail) {
    throw ApiError.forbidden('You can only update your own startup.');
  }

  delete payload.status;
  delete payload.founder_email;

  Object.assign(startup, payload);
  await startup.save();
  return startup;
};

const deleteStartup = async (founderEmail, id) => {
  const startup = await Startup.findById(id);
  if (!startup) throw ApiError.notFound('Startup not found.');

  if (startup.founder_email !== founderEmail) {
    throw ApiError.forbidden('You can only delete your own startup.');
  }

  const oppIds = await Opportunity.find({ startup_id: startup._id }).distinct('_id');
  if (oppIds.length) {
    await Application.deleteMany({ opportunity_id: { $in: oppIds } });
    await Opportunity.deleteMany({ _id: { $in: oppIds } });
  }

  await startup.deleteOne();
  return { id: startup._id };
};

module.exports = {
  listApprovedStartups,
  getStartup,
  getMyStartup,
  createStartup,
  updateStartup,
  deleteStartup,
};
