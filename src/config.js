// ============================================================
//  SAS DASHBOARD — CONFIG
//  Credentials can be injected at deploy time, with local fallbacks
//  so the dashboard still works in a static deployment.
// ============================================================

const getSecret = (name, fallback = '') => {
  if (typeof window !== 'undefined' && window.__SAS_SECRETS__?.[name]) {
    return window.__SAS_SECRETS__[name];
  }

  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }

  return fallback;
};

const CONFIG = {
  // --- Google OAuth ---
  GOOGLE_CLIENT_ID: getSecret(
    'GOOGLE_CLIENT_ID',
    '714630721151-mkhfc9505d1d1dbpv6718and2reg3eof.apps.googleusercontent.com'
  ),

  // Google OAuth scopes we need
  GOOGLE_SCOPES: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/contacts.readonly',
  ].join(' '),

  // --- Todoist ---
  TODOIST_CLIENT_ID: getSecret('TODOIST_CLIENT_ID', 'b38a1c0cee444aecae3b0474b8d29ce4'),
  TODOIST_CLIENT_SECRET: getSecret('TODOIST_CLIENT_SECRET', '931a6500a0ee44bb842e8d8caadb9e6e'),

  // The full URL where this dashboard is hosted
  // For local dev: 'http://localhost:8080'
  // For GitHub Pages: 'https://yourusername.github.io/sas-dashboard'
  BASE_URL: getSecret('BASE_URL', 'https://tm-droid.github.io/sas-dashboard'),
};
