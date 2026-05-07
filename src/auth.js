// ============================================================
//  AUTH — Google (GIS) + Todoist OAuth PKCE
// ============================================================

let googleTokenClient = null;
let googleAccessToken = null;
let todoistAccessToken = null;

function setAuthStatusMessage(message) {
  const authText = document.querySelector('#auth-banner .auth-text');
  if (authText) authText.textContent = message;
}

function hasConfigValue(key) {
  return typeof CONFIG[key] === 'string' && CONFIG[key].trim().length > 0;
}

function ensureAuthConfig(keys, providerName) {
  const missingKeys = keys.filter((key) => !hasConfigValue(key));
  if (missingKeys.length === 0) return true;

  console.error(providerName + ' auth is missing config', missingKeys);
  setAuthStatusMessage(providerName + ' sign-in is not configured for this deployment yet.');
  return false;
}

// ── Google ──────────────────────────────────────────────────

function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

async function signInGoogle() {
  if (!ensureAuthConfig(['GOOGLE_CLIENT_ID'], 'Google')) return;
  await loadGoogleScript();

  googleTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    scope: CONFIG.GOOGLE_SCOPES,
    callback: async (resp) => {
      if (resp.error) { console.error('Google auth error', resp); return; }
      googleAccessToken = resp.access_token;
      localStorage.setItem('google_token', googleAccessToken);
      localStorage.setItem('google_token_expiry', Date.now() + resp.expires_in * 1000);
      onGoogleAuthed();
    },
  });

  googleTokenClient.requestAccessToken({ prompt: '' });
}

function onGoogleAuthed() {
  updateAuthBanner();
  document.getElementById('signout-btn').style.display = 'block';
  window.loadCalendar();
  window.loadGmail();
}

function getGoogleToken() {
  // Check cached token
  const token = localStorage.getItem('google_token');
  const expiry = parseInt(localStorage.getItem('google_token_expiry') || '0');
  if (token && Date.now() < expiry - 60000) {
    return token;
  }
  return null;
}

// ── Todoist ──────────────────────────────────────────────────

async function connectTodoist() {
  if (!ensureAuthConfig(['TODOIST_CLIENT_ID', 'TODOIST_CLIENT_SECRET'], 'Todoist')) return;
  // PKCE flow
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('todoist_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CONFIG.TODOIST_CLIENT_ID,
    scope: 'data:read',
    state: crypto.randomUUID(),
    redirect_uri: CONFIG.BASE_URL + '/todoist-callback.html',
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.open('https://todoist.com/oauth/authorize?' + params.toString(),
    'todoist-auth', 'width=500,height=600');
}

// Called from todoist-callback.html via postMessage
window.addEventListener('message', async (e) => {
  if (e.data?.type !== 'todoist_code') return;
  if (!ensureAuthConfig(['TODOIST_CLIENT_ID', 'TODOIST_CLIENT_SECRET'], 'Todoist')) return;
  const code = e.data.code;
  const verifier = sessionStorage.getItem('todoist_verifier');

  // Exchange code for token
  const resp = await fetch('https://todoist.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CONFIG.TODOIST_CLIENT_ID,
      client_secret: CONFIG.TODOIST_CLIENT_SECRET,
      code,
      redirect_uri: CONFIG.BASE_URL + '/todoist-callback.html',
      code_verifier: verifier,
    }),
  });

  const data = await resp.json();
  if (data.access_token) {
    todoistAccessToken = data.access_token;
    localStorage.setItem('todoist_token', todoistAccessToken);
    updateAuthBanner();
    window.loadTodoist();
  }
});

function getTodoistToken() {
  return todoistAccessToken || localStorage.getItem('todoist_token');
}

// ── Sign out ─────────────────────────────────────────────────

function signOut() {
  localStorage.removeItem('google_token');
  localStorage.removeItem('google_token_expiry');
  localStorage.removeItem('todoist_token');
  googleAccessToken = null;
  todoistAccessToken = null;
  location.reload();
}

// ── PKCE helpers ─────────────────────────────────────────────

function generateCodeVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Banner state ─────────────────────────────────────────────

function updateAuthBanner() {
  const hasGoogle = !!getGoogleToken();
  const hasTodoist = !!getTodoistToken();
  const googleConfigured = hasConfigValue('GOOGLE_CLIENT_ID');
  const todoistConfigured = hasConfigValue('TODOIST_CLIENT_ID') && hasConfigValue('TODOIST_CLIENT_SECRET');

  const googleBtn = document.getElementById('google-auth-btn');
  const todoistBtn = document.getElementById('todoist-auth-btn');
  const banner = document.getElementById('auth-banner');

  if (!googleConfigured) {
    googleBtn.textContent = 'Google not configured';
    googleBtn.disabled = true;
  }

  if (!todoistConfigured) {
    todoistBtn.textContent = 'Todoist not configured';
    todoistBtn.disabled = true;
  }

  if (!googleConfigured || !todoistConfigured) {
    setAuthStatusMessage('This deployment is missing one or more OAuth settings.');
  }

  if (hasGoogle) {
    googleBtn.textContent = '✓ Google connected';
    googleBtn.classList.add('connected');
    googleBtn.disabled = true;
    document.getElementById('signout-btn').style.display = 'block';
  }

  if (hasTodoist) {
    todoistBtn.textContent = '✓ Todoist connected';
    todoistBtn.classList.add('connected');
    todoistBtn.disabled = true;
  }

  if (hasGoogle && hasTodoist) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}

// ── Init: restore from localStorage ──────────────────────────

function initAuth() {
  googleAccessToken = getGoogleToken();
  todoistAccessToken = getTodoistToken();
  updateAuthBanner();

  if (googleAccessToken) {
    document.getElementById('signout-btn').style.display = 'block';
  }
}
