// ============================================================
//  GMAIL
// ============================================================

window.loadGmail = async function () {
  const token = getGoogleToken();
  if (!token) return;

  renderEmailShimmer();

  try {
    // Get unread count
    const countResp = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1',
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (countResp.status === 401) { handleGoogleExpiry(); return; }
    const countData = await countResp.json();
    const unreadCount = countData.resultSizeEstimate || 0;
    document.getElementById('stat-email').textContent = unreadCount > 99 ? '99+' : unreadCount;

    // Get recent threads (mix of read and unread)
    const listResp = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/threads?maxResults=5&labelIds=INBOX',
      { headers: { Authorization: 'Bearer ' + token } }
    );
    const listData = await listResp.json();
    const threads = listData.threads || [];

    // Fetch metadata for each thread in parallel
    const details = await Promise.all(threads.map(t =>
      fetch(`https://www.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: 'Bearer ' + token } }
      ).then(r => r.json())
    ));

    await renderEmails(details, token);
  } catch (e) {
    console.error('Gmail error', e);
    document.getElementById('email-list').innerHTML = '<div class="empty-state">failed to load emails</div>';
  }
};

async function renderEmails(threads, token) {
  const container = document.getElementById('email-list');
  if (!threads.length) {
    container.innerHTML = '<div class="empty-state">no emails</div>';
    return;
  }

  const avatarColors = ['blue', 'teal', 'coral', 'purple', 'amber'];
  const senders = threads.map(thread => {
    const msg = thread.messages?.[thread.messages.length - 1];
    const headers = msg?.payload?.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || '';
    return parseSenderEmail(from);
  }).filter(Boolean);
  const photoMap = await getSenderPhotoMap(token, senders);

  container.innerHTML = threads.map((thread, i) => {
    const msg = thread.messages?.[thread.messages.length - 1];
    if (!msg) return '';

    const headers = msg.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    const from = getHeader('From');
    const subject = getHeader('Subject') || '(no subject)';
    const dateStr = getHeader('Date');

    const senderName = parseSenderName(from);
    const senderEmail = parseSenderEmail(from);
    const initials = getInitials(senderName);
    const isUnread = msg.labelIds?.includes('UNREAD');
    const timeStr = formatEmailDate(dateStr);
    const color = avatarColors[i % avatarColors.length];
    const photoUrl = senderEmail ? photoMap[senderEmail.toLowerCase()] : '';
    const avatarHtml = photoUrl
      ? `<img class="email-avatar photo" src="${escHtml(photoUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(createEmailInitialsAvatar('${escHtml(initials)}', '${color}'))">`
      : `<div class="email-avatar ${color}">${escHtml(initials)}</div>`;

    return `
      <div class="email-row" onclick="openEmail('${thread.id}')">
        <div class="unread-dot ${isUnread ? '' : 'hidden'}"></div>
        ${avatarHtml}
        <div class="email-info">
          <div class="email-sender">${escHtml(senderName)}</div>
          <div class="email-subject">${escHtml(subject)}</div>
        </div>
        <div class="email-time">${timeStr}</div>
      </div>`;
  }).join('');
}

function renderEmailShimmer() {
  document.getElementById('email-list').innerHTML =
    [1,2,3].map(() => `<div class="shimmer" style="width:${50+Math.random()*40}%"></div>`).join('');
}

function openEmail(threadId) {
  window.open(`https://mail.google.com/mail/#inbox/${threadId}`, '_blank');
}

function createEmailInitialsAvatar(initials, color) {
  const el = document.createElement('div');
  el.className = `email-avatar ${color}`;
  el.textContent = initials;
  return el;
}

function parseSenderName(from) {
  // "Name <email>" or just "email"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

function parseSenderEmail(from) {
  const match = from.match(/<([^<>@\s]+@[^<>@\s]+)>/);
  if (match) return match[1].trim().toLowerCase();
  const plain = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return plain ? plain[0].trim().toLowerCase() : '';
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatEmailDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return formatTime(d);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function getSenderPhotoMap(token, emails) {
  const uniqueEmails = [...new Set(emails.map(email => email.toLowerCase()))];
  const result = {};
  const missing = [];
  const cache = readPhotoCache();

  uniqueEmails.forEach(email => {
    const cached = cache[email];
    if (cached && cached.expires > Date.now()) {
      result[email] = cached.url || '';
    } else {
      missing.push(email);
    }
  });

  if (!missing.length) return result;

  try {
    await warmPeopleSearchCache(token);
    const lookups = await Promise.all(missing.map(email => fetchContactPhoto(token, email)));
    lookups.forEach(({ email, url }) => {
      result[email] = url || '';
      if (url !== null) {
        cache[email] = {
          url: url || '',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
      }
    });
    writePhotoCache(cache);
  } catch (e) {
    console.warn('People photo lookup skipped', e);
  }

  return result;
}

async function warmPeopleSearchCache(token) {
  if (window.peopleSearchWarmed) return;

  const url = new URL('https://people.googleapis.com/v1/people:searchContacts');
  url.searchParams.set('query', '');
  url.searchParams.set('readMask', 'names,emailAddresses,photos');
  url.searchParams.set('pageSize', '1');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: 'Bearer ' + token },
  }).catch(() => {});

  if (resp?.ok) window.peopleSearchWarmed = true;
}

async function fetchContactPhoto(token, email) {
  const url = new URL('https://people.googleapis.com/v1/people:searchContacts');
  url.searchParams.set('query', email);
  url.searchParams.set('readMask', 'names,emailAddresses,photos');
  url.searchParams.set('pageSize', '5');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: 'Bearer ' + token },
  });

  if (resp.status === 401 || resp.status === 403) return { email, url: null };
  if (!resp.ok) return { email, url: null };

  const data = await resp.json();
  const person = (data.results || [])
    .map(result => result.person)
    .find(person => (person.emailAddresses || []).some(item => item.value?.toLowerCase() === email));

  const photo = (person?.photos || []).find(item => item.url)?.url || '';
  return { email, url: photo };
}

function readPhotoCache() {
  try {
    return JSON.parse(localStorage.getItem('gmail_photo_cache') || '{}');
  } catch (e) {
    return {};
  }
}

function writePhotoCache(cache) {
  try {
    localStorage.setItem('gmail_photo_cache', JSON.stringify(cache));
  } catch (e) {
    // The cache is only a performance nicety.
  }
}
