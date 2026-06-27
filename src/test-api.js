/**
 * Automated API Integration Test Suite
 *
 * Runs a complete sequence of HTTP calls using Axios to verify the
 * functionality of all API endpoints and business rules.
 *
 * Authentication uses Better Auth (cookie sessions). Since axios in Node does
 * not persist cookies automatically, we capture the Set-Cookie header from
 * sign-in and forward it on subsequent requests.
 */

const axios = require('axios');

const extractCookies = (res) => {
  const setCookie = res.headers['set-cookie'] || [];
  return setCookie.map((c) => c.split(';')[0]).join('; ');
};

const runTests = async (baseUrl = 'http://localhost:5000') => {
  const logs = [];
  const log = (message, status = 'info', details = null) => {
    const time = new Date().toLocaleTimeString();
    logs.push({ time, status, message, details });
    console.log(`[${status.toUpperCase()}] ${message}`);
    if (details) console.log(JSON.stringify(details, null, 2));
  };

  const client = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true, // don't throw on error status codes
  });

  log(`Starting API Integration Tests against ${baseUrl}...`);

  // Shared session cookies per user.
  let founderCookie = '';
  let collabCookie = '';
  let adminCookie = '';
  let startupId = '';
  let opportunityId = '';
  let applicationId = '';

  const founderEmail = `test.founder.${Date.now()}@example.com`;
  const collabEmail = `test.collab.${Date.now()}@example.com`;
  const adminEmail = `test.admin.${Date.now()}@example.com`;
  const password = 'Password123!';

  // Helper for cookie-authenticated requests.
  const authHeaders = (cookie) => ({ headers: { Cookie: cookie } });

  const signUp = (name, email, role) =>
    client.post('/api/auth/sign-up/email', { name, email, password, role });

  const signIn = async (email) => {
    const res = await client.post('/api/auth/sign-in/email', { email, password });
    if (res.status !== 200) throw { status: res.status, data: res.data };
    return extractCookies(res);
  };

  const testSteps = [
    {
      name: 'GET /api/health',
      fn: async () => {
        const res = await client.get('/api/health');
        if (res.status === 200 && res.data.success) {
          log('Health check endpoint is operational.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api',
      fn: async () => {
        const res = await client.get('/api');
        if (res.status === 200 && res.data === 'api is working') {
          log('API root endpoint is operational.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Register Founder',
      fn: async () => {
        const res = await signUp('Alice Founder', founderEmail, 'founder');
        if (res.status === 200 || res.status === 201) {
          log(`Founder registered: ${founderEmail}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Register Collaborator',
      fn: async () => {
        const res = await signUp('Peter Collaborator', collabEmail, 'collaborator');
        if (res.status === 200 || res.status === 201) {
          log(`Collaborator registered: ${collabEmail}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Register Admin',
      fn: async () => {
        const res = await signUp('Super Admin', adminEmail, 'admin');
        if (res.status === 200 || res.status === 201) {
          log(`Admin registered: ${adminEmail}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Login Founder',
      fn: async () => {
        founderCookie = await signIn(founderEmail);
        log('Founder logged in successfully.', 'success');
      },
    },

    {
      name: 'Login Collaborator',
      fn: async () => {
        collabCookie = await signIn(collabEmail);
        log('Collaborator logged in successfully.', 'success');
      },
    },

    {
      name: 'Login Admin',
      fn: async () => {
        adminCookie = await signIn(adminEmail);
        log('Admin logged in successfully.', 'success');
      },
    },

    {
      name: 'Get & Update Profile',
      fn: async () => {
        const meRes = await client.get('/api/auth/me', authHeaders(founderCookie));
        if (meRes.status !== 200) throw { step: 'get-me', status: meRes.status, data: meRes.data };

        const updateRes = await client.put(
          '/api/auth/update-profile',
          { bio: 'Innovating workspace solutions.', skills: ['Leadership', 'Strategy'] },
          authHeaders(founderCookie)
        );

        if (updateRes.status === 200 && updateRes.data.success) {
          log('Profile updated successfully.', 'success');
        } else {
          throw { step: 'update-profile', status: updateRes.status, data: updateRes.data };
        }
      },
    },

    {
      name: 'Create Startup (Founder)',
      fn: async () => {
        const res = await client.post(
          '/api/startups',
          {
            startup_name: 'Phoenix Innovations',
            logo: 'https://picsum.photos/200',
            industry: 'Technology',
            description: 'Rebuilding the core infrastructure of teamwork and automation.',
            funding_stage: 'Seed',
            website: 'https://phoenix.example.com',
          },
          authHeaders(founderCookie)
        );

        if (res.status === 201 && res.data.success) {
          startupId = res.data.data._id;
          log(`Startup created with ID ${startupId}. Defaults to pending status.`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Verify Startup is hidden while pending',
      fn: async () => {
        const res = await client.get('/api/startups');
        if (res.status === 200) {
          const list = res.data.data;
          const found = list.find((s) => s._id === startupId);
          if (!found) {
            log('Pending startup is correctly hidden from public listings.', 'success');
          } else {
            throw { message: 'Pending startup should not be visible in public listings.', data: list };
          }
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Approve Startup (Admin)',
      fn: async () => {
        const listRes = await client.get('/api/admin/startups?status=pending', authHeaders(adminCookie));
        if (listRes.status !== 200) throw { step: 'admin-list', status: listRes.status, data: listRes.data };

        const approveRes = await client.put(`/api/admin/startups/${startupId}/approve`, {}, authHeaders(adminCookie));
        if (approveRes.status === 200 && approveRes.data.success) {
          log(`Startup ${startupId} successfully approved by Admin.`, 'success');
        } else {
          throw { step: 'admin-approve', status: approveRes.status, data: approveRes.data };
        }
      },
    },

    {
      name: 'Verify Startup is visible after approval',
      fn: async () => {
        const res = await client.get('/api/startups');
        if (res.status === 200) {
          const list = res.data.data;
          const found = list.find((s) => s._id === startupId);
          if (found) {
            log('Approved startup is now visible in public listings.', 'success');
          } else {
            throw { message: 'Approved startup should be visible.', data: list };
          }
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/startups/featured',
      fn: async () => {
        const res = await client.get('/api/startups/featured');
        if (res.status === 200 && res.data.success) {
          log(`Featured startups fetched successfully. Count: ${res.data.data.length}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Post Opportunity (Founder)',
      fn: async () => {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        const res = await client.post(
          '/api/opportunities',
          {
            role_title: 'Senior Node.js Developer',
            required_skills: ['Node.js', 'MongoDB', 'Express'],
            work_type: 'Remote',
            commitment_level: 'Full-time',
            deadline: deadline.toISOString().split('T')[0],
            description: 'Responsible for core microservice endpoints.',
            responsibilities: ['Build APIs', 'Optimize queries'],
          },
          authHeaders(founderCookie)
        );

        if (res.status === 201 && res.data.success) {
          opportunityId = res.data.data._id;
          log(`Opportunity posted successfully (ID: ${opportunityId}).`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/opportunities/my-count',
      fn: async () => {
        const res = await client.get('/api/opportunities/my-count', authHeaders(founderCookie));
        if (res.status === 200 && res.data.success) {
          log(`Opportunity count fetched. Count: ${res.data.data.count}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/opportunities/featured',
      fn: async () => {
        const res = await client.get('/api/opportunities/featured');
        if (res.status === 200 && res.data.success) {
          log(`Featured opportunities fetched. Count: ${res.data.data.length}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Search Opportunities (Public)',
      fn: async () => {
        const res = await client.get('/api/opportunities?search=Node.js');
        if (res.status === 200 && res.data.data.length > 0) {
          log(`Opportunities search matches successfully. Found ${res.data.data.length} results.`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Apply to Opportunity (Collaborator)',
      fn: async () => {
        const res = await client.post(
          '/api/applications',
          {
            opportunity_id: opportunityId,
            motivation: 'I love Node.js and have built 5+ APIs with it.',
            portfolio_link: 'https://github.com/peterdev',
          },
          authHeaders(collabCookie)
        );

        if (res.status === 201 && res.data.success) {
          applicationId = res.data.data._id;
          log(`Application submitted (ID: ${applicationId}).`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/applications/check/:opportunityId',
      fn: async () => {
        const res = await client.get(`/api/applications/check/${opportunityId}`, authHeaders(collabCookie));
        if (res.status === 200 && res.data.success && res.data.data.hasApplied) {
          log('Check application confirmed collaborator has applied.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/applications/:id',
      fn: async () => {
        const res = await client.get(`/api/applications/${applicationId}`, authHeaders(collabCookie));
        if (res.status === 200 && res.data.success) {
          log('Application details loaded successfully by applicant.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/founder/stats',
      fn: async () => {
        const res = await client.get('/api/founder/stats', authHeaders(founderCookie));
        if (res.status === 200 && res.data.success) {
          log('Founder dashboard stats loaded successfully.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/collaborator/stats',
      fn: async () => {
        const res = await client.get('/api/collaborator/stats', authHeaders(collabCookie));
        if (res.status === 200 && res.data.success) {
          log('Collaborator dashboard stats loaded successfully.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'GET /api/stats/public',
      fn: async () => {
        const res = await client.get('/api/stats/public');
        if (res.status === 200 && res.data.success) {
          log(`Public platform stats loaded. Users: ${res.data.data.totalUsers}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'List Applications (Founder)',
      fn: async () => {
        const res = await client.get(`/api/applications/opportunity/${opportunityId}`, authHeaders(founderCookie));
        if (res.status === 200 && res.data.success && res.data.data.length > 0) {
          log(`Applications loaded successfully for opportunity. Count: ${res.data.data.length}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Accept Application (Founder)',
      fn: async () => {
        const res = await client.put(
          `/api/applications/${applicationId}/status`,
          { status: 'accepted' },
          authHeaders(founderCookie)
        );

        if (res.status === 200 && res.data.success) {
          log('Application status successfully updated to "accepted".', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Create Checkout Session (Founder)',
      fn: async () => {
        const res = await client.post('/api/payments/create-checkout-session', {}, authHeaders(founderCookie));
        if (res.status === 200 && res.data.success) {
          log(`Stripe checkout URL created: ${res.data.data.url}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Verify Premium Status (Founder)',
      fn: async () => {
        const res = await client.get('/api/payments/verify-premium', authHeaders(founderCookie));
        if (res.status === 200 && res.data.success) {
          log(`Premium status payload verified. isPremium: ${res.data.data.isPremium}`, 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Get Platform Analytics (Admin)',
      fn: async () => {
        const res = await client.get('/api/admin/analytics', authHeaders(adminCookie));
        if (res.status === 200 && res.data.success) {
          log('Admin analytics loaded successfully.', 'success');
        } else {
          throw { status: res.status, data: res.data };
        }
      },
    },

    {
      name: 'Logout All Users',
      fn: async () => {
        // Better Auth sign-out requires an Origin header (CSRF protection).
        const origin = baseUrl;
        const withOrigin = (cookie) => ({
          headers: { Cookie: cookie, Origin: origin },
        });

        const res1 = await client.post('/api/auth/sign-out', {}, withOrigin(founderCookie));
        const res2 = await client.post('/api/auth/sign-out', {}, withOrigin(collabCookie));
        const res3 = await client.post('/api/auth/sign-out', {}, withOrigin(adminCookie));

        if (res1.status === 200 && res2.status === 200 && res3.status === 200) {
          log('All users logged out successfully.', 'success');
        } else {
          throw { res1: res1.status, res2: res2.status, res3: res3.status };
        }
      },
    },
  ];

  let passedCount = 0;

  for (const step of testSteps) {
    log(`Running test: ${step.name}...`);
    try {
      await step.fn();
      passedCount++;
    } catch (err) {
      log(`Test failed: ${step.name}`, 'error', err.response ? err.response.data : err);
    }
  }

  log(`API testing complete. Passed ${passedCount}/${testSteps.length} test steps.`);
  return {
    success: passedCount === testSteps.length,
    passed: passedCount,
    total: testSteps.length,
    logs,
  };
};

if (require.main === module) {
  runTests().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = runTests;
