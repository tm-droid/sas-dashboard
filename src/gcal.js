// ============================================================
//  GOOGLE CALENDAR
// ============================================================

window.loadCalendar = async function () {
  const token = getGoogleToken();
  if (!token) return;

  renderEventsShimmer();

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', startOfDay);
    url.searchParams.set('timeMax', endOfDay);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '10');

    const resp = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (resp.status === 401) { handleGoogleExpiry(); return; }
    const data = await resp.json();

    const events = (data.items || []).filter(e => e.status !== 'cancelled');
    renderEvents(events);
    document.getElementById('stat-events').textContent = events.length;
  } catch (e) {
    console.error('Calendar error', e);
    document.getElementById('events-list').innerHTML = '<div class="empty-state">failed to load events</div>';
  }
};

function renderEvents(events) {
  const container = document.getElementById('events-list');

  if (!events.length) {
    container.innerHTML = '<div class="empty-state">no events today</div>';
    return;
  }

  const colors = ['blue', 'teal', 'coral', 'purple', 'blue', 'teal', 'coral'];
  const now = new Date();

  container.innerHTML = events.map((ev, i) => {
    const isAllDay = !!ev.start?.date;
    const start = isAllDay ? null : new Date(ev.start.dateTime);
    const end = isAllDay ? null : new Date(ev.end?.dateTime || ev.start.dateTime);
    const isNow = !isAllDay && start <= now && now <= end;

    const timeStr = isAllDay ? 'all day' : formatTime(start);
    const color = ev.colorId ? colorIdToClass(ev.colorId) : colors[i % colors.length];
    const nowBadge = isNow ? '<span class="now-badge">now</span>' : '';
    const loc = ev.location ? `<div class="event-sub">${escHtml(truncate(ev.location, 40))}</div>` : '';

    return `
      <div class="event-row">
        <span class="event-dot ${color}"></span>
        <div class="event-time">${timeStr}</div>
        <div>
          <div class="event-title ${isNow ? 'now' : ''}">${escHtml(ev.summary || '(no title)')}${nowBadge}</div>
          ${loc}
        </div>
      </div>`;
  }).join('');
}

function renderEventsShimmer() {
  document.getElementById('events-list').innerHTML =
    [1,2,3].map(() => `<div class="shimmer" style="width:${60+Math.random()*30}%"></div>`).join('');
}

function colorIdToClass(id) {
  const map = { '1':'blue','2':'teal','3':'purple','4':'coral','5':'teal','6':'coral','7':'blue','8':'teal','9':'purple','10':'teal','11':'coral' };
  return map[id] || 'blue';
}

function handleGoogleExpiry() {
  localStorage.removeItem('google_token');
  localStorage.removeItem('google_token_expiry');
  document.getElementById('events-list').innerHTML = '<div class="empty-state">session expired — please sign in again</div>';
  document.getElementById('email-list').innerHTML = '<div class="empty-state">session expired — please sign in again</div>';
}
