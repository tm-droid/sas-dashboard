# SAS Dashboard

A personal dashboard for Singapore American School students. See your Google Calendar events, Gmail inbox, and Todoist tasks — all in one place, every time you open a new tab.

**→ [Open the dashboard](https://tm-droid.github.io/sas-dashboard)**

---

## Getting started

### 1. Open the dashboard

Visit **[tm-droid.github.io/sas-dashboard](https://tm-droid.github.io/sas-dashboard)** in any browser.

### 2. Sign in

- Click **Sign in with Google** to connect your Gmail and Google Calendar
- Click **Connect Todoist** to connect your tasks (optional)

That's it. Your data loads automatically every time you visit.

### 3. Set it as your homepage (recommended)

So it opens every time you start your browser:

**Chrome:** Settings → On startup → Open a specific page → add `https://tm-droid.github.io/sas-dashboard`

**Safari:** Settings → General → Homepage → paste the URL

### 4. (Chrome only) Open on every new tab

If you want the dashboard to open whenever you open a new tab:

1. Download the `extension/` folder from this repo
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the `extension/` folder

---

## Privacy

Your data never leaves your browser. All API calls go directly from your device to Google and Todoist — nothing is stored on any server. Tokens are saved only in your browser's `localStorage` and can be cleared anytime with the **sign out** link.

---

## FAQ

**Do I need a Google Cloud account or Todoist developer account?**
No. Just sign in with your existing SAS Google account and Todoist account.

**Does this work on Safari / Firefox / other browsers?**
Yes — the website works on any browser. The new tab Chrome extension is Chrome-only.

**Is my data shared with anyone?**
No. See Privacy above.

**Something's broken or I have a suggestion.**
Open an issue on this repo.

---

## For developers

Want to run your own copy or contribute?

### Stack
- Vanilla HTML/CSS/JS — no build step, no dependencies
- Google Identity Services (GIS) for OAuth
- Gmail API v1, Google Calendar API v3
- Todoist REST API v1

### Local development

```bash
npx serve .
# then open http://localhost:3000
```

### Self-hosting

1. Fork the repo
2. Set up a Google Cloud project — enable Gmail API and Google Calendar API, create an OAuth client ID (Web application), add your domain as an authorised JavaScript origin
3. Create a Todoist developer app at [app.todoist.com/app/settings/integrations/developer](https://app.todoist.com/app/settings/integrations/developer) — set the redirect URI to `https://yourdomain/todoist-callback.html`
4. Add `GOOGLE_CLIENT_ID`, `TODOIST_CLIENT_ID`, and `TODOIST_CLIENT_SECRET` as GitHub Actions secrets
5. Enable GitHub Pages with the Actions workflow in `.github/workflows/deploy.yml`
