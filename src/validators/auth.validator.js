const { body } = require('express-validator');

const PASSWORD_RULES = [
  'Password must be at least 6 characters and contain at least one uppercase letter and one lowercase letter.',
];

const passwordChain = () =>
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.');

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail(),

  passwordChain().if((value, { req }) => !req.body.googleId),

  body('googleId').optional().isString().trim(),

  body('role')
    .optional()
    .isIn(['founder', 'collaborator', 'admin'])
    .withMessage('Role must be founder, collaborator or admin.'),

  body('image').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL.'),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters.'),

  body('portfolio')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Portfolio must be a valid URL.'),

  body('skills').optional().isArray().withMessage('Skills must be an array of strings.'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail(),

  body('password')
    .if((value, { req }) => !req.body.googleId)
    .notEmpty()
    .withMessage('Password is required.'),
];

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters.'),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters.'),

  body('skills').optional().isArray().withMessage('Skills must be an array.'),

  body('portfolio')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Portfolio must be a valid URL.'),

  body('image').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL.'),
];

module.exports = {
  registerRules,
  loginRules,
  updateProfileRules,
  passwordChain,
  PASSWORD_RULES,
};
