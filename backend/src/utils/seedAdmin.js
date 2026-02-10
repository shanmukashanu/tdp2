const User = require('../models/User');

async function ensureSeedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';
  const name = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!email || !password) return;

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.createAdmin({ name, email, password });
}

module.exports = { ensureSeedAdmin };
