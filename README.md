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

### 2. Private app secrets

This repo is set up so the published dashboard uses private OAuth credentials that are **not committed** to the repo.

The deployed site expects these GitHub Actions secrets:

- `GOOGLE_CLIENT_ID`
- `TODOIST_CLIENT_ID`
- `TODOIST_CLIENT_SECRET`

Anyone using the live dashboard can sign in with their own Google account and Todoist account. They do **not** need to create their own Google Cloud project or Todoist developer app.

If you are deploying your own separate copy of the dashboard, you will need your own private secrets for that deployment.

---

### 3. (Optional) Chrome new tab extension

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

They do not need to set up Google Cloud or Todoist developer credentials themselves. Their data is never sent anywhere else — all API calls go directly from their browser to Google/Todoist.

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
