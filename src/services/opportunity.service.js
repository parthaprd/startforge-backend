const mongoose = require('mongoose');
const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');

const FREE_OPPORTUNITY_LIMIT = 3;

const countFounderOpportunities = async (founderEmail) => {
  const startupIds = await Startup.find({ founder_email: founderEmail }).distinct('_id');
  if (!startupIds.length) return 0;
  return Opportunity.countDocuments({ startup_id: { $in: startupIds } });
};

const assertCanCreateOpportunity = async (user) => {
  if (!user.hasActivePremium) {
    const count = await countFounderOpportunities(user.email);
    if (count >= FREE_OPPORTUNITY_LIMIT) {
      throw ApiError.forbidden(
        'Upgrade to premium to post more than 3 opportunities.'
      );
    }
  }
};

const listOpportunities = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const approvedStartups = await Startup.find({ status: 'approved' }).distinct('_id');
  if (!approvedStartups.length) {
    return { docs: [], pagination: buildPagination(0, page, limit) };
  }

  const filter = {
    startup_id: { $in: approvedStartups },
    isActive: true,
  };

  const search = query.search?.trim();
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { role_title: { $regex: esc, $options: 'i' } },
      { required_skills: { $regex: esc, $options: 'i' } },
      { description: { $regex: esc, $options: 'i' } },
    ];
  }

  if (query.work_type) {
    filter.work_type = { $in: String(query.work_type).split(',').map((s) => s.trim()).filter(Boolean) };
  }
  if (query.commitment_level) {
    filter.commitment_level = {
      $in: String(query.commitment_level).split(',').map((s) => s.trim()).filter(Boolean),
    };
  }

  if (query.skills) {
    const skills = String(query.skills).split(',').map((s) => s.trim()).filter(Boolean);
    if (skills.length) {
      filter.required_skills = {
        ...(filter.required_skills || {}),
        $in: skills,
      };
    }
  }

  if (query.industry) {
    const industries = String(query.industry).split(',').map((s) => s.trim()).filter(Boolean);
    const industryStartups = await Startup.find({
      status: 'approved',
      industry: { $in: industries },
    }).distinct('_id');
    const intersection = industryStartups.filter((id) =>
      approvedStartups.some((sid) => sid.equals(id))
    );
    filter.startup_id = { $in: intersection.length ? intersection : [null] };
  }

  const [count, docs] = await Promise.all([
    Opportunity.countDocuments(filter),
    Opportunity.find(filter)
      .populate('startup_id', 'startup_name logo industry funding_stage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const getOpportunity = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid opportunity id.');
  }
  const opportunity = await Opportunity.findById(id).populate(
    'startup_id',
    'startup_name logo industry funding_stage website status'
  );

  if (!opportunity) throw ApiError.notFound('Opportunity not found.');

  const startup = opportunity.startup_id;
  if (startup && startup.status && startup.status !== 'approved') {
    throw ApiError.notFound('Opportunity not found.');
  }

  return opportunity;
};

const createOpportunity = async (user, payload) => {
  const startup = await Startup.findOne({ founder_email: user.email });
  if (!startup) {
    throw ApiError.notFound('You must create a startup before posting opportunities.');
  }
  if (startup.status !== 'approved') {
    throw ApiError.forbidden(
      'Your startup must be approved before you can post opportunities.'
    );
  }

  await assertCanCreateOpportunity(user);

  const opportunity = await Opportunity.create({
    ...payload,
    startup_id: startup._id,
  });

  return opportunity.populate('startup_id', 'startup_name logo industry funding_stage');
};

const updateOpportunity = async (user, id, payload) => {
  const opportunity = await Opportunity.findById(id).populate('startup_id');
  if (!opportunity) throw ApiError.notFound('Opportunity not found.');

  const owns =
    opportunity.startup_id &&
    opportunity.startup_id.founder_email === user.email;
  if (!owns) {
    throw ApiError.forbidden('You can only update your own opportunities.');
  }

  delete payload.startup_id;

  Object.assign(opportunity, payload);
  await opportunity.save();
  return opportunity.populate('startup_id', 'startup_name logo industry funding_stage');
};

const deleteOpportunity = async (user, id) => {
  const opportunity = await Opportunity.findById(id).populate('startup_id');
  if (!opportunity) throw ApiError.notFound('Opportunity not found.');

  const owns =
    opportunity.startup_id &&
    opportunity.startup_id.founder_email === user.email;
  if (!owns) {
    throw ApiError.forbidden('You can only delete your own opportunities.');
  }

  await Promise.all([
    Application.deleteMany({ opportunity_id: opportunity._id }),
    opportunity.deleteOne(),
  ]);

  return { id: opportunity._id };
};

const listMyOpportunities = async (user, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const startupIds = await Startup.find({ founder_email: user.email }).distinct('_id');
  if (!startupIds.length) {
    return { docs: [], pagination: buildPagination(0, page, limit) };
  }

  const filter = { startup_id: { $in: startupIds } };

  const [count, docs] = await Promise.all([
    Opportunity.countDocuments(filter),
    Opportunity.find(filter)
      .populate('startup_id', 'startup_name logo industry funding_stage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

module.exports = {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  listMyOpportunities,
  countFounderOpportunities,
  assertCanCreateOpportunity,
  FREE_OPPORTUNITY_LIMIT,
};
