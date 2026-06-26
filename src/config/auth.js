/**
 * Better Auth instance (lazy, singleton).
 *
 * `better-auth` is ESM-only, so in this CommonJS project we load it via
 * dynamic import(). The MongoDB adapter reuses the *same* MongoClient that
 * Mongoose already opened (mongoose.connection.getClient()) so we never open
 * a second connection pool. Because that client only exists after connectDB()
 * has run, the instance is built lazily on first use (request time).
 *
 * The Better Auth handler is mounted at /api/auth/* (see src/app.js) and owns
 * the `user`, `account`, `session` and `verification` collections. The
 * Mongoose `User` model is pinned to the same `user` collection so the rest
 * of the app keeps querying users normally (see src/models/User.model.js).
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

let authInstance = null;
let initPromise = null;

const parseList = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const buildAuth = async () => {
  const { betterAuth } = await import('better-auth');
  const { mongodbAdapter } = await import('better-auth/adapters/mongodb');

  const client = mongoose.connection.getClient();
  if (!client) {
    throw new Error('Cannot initialise Better Auth: MongoDB is not connected yet.');
  }
  const db = client.db(process.env.DB_NAME || 'startupforge');

  const secret =
    process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    logger.warn(
      'BETTER_AUTH_SECRET (or JWT_SECRET) is not set. Set one in production for secure sessions.'
    );
  }

  const baseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.APP_URL ||
    `http://localhost:${process.env.PORT || 5000}`;

  const trustedOrigins = parseList(
    process.env.TRUSTED_ORIGINS || process.env.CLIENT_URL
  );

  const socialProviders = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  } else {
    logger.warn(
      'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set. Google sign-in is disabled.'
    );
  }

  const isProd = process.env.NODE_ENV === 'production';

  const auth = betterAuth({
    baseURL,
    secret,
    database: mongodbAdapter(db),
    ...(trustedOrigins.length ? { trustedOrigins } : {}),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 6,
    },
    socialProviders,
    // Custom application fields kept on the user document so RBAC, premium and
    // profile logic continue to work exactly as before.
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'collaborator',
          input: true,
        },
        isBlocked: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
        },
        isPremium: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
        },
        premiumExpiresAt: {
          type: 'date',
          required: false,
          input: false,
        },
        bio: { type: 'string', required: false, input: true },
        skills: { type: 'string[]', required: false, input: true },
        portfolio: { type: 'string', required: false, input: true },
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        path: '/',
      },
    },
  });

  logger.info('\u2705 Better Auth initialised.');
  return auth;
};

/**
 * Returns the cached Better Auth instance, building it on first call.
 * Safe to call concurrently – only one build runs.
 */
const getAuth = async () => {
  if (authInstance) return authInstance;
  if (!initPromise) {
    initPromise = buildAuth()
      .then((instance) => {
        authInstance = instance;
        return instance;
      })
      .catch((err) => {
        initPromise = null; // allow retry on next request
        throw err;
      });
  }
  return initPromise;
};

module.exports = { getAuth };
