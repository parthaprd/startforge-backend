const mongoose = require('mongoose');
const Application = require('../models/Application.model');
const Opportunity = require('../models/Opportunity.model');
const Startup = require('../models/Startup.model');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');

const applyToOpportunity = async (user, payload) => {
  const { opportunity_id, motivation, portfolio_link } = payload;

  if (user.role !== 'collaborator') {
    throw ApiError.forbidden('Only collaborators can apply to opportunities.');
  }

  if (!mongoose.isValidObjectId(opportunity_id)) {
    throw ApiError.badRequest('Invalid opportunity id.');
  }

  const opportunity = await Opportunity.findById(opportunity_id).populate('startup_id');
  if (!opportunity) throw ApiError.notFound('Opportunity not found.');

  if (opportunity.startup_id && opportunity.startup_id.founder_email === user.email) {
    throw ApiError.forbidden('You cannot apply to your own opportunity.');
  }

  if (!opportunity.isActive) {
    throw ApiError.badRequest('This opportunity is no longer accepting applications.');
  }

  if (opportunity.deadline && new Date(opportunity.deadline) <= new Date()) {
    throw ApiError.badRequest('The deadline for this opportunity has passed.');
  }

  const existing = await Application.findOne({
    opportunity_id,
    applicant_email: user.email,
  });
  if (existing) {
    throw ApiError.conflict('You have already applied to this opportunity.');
  }

  const application = await Application.create({
    opportunity_id,
    applicant_email: user.email,
    motivation,
    portfolio_link: portfolio_link || user.portfolio || '',
  });

  await application.populate({
    path: 'opportunity_id',
    select: 'role_title work_type commitment_level startup_id',
    populate: { path: 'startup_id', select: 'startup_name logo industry' },
  });

  return application;
};

const listMyApplications = async (user, query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { applicant_email: user.email };

  const [count, docs] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .populate({
        path: 'opportunity_id',
        select: 'role_title work_type commitment_level deadline startup_id',
        populate: { path: 'startup_id', select: 'startup_name logo industry' },
      })
      .sort({ applied_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const listApplicationsForOpportunity = async (user, opportunityId, query = {}) => {
  if (!mongoose.isValidObjectId(opportunityId)) {
    throw ApiError.badRequest('Invalid opportunity id.');
  }

  const opportunity = await Opportunity.findById(opportunityId).populate('startup_id');
  if (!opportunity) throw ApiError.notFound('Opportunity not found.');

  const owns =
    opportunity.startup_id &&
    opportunity.startup_id.founder_email === user.email;
  if (!owns) {
    throw ApiError.forbidden('You can only view applications for your own opportunities.');
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { opportunity_id: opportunity._id };

  if (query.status && ['pending', 'accepted', 'rejected'].includes(query.status)) {
    filter.status = query.status;
  }

  const [count, docs] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .sort({ applied_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

const updateApplicationStatus = async (user, applicationId, status) => {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw ApiError.badRequest('Invalid application id.');
  }

  const application = await Application.findById(applicationId).populate({
    path: 'opportunity_id',
    populate: { path: 'startup_id' },
  });
  if (!application) throw ApiError.notFound('Application not found.');

  const opportunity = application.opportunity_id;
  const startup = opportunity && opportunity.startup_id;
  if (!startup || startup.founder_email !== user.email) {
    throw ApiError.forbidden('You can only manage applications for your own opportunities.');
  }

  const previousStatus = application.status;

  if (previousStatus !== 'pending') {
    throw ApiError.badRequest(
      `This application has already been ${previousStatus}.`
    );
  }

  application.status = status;
  application.reviewed_at = new Date();
  await application.save();

  if (status === 'accepted') {
    await Startup.findByIdAndUpdate(startup._id, { $inc: { team_size: 1 } });
  }

  return application;
};

const withdrawApplication = async (user, applicationId) => {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw ApiError.badRequest('Invalid application id.');
  }

  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found.');

  if (application.applicant_email !== user.email) {
    throw ApiError.forbidden('You can only withdraw your own applications.');
  }

  await application.deleteOne();
  return { id: application._id };
};

module.exports = {
  applyToOpportunity,
  listMyApplications,
  listApplicationsForOpportunity,
  updateApplicationStatus,
  withdrawApplication,
};
