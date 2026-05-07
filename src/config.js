// ============================================================
//  SAS DASHBOARD — CONFIG
//  Fill in your credentials here before opening the dashboard.
// ============================================================

const CONFIG = {
  // --- Google OAuth ---
  // 1. Go to https://console.cloud.google.com/
  // 2. Create a new project
  // 3. Enable: Gmail API, Google Calendar API
  // 4. Go to APIs & Services > Credentials > Create Credentials > OAuth client ID
  // 5. Application type: Web application
  // 6. Authorised JavaScript origins: http://localhost (for local) + your GitHub Pages URL
  // 7. Copy the Client ID here:
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Google OAuth scopes we need
  GOOGLE_SCOPES: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
  ].join(' '),

  // --- Todoist ---
  // 1. Go to https://app.todoist.com/app/settings/integrations/developer
  // 2. Create a new app
  // 3. Set redirect URI to: your site URL + /todoist-callback.html
  // 4. Copy Client ID and Client Secret here:
  TODOIST_CLIENT_ID: 'YOUR_TODOIST_CLIENT_ID',
  TODOIST_CLIENT_SECRET: 'YOUR_TODOIST_CLIENT_SECRET',

  // The full URL where this dashboard is hosted
  // For local dev: 'http://localhost:8080'
  // For GitHub Pages: 'https://yourusername.github.io/sas-dashboard'
  BASE_URL: window.location.origin,
};
