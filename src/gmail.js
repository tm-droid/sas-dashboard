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

    renderEmails(details);
  } catch (e) {
    console.error('Gmail error', e);
    document.getElementById('email-list').innerHTML = '<div class="empty-state">failed to load emails</div>';
  }
};

function renderEmails(threads) {
  const container = document.getElementById('email-list');
  if (!threads.length) {
    container.innerHTML = '<div class="empty-state">no emails</div>';
    return;
  }

  const avatarColors = ['blue', 'teal', 'coral', 'purple', 'amber'];

  container.innerHTML = threads.map((thread, i) => {
    const msg = thread.messages?.[thread.messages.length - 1];
    if (!msg) return '';

    const headers = msg.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    const from = getHeader('From');
    const subject = getHeader('Subject') || '(no subject)';
    const dateStr = getHeader('Date');

    const senderName = parseSenderName(from);
    const initials = getInitials(senderName);
    const isUnread = msg.labelIds?.includes('UNREAD');
    const timeStr = formatEmailDate(dateStr);
    const color = avatarColors[i % avatarColors.length];

    return `
      <div class="email-row" onclick="openEmail('${thread.id}')">
        <div class="unread-dot ${isUnread ? '' : 'hidden'}"></div>
        <div class="email-avatar ${color}">${initials}</div>
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

function parseSenderName(from) {
  // "Name <email>" or just "email"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatEmailDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return formatTime(d);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
