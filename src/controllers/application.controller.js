const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const applicationService = require('../services/application.service');
const Application = require('../models/Application.model');
const Opportunity = require('../models/Opportunity.model');
const ApiError = require('../utils/ApiError');

const apply = asyncHandler(async (req, res) => {
  const application = await applicationService.applyToOpportunity(req.user, req.body);
  return ApiResponse.created(res, 'Application submitted successfully.', application);
});

const listMyApplications = asyncHandler(async (req, res) => {
  const { docs, pagination } = await applicationService.listMyApplications(req.user, req.query);
  return ApiResponse.paginated(res, 'Your applications fetched successfully.', docs, pagination);
});

const listForOpportunity = asyncHandler(async (req, res) => {
  const { docs, pagination } = await applicationService.listApplicationsForOpportunity(
    req.user,
    req.params.id,
    req.query
  );
  return ApiResponse.paginated(res, 'Applications fetched successfully.', docs, pagination);
});

const updateStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(
    req.user,
    req.params.id,
    req.body.status
  );
  return ApiResponse.ok(res, `Application ${req.body.status}.`, application);
});

const withdraw = asyncHandler(async (req, res) => {
  await applicationService.withdrawApplication(req.user, req.params.id);
  return ApiResponse.ok(res, 'Application withdrawn successfully.', { id: req.params.id });
});

const checkApplication = asyncHandler(async (req, res) => {
  const { opportunityId } = req.params;

  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new ApiError(404, 'Opportunity not found');
  }

  const application = await Application.findOne({
    opportunity_id: opportunityId,
    applicant_email: req.user.email,
  }).populate('opportunity_id', 'role_title');

  res.status(200).json({
    success: true,
    data: {
      hasApplied: !!application,
      application: application || null,
    },
  });
});

const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('opportunity_id')
    .populate({
      path: 'opportunity_id',
      populate: { path: 'startup_id' },
    });

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  const isApplicant = application.applicant_email === req.user.email;
  const isFounder = application.opportunity_id?.startup_id?.founder_email === req.user.email;
  const isAdmin = req.user.role === 'admin';

  if (!isApplicant && !isFounder && !isAdmin) {
    throw new ApiError(403, 'Not authorized to view this application');
  }

  res.status(200).json({
    success: true,
    data: application,
  });
});

module.exports = {
  apply,
  listMyApplications,
  listForOpportunity,
  updateStatus,
  withdraw,
  checkApplication,
  getApplicationById,
};
