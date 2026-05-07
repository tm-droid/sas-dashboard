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

    const calendars = await fetchVisibleCalendars(token);
    const eventGroups = await Promise.all(calendars.map(calendar =>
      fetchCalendarEvents(token, calendar, startOfDay, endOfDay)
    ));
    const events = eventGroups
      .flat()
      .filter(e => e.status !== 'cancelled')
      .sort(compareEvents);

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

  const colors = ['blue', 'teal', 'coral', 'purple', 'amber', 'blue', 'teal'];
  const now = new Date();

  container.innerHTML = events.map((ev, i) => {
    const isAllDay = !!ev.start?.date;
    const start = isAllDay ? null : new Date(ev.start.dateTime);
    const end = isAllDay ? null : new Date(ev.end?.dateTime || ev.start.dateTime);
    const isNow = !isAllDay && start <= now && now <= end;

    const timeStr = isAllDay ? 'all day' : formatTime(start);
    const dotStyle = getEventDotStyle(ev, colors[i % colors.length]);
    const nowBadge = isNow ? '<span class="now-badge">now</span>' : '';
    const loc = ev.location ? `<div class="event-sub">${escHtml(truncate(ev.location, 40))}</div>` : '';
    const calendar = ev.calendarSummary ? `<div class="event-calendar">${escHtml(ev.calendarSummary)}</div>` : '';

    return `
      <div class="event-row">
        <span class="event-dot ${dotStyle.className}" ${dotStyle.style}></span>
        <div class="event-time">${timeStr}</div>
        <div class="event-main">
          <div class="event-title ${isNow ? 'now' : ''}">${escHtml(ev.summary || '(no title)')}${nowBadge}</div>
          ${loc}
          ${calendar}
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

async function fetchVisibleCalendars(token) {
  const calendars = [];
  let pageToken = null;

  do {
    const url = new URL('https://www.googleapis.com/calendar/v3/users/me/calendarList');
    url.searchParams.set('maxResults', '250');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (resp.status === 401) { handleGoogleExpiry(); throw new Error('Google token expired'); }
    if (!resp.ok) throw new Error(`Calendar list error ${resp.status}`);

    const data = await resp.json();
    calendars.push(...(data.items || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return calendars.filter(calendar =>
    !calendar.deleted &&
    !calendar.hidden &&
    calendar.selected === true &&
    calendar.accessRole !== 'freeBusyReader'
  );
}

async function fetchCalendarEvents(token, calendar, startOfDay, endOfDay) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
  url.searchParams.set('timeMin', startOfDay);
  url.searchParams.set('timeMax', endOfDay);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '20');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: 'Bearer ' + token },
  });

  if (resp.status === 401) { handleGoogleExpiry(); throw new Error('Google token expired'); }
  if (!resp.ok) {
    console.warn(`Skipping calendar ${calendar.summary || calendar.id}: ${resp.status}`);
    return [];
  }

  const data = await resp.json();
  return (data.items || []).map(event => ({
    ...event,
    calendarId: calendar.id,
    calendarSummary: calendar.summaryOverride || calendar.summary,
    calendarColor: calendar.backgroundColor,
  }));
}

function compareEvents(a, b) {
  const aKey = eventSortKey(a);
  const bKey = eventSortKey(b);
  return aKey.localeCompare(bKey);
}

function eventSortKey(event) {
  return event.start?.dateTime || `${event.start?.date || ''}T00:00:00`;
}

function getEventDotStyle(event, fallbackClass) {
  if (event.colorId) return { className: colorIdToClass(event.colorId), style: '' };
  if (event.calendarColor) return { className: '', style: `style="background:${escHtml(event.calendarColor)}"` };
  return { className: fallbackClass, style: '' };
}

function handleGoogleExpiry() {
  localStorage.removeItem('google_token');
  localStorage.removeItem('google_token_expiry');
  document.getElementById('events-list').innerHTML = '<div class="empty-state">session expired — please sign in again</div>';
  document.getElementById('email-list').innerHTML = '<div class="empty-state">session expired — please sign in again</div>';
}
