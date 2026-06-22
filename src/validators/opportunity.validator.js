const { body } = require('express-validator');
const { WORK_TYPES, COMMITMENT_LEVELS } = require('../models/Opportunity.model');

const createOpportunityRules = [
  body('role_title')
    .trim()
    .notEmpty()
    .withMessage('Role title is required.')
    .isLength({ max: 100 })
    .withMessage('Role title cannot exceed 100 characters.'),

  body('required_skills')
    .notEmpty()
    .withMessage('Required skills are required.')
    .isArray({ min: 1 })
    .withMessage('At least one required skill is needed.'),

  body('required_skills.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each skill must be a non-empty string.'),

  body('work_type')
    .optional()
    .isIn(WORK_TYPES)
    .withMessage(`Work type must be one of: ${WORK_TYPES.join(', ')}.`),

  body('commitment_level')
    .optional()
    .isIn(COMMITMENT_LEVELS)
    .withMessage(
      `Commitment level must be one of: ${COMMITMENT_LEVELS.join(', ')}.`
    ),

  body('deadline')
    .notEmpty()
    .withMessage('Deadline is required.')
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be a future date.');
      }
      return true;
    }),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('responsibilities')
    .optional()
    .isArray()
    .withMessage('Responsibilities must be an array of strings.'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
];

const updateOpportunityRules = [
  body('role_title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Role title cannot exceed 100 characters.'),

  body('required_skills')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one required skill is needed.'),

  body('work_type')
    .optional()
    .isIn(WORK_TYPES)
    .withMessage(`Work type must be one of: ${WORK_TYPES.join(', ')}.`),

  body('commitment_level')
    .optional()
    .isIn(COMMITMENT_LEVELS)
    .withMessage(
      `Commitment level must be one of: ${COMMITMENT_LEVELS.join(', ')}.`
    ),

  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be a future date.');
      }
      return true;
    }),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('responsibilities')
    .optional()
    .isArray()
    .withMessage('Responsibilities must be an array of strings.'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
];

const createApplicationRules = [
  body('opportunity_id')
    .notEmpty()
    .withMessage('Opportunity id is required.')
    .isMongoId()
    .withMessage('Opportunity id must be a valid Mongo id.'),

  body('motivation')
    .trim()
    .notEmpty()
    .withMessage('Motivation is required.')
    .isLength({ max: 1000 })
    .withMessage('Motivation cannot exceed 1000 characters.'),

  body('portfolio_link')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Portfolio link must be a valid URL.'),
];

const updateApplicationStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be accepted or rejected.'),
];

module.exports = {
  createOpportunityRules,
  updateOpportunityRules,
  createApplicationRules,
  updateApplicationStatusRules,
};
