# SAS Dashboard

A personal dashboard for Singapore American School students. Shows your Google Calendar events, Gmail inbox, and Todoist tasks — all in one place. Set it as your homepage or use the Chrome extension to open it on every new tab.

---

## Setup

### 1. Host the site

The easiest free option is **GitHub Pages**:

1. Fork or clone this repo
2. Go to Settings → Pages → Source: Deploy from branch → `main` → `/ (root)`
3. Your site will be live at `https://yourusername.github.io/sas-dashboard`

For local testing, use [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) or run:
```bash
npx serve .
```

---

### 2. Google API credentials

You need a Google Cloud project to use Gmail and Google Calendar.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (call it "SAS Dashboard")
3. Go to **APIs & Services → Library**
4. Enable **Gmail API** and **Google Calendar API**
5. Go to **APIs & Services → OAuth consent screen**
   - User type: External
   - Fill in app name, your email, and developer email
   - Add scopes: `gmail.readonly`, `calendar.readonly`
   - Add your Google account as a test user
6. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins:
     - `http://localhost:8080` (for local dev)
     - `https://yourusername.github.io` (your Pages URL)
   - Click **Create** and copy the **Client ID**
7. Open `src/config.js` and paste it into `GOOGLE_CLIENT_ID`

---

### 3. Todoist credentials

1. Go to [app.todoist.com/app/settings/integrations/developer](https://app.todoist.com/app/settings/integrations/developer)
2. Click **Create a new app**
3. Set **OAuth redirect URL** to: `https://yourusername.github.io/sas-dashboard/todoist-callback.html`
4. Copy **Client ID** and **Client Secret** into `src/config.js`

---

### 4. Update config.js

Open `src/config.js` and fill in:

```js
GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
TODOIST_CLIENT_ID: 'YOUR_TODOIST_CLIENT_ID',
TODOIST_CLIENT_SECRET: 'YOUR_TODOIST_CLIENT_SECRET',
BASE_URL: 'https://yourusername.github.io/sas-dashboard',
```

---

### 5. (Optional) Chrome new tab extension

If you use Chrome and want the dashboard to open on every new tab:

1. Open `extension/newtab.html` and update the URL to your GitHub Pages URL
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `extension/` folder

That's it — every new tab will open your dashboard.

---

## Usage

- Click **Sign in with Google** to connect Gmail + Calendar
- Click **Connect Todoist** to connect your tasks
- Credentials are saved in `localStorage` so you only sign in once per browser
- Click the **sign out** link (top right) to clear everything

---

## Sharing with other students

Since this is a static site, anyone at SAS can use it — they just need to:
1. Visit your GitHub Pages URL
2. Sign in with their own Google account and Todoist

Their data is never sent anywhere — all API calls go directly from their browser to Google/Todoist.

---

## Tech

- Vanilla HTML/CSS/JS — no build step, no dependencies
- Google Identity Services (GIS) for OAuth
- Todoist REST API v2
- Gmail API v1
- Google Calendar API v3

---

## Privacy

All data stays in the user's browser. No server, no database, no tracking. Tokens are stored only in `localStorage` on the user's own machine.
