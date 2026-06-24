

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const Startup = require('./models/Startup.model');
const Opportunity = require('./models/Opportunity.model');
const Application = require('./models/Application.model');
const Payment = require('./models/Payment.model');
const connectDB = require('./config/database');
const { getAuth } = require('./config/auth');
const logger = require('./utils/logger');

// Dummy data inputs
const FOUNDER_NAMES = [
  'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt',
  'Fiona Gallagher', 'George Clark', 'Hannah Abbott', 'Ian Malcolm', 'Julia Roberts',
  'Kevin Bacon', 'Laura Croft', 'Mike Wheeler', 'Nora Allen', 'Oscar Wilde',
  'Patricia Lane', 'Quinn Harvey', 'Rachel Green', 'Samuel Adams', 'Tina Turner',
  'Uma Thurman', 'Victor Hugo', 'Wendy Williams', 'Xander Cross', 'Yasmine Saleh',
  'Zach Morris', 'Aaron Douglas', 'Beth Winters', 'Carl Sagan', 'Dana Scully',
  'Edward Scissorhands', 'Faith Connors', 'Glenn Maxwell', 'Holly Hart', 'Ivan Drago',
  'Janet Moore', 'Karl Urban', 'Lily James', 'Martin Fox', 'Nina Dobrev',
  'Oliver Queen', 'Penny Lane', 'Quentin Tarantino', 'Rose Tyler', 'Simon Cowell',
  'Tara Strong', 'Ulrich Schmidt', 'Vera Wang', 'Walter White', 'Xena Warrior'
];

const COLLAB_NAMES = [
  'Peter Parker', 'Bruce Wayne', 'Clark Kent', 'Diana Prince', 'Barry Allen',
  'Hal Jordan', 'Arthur Curry', 'Victor Stone', 'Tony Stark', 'Steve Rogers',
  'Natasha Romanoff', 'Bruce Banner', 'Wanda Maximoff', 'Vision', 'Sam Wilson',
  'Bucky Barnes', 'Scott Lang', 'Hope Van Dyne', 'Shuri Black', 'T\'Challa Udaku',
  'Stephen Strange', 'Carol Danvers', 'Nick Fury', 'Maria Hill', 'Clint Barton',
  'Pietro Maximoff', 'James Rhodes', 'Pepper Potts', 'Happy Hogan', 'Phil Coulson',
  'Daisy Johnson', 'Melinda May', 'Leo Fitz', 'Jemma Simmons', 'Lance Hunter',
  'Bobbi Morse', 'Lincoln Campbell', 'Joey Gutierrez', 'Elena Rodriguez', 'Alphonso Mackenzie',
  'Luke Cage', 'Jessica Jones', 'Matt Murdock', 'Danny Rand', 'Frank Castle',
  'Karen Page', 'Foggy Nelson', 'Claire Temple', 'Trish Walker', 'Malcolm Ducasse'
];

const ADMIN_NAMES = ['Admin Chief', 'Admin Assistant'];

const STARTUP_NAMES = [
  'ForgeTech', 'BioPulse', 'FinFlow', 'EduLearn', 'CartSwift',
  'AdSpark', 'PropHome', 'HealthSync', 'EduQuest', 'PaySafe',
  'SkyNet', 'NeuralLink', 'CyberShield', 'GreenGrid', 'SolarWave',
  'DataNova', 'CloudPeak', 'AgriSmart', 'TravelMind', 'FoodFast',
  'VoiceAI', 'BuildNow', 'MediCore', 'LegalEase', 'SportsPulse',
  'CryptoBase', 'RoboArm', 'SmartHome', 'EcoCharge', 'BlueSky',
  'TalentHub', 'ShopGenie', 'LogiTrack', 'CleanBit', 'WildPath',
  'CodeLaunch', 'SpacePath', 'PixelCraft', 'StreamNow', 'ChainLink',
  'HealBot', 'UrbanFarm', 'DevForge', 'MapQuick', 'SoundWave',
  'InvestIQ', 'SafeNet', 'VidSpark', 'LearnUp', 'FitTrack'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
  'Marketing', 'Real Estate', 'Other'
];

const FUNDING_STAGES = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Bootstrapped'
];

const ROLE_TITLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Engineer',
  'UI/UX Designer', 'Product Manager', 'Data Scientist',
  'DevOps Engineer', 'Mobile Developer (Flutter)', 'QA Engineer',
  'Growth Marketer', 'Content Writer', 'Customer Support Specialist',
  'HR Manager', 'Sales Specialist', 'Security Engineer',
  'Machine Learning Engineer', 'Blockchain Developer', 'Cloud Architect',
  'iOS Developer', 'Android Developer', 'Technical Writer',
  'Business Analyst', 'Scrum Master', 'CTO', 'CMO',
  'Brand Designer', 'Video Editor', 'Community Manager', 'Legal Counsel',
  'Finance Manager', 'Operations Manager', 'Partnerships Manager',
  'Solutions Architect', 'Database Administrator', 'AI Researcher',
  'Embedded Systems Engineer', 'AR/VR Developer', 'Game Developer',
  'Cybersecurity Analyst', 'SEO Specialist', 'Email Marketing Specialist',
  'Social Media Manager', 'Graphic Designer', 'Copywriter',
  'Supply Chain Analyst', 'Data Engineer', 'Site Reliability Engineer',
  'Network Engineer', 'IT Support Specialist', 'Research Scientist'
];

const SKILLS_LIST = [
  ['React', 'CSS', 'HTML', 'JavaScript'],
  ['Node.js', 'Express', 'MongoDB', 'Redis'],
  ['React', 'Node.js', 'MongoDB', 'Docker'],
  ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
  ['Product Strategy', 'Agile', 'Scrum', 'Jira'],
  ['Python', 'TensorFlow', 'Pandas', 'SQL'],
  ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
  ['Flutter', 'Dart', 'iOS', 'Android'],
  ['Jest', 'Cypress', 'Selenium', 'Testing'],
  ['SEO', 'Google Analytics', 'Copywriting', 'AdWords'],
  ['Blogging', 'SEO', 'Creative Writing', 'Editing'],
  ['Intercom', 'Zendesk', 'Communication', 'Troubleshooting'],
  ['Recruiting', 'Onboarding', 'Conflict Resolution'],
  ['Cold Calling', 'CRM', 'Negotiation', 'Lead Generation'],
  ['Penetration Testing', 'Cryptography', 'Network Security'],
  ['PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision'],
  ['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts'],
  ['Azure', 'GCP', 'Terraform', 'Infrastructure as Code'],
  ['Swift', 'Xcode', 'Core Data', 'ARKit'],
  ['Kotlin', 'Jetpack Compose', 'Room', 'Firebase'],
  ['Confluence', 'Technical Documentation', 'API Docs', 'Markdown'],
  ['Business Intelligence', 'Tableau', 'Power BI', 'Excel'],
  ['Agile Coaching', 'Sprint Planning', 'Retrospectives', 'Kanban'],
  ['System Design', 'Leadership', 'Architecture', 'Strategic Planning'],
  ['Brand Strategy', 'Content Marketing', 'Digital Advertising', 'Analytics'],
  ['Adobe Illustrator', 'Photoshop', 'Brand Identity', 'Typography'],
  ['Premiere Pro', 'After Effects', 'Motion Graphics', 'Storytelling'],
  ['Discord', 'Slack', 'Community Building', 'Event Management'],
  ['Contract Law', 'Intellectual Property', 'Compliance', 'Risk Management'],
  ['Financial Modeling', 'Budgeting', 'QuickBooks', 'Forecasting'],
  ['Process Optimization', 'Resource Planning', 'Vendor Management'],
  ['Business Development', 'Partnership Strategy', 'Networking'],
  ['Microservices', 'API Gateway', 'Service Mesh', 'Event-Driven Architecture'],
  ['PostgreSQL', 'MySQL', 'Redis', 'Query Optimization'],
  ['Research Methods', 'Statistical Analysis', 'Paper Writing', 'Data Collection'],
  ['RTOS', 'C/C++', 'Microcontrollers', 'Circuit Design'],
  ['Unity', 'Unreal Engine', 'WebXR', '3D Modeling'],
  ['Unity', 'C#', 'Game Design', 'Level Design'],
  ['SIEM', 'Threat Intelligence', 'Incident Response', 'Forensics'],
  ['Keyword Research', 'Link Building', 'On-Page SEO', 'Technical SEO'],
  ['Mailchimp', 'HubSpot', 'A/B Testing', 'Automation'],
  ['Instagram', 'TikTok', 'Content Calendar', 'Influencer Marketing'],
  ['CorelDraw', 'Sketch', 'Color Theory', 'Print Design'],
  ['Storytelling', 'Long-form Content', 'Brand Voice', 'Headline Writing'],
  ['ERP Systems', 'Inventory Management', 'Logistics Coordination'],
  ['Apache Spark', 'Kafka', 'Airflow', 'dbt'],
  ['Linux', 'Prometheus', 'Grafana', 'On-Call Rotation'],
  ['Cisco', 'VPN', 'Firewall', 'LAN/WAN'],
  ['Help Desk', 'Active Directory', 'Windows Server', 'Troubleshooting'],
  ['Experimentation', 'Literature Review', 'LaTeX', 'Data Visualization'],
];

const WORK_TYPES = ['Remote', 'On-site', 'Hybrid'];
const COMMITMENT_LEVELS = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const seedDatabase = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    logger.info('Resetting database...');

    // 2. Clear existing collections (including Better Auth collections)
    await User.deleteMany({});
    await Startup.deleteMany({});
    await Opportunity.deleteMany({});
    await Application.deleteMany({});
    await Payment.deleteMany({});
    const rawDb = mongoose.connection.db;
    await Promise.all(
      ['account', 'session', 'verification'].map((c) =>
        rawDb.collection(c).deleteMany({}).catch(() => {})
      )
    );
    logger.info('Database collections cleared successfully.');

    // Better Auth instance used to create credentialed users.
    const auth = await getAuth();

    // 3. Create Users
    const usersToInsert = [];
    const password = 'Password123!'; // Satisfies min 6 chars, uppercase, lowercase, special/number

    // 3.1 Founders (50)
    for (let i = 0; i < 50; i++) {
      usersToInsert.push({
        name: FOUNDER_NAMES[i],
        email: `founder${i + 1}@example.com`,
        password,
        role: 'founder',
        bio: `Hi, I am ${FOUNDER_NAMES[i]}, a passionate startup founder looking for amazing collaborators. Let's build something great together!`,
        skills: ['Leadership', 'Business Development', 'Public Speaking'],
        isPremium: i % 2 === 0, // make half of them premium
        premiumExpiresAt: i % 2 === 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
      });
    }

    // 3.2 Collaborators (50)
    for (let i = 0; i < 50; i++) {
      usersToInsert.push({
        name: COLLAB_NAMES[i],
        email: `collab${i + 1}@example.com`,
        password,
        role: 'collaborator',
        bio: `Hello! I'm ${COLLAB_NAMES[i]}, a skilled developer/designer looking for exciting opportunities.`,
        skills: SKILLS_LIST[i % SKILLS_LIST.length],
        portfolio: `https://github.com/collab${i + 1}`
      });
    }

    // 3.3 Admins (2)
    for (let i = 0; i < 2; i++) {
      usersToInsert.push({
        name: ADMIN_NAMES[i],
        email: `admin${i + 1}@example.com`,
        password,
        role: 'admin',
        bio: `Platform administrator ${i + 1}.`
      });
    }

    // Create each user through Better Auth so credentials land in the
    // `account` collection, then apply non-input fields (premium, etc.).
    const savedUsers = [];
    for (const u of usersToInsert) {
      await auth.api.signUpEmail({
        body: {
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          bio: u.bio || '',
          skills: u.skills || [],
          portfolio: u.portfolio || '',
        },
      });

      const extra = { role: u.role };
      if (u.isPremium) extra.isPremium = true;
      if (u.premiumExpiresAt) extra.premiumExpiresAt = u.premiumExpiresAt;

      const savedUser = await User.findOneAndUpdate(
        { email: u.email.toLowerCase() },
        extra,
        { new: true }
      );
      savedUsers.push(savedUser);
    }
    logger.info(`Inserted ${savedUsers.length} users (50 founders, 50 collaborators, 2 admins).`);

    // Extract users by role
    const founders = savedUsers.filter(u => u.role === 'founder');
    const collaborators = savedUsers.filter(u => u.role === 'collaborator');

    // 4. Create Startups (50 - one per founder)
    const startupsToInsert = [];
    for (let i = 0; i < 50; i++) {
      startupsToInsert.push({
        startup_name: STARTUP_NAMES[i],
        logo: `https://picsum.photos/200?random=${i}`,
        industry: INDUSTRIES[i % INDUSTRIES.length],
        description: `This is a mockup description for ${STARTUP_NAMES[i]}. We are innovating in the ${INDUSTRIES[i % INDUSTRIES.length]} space to solve complex, real-world problems. Join our team and be part of the future!`,
        funding_stage: FUNDING_STAGES[i % FUNDING_STAGES.length],
        founder_email: founders[i].email,
        status: 'approved', // All approved so they are public by default
        team_size: Math.floor(Math.random() * 20) + 1,
        website: `https://www.${STARTUP_NAMES[i].toLowerCase().replace(/\s/g, '')}.com`
      });
    }

    const savedStartups = await Startup.insertMany(startupsToInsert);
    logger.info(`Inserted ${savedStartups.length} startups.`);

    // 5. Create Opportunities (50)
    // Distribute them evenly among startups
    const opportunitiesToInsert = [];
    for (let i = 0; i < 50; i++) {
      const startup = savedStartups[i % savedStartups.length];
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30 + i); // deadline 30+ days in the future

      opportunitiesToInsert.push({
        startup_id: startup._id,
        role_title: ROLE_TITLES[i % ROLE_TITLES.length],
        required_skills: SKILLS_LIST[i % SKILLS_LIST.length],
        work_type: WORK_TYPES[i % WORK_TYPES.length],
        commitment_level: COMMITMENT_LEVELS[i % COMMITMENT_LEVELS.length],
        deadline,
        description: `We are looking for a skilled ${ROLE_TITLES[i % ROLE_TITLES.length]} to join our growing team at ${startup.startup_name}. You will be working directly on our core products and help us build scalable systems.`,
        responsibilities: [
          'Design and implement high-quality, reusable components and systems.',
          'Collaborate with product managers and other developers to build features.',
          'Review code, write tests, and maintain excellent documentation.',
          'Participate in agile ceremonies and contribute to sprint planning.',
          'Communicate progress and blockers clearly with the team.'
        ],
        isActive: true
      });
    }

    const savedOpportunities = await Opportunity.insertMany(opportunitiesToInsert);
    logger.info(`Inserted ${savedOpportunities.length} opportunities.`);

    // 6. Create Applications (50)
    // Make collaborators apply to opportunities (uniqueness constraint: opportunity_id + applicant_email)
    const applicationsToInsert = [];
    for (let i = 0; i < 50; i++) {
      const opportunity = savedOpportunities[i];
      const collaborator = collaborators[i % collaborators.length];
      const statuses = ['pending', 'accepted', 'rejected'];

      applicationsToInsert.push({
        opportunity_id: opportunity._id,
        applicant_email: collaborator.email,
        portfolio_link: collaborator.portfolio,
        motivation: `I am highly motivated to apply for the ${opportunity.role_title} role. I have extensive experience in ${opportunity.required_skills.join(', ')} and would love to contribute to your startup's success. I believe my background uniquely positions me to add value from day one.`,
        status: statuses[i % statuses.length],
        applied_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // applied in past
        reviewed_at: i % 3 !== 0 ? new Date() : null // Some reviewed, some not
      });
    }

    const savedApplications = await Application.insertMany(applicationsToInsert);
    logger.info(`Inserted ${savedApplications.length} applications.`);

    // 7. Create Payments (50)
    // Generate payments for founders
    const paymentsToInsert = [];
    const packageTypes = ['premium_monthly', 'premium_quarterly', 'premium_yearly'];
    const amounts = { premium_monthly: 29.00, premium_quarterly: 79.00, premium_yearly: 249.00 };

    for (let i = 0; i < 50; i++) {
      const founder = founders[i % founders.length];
      const pkg = packageTypes[i % packageTypes.length];
      paymentsToInsert.push({
        user_email: founder.email,
        amount: amounts[pkg],
        currency: 'usd',
        transaction_id: `ch_mock_stripe_${Math.random().toString(36).substr(2, 9)}`,
        payment_status: 'succeeded',
        package_type: pkg,
        paid_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      });
    }

    const savedPayments = await Payment.insertMany(paymentsToInsert);
    logger.info(`Inserted ${savedPayments.length} payment records.`);

    logger.info('🎉 Database successfully seeded with 50 dummy records for all sections!');
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed.');
  }
};

// Execute if run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
