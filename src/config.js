// ============================================================
//  SAS DASHBOARD — CONFIG
//  Credentials are injected at build/deploy time from GitHub Actions secrets.
// ============================================================

const getSecret = (name) => {
  if (typeof window !== 'undefined' && window.__SAS_SECRETS__?.[name]) {
    return window.__SAS_SECRETS__[name];
  }

  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }

  return '';
};

const CONFIG = {
  // --- Google OAuth ---
  GOOGLE_CLIENT_ID: getSecret('GOOGLE_CLIENT_ID'),

  // Google OAuth scopes we need
  GOOGLE_SCOPES: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
  ].join(' '),

  // --- Todoist ---
  TODOIST_CLIENT_ID: getSecret('TODOIST_CLIENT_ID'),
  TODOIST_CLIENT_SECRET: getSecret('TODOIST_CLIENT_SECRET'),

  // The full URL where this dashboard is hosted
  // For local dev: 'http://localhost:8080'
  // For GitHub Pages: 'https://yourusername.github.io/sas-dashboard'
  BASE_URL: 'https://tm-droid.github.io/sas-dashboard',
};
