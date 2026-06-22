const { body } = require('express-validator');
const { INDUSTRIES, FUNDING_STAGES } = require('../models/Startup.model');

const createStartupRules = [
  body('startup_name')
    .trim()
    .notEmpty()
    .withMessage('Startup name is required.')
    .isLength({ max: 100 })
    .withMessage('Startup name cannot exceed 100 characters.'),

  body('logo')
    .trim()
    .notEmpty()
    .withMessage('Logo URL is required.')
    .isURL()
    .withMessage('Logo must be a valid URL.'),

  body('industry')
    .optional()
    .isIn(INDUSTRIES)
    .withMessage(`Industry must be one of: ${INDUSTRIES.join(', ')}.`),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('funding_stage')
    .optional()
    .isIn(FUNDING_STAGES)
    .withMessage(`Funding stage must be one of: ${FUNDING_STAGES.join(', ')}.`),

  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Website must be a valid URL.'),
];

const updateStartupRules = [
  body('startup_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Startup name cannot exceed 100 characters.'),

  body('logo')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Logo must be a valid URL.'),

  body('industry')
    .optional()
    .isIn(INDUSTRIES)
    .withMessage(`Industry must be one of: ${INDUSTRIES.join(', ')}.`),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('funding_stage')
    .optional()
    .isIn(FUNDING_STAGES)
    .withMessage(`Funding stage must be one of: ${FUNDING_STAGES.join(', ')}.`),

  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Website must be a valid URL.'),
];

module.exports = {
  createStartupRules,
  updateStartupRules,
};
