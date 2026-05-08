// ============================================================
//  TODOIST
// ============================================================

const TODOIST_API_BASE = 'https://api.todoist.com/rest/v1';

window.loadTodoist = async function () {
  const token = getTodoistToken();
  if (!token) return;

  renderTasksShimmer();

  try {
    const tasks = await fetchTodoistTasks(token, '(overdue | today | tomorrow)');
    renderTasks(tasks);

    const dueSoon = tasks.filter(t => !t.is_completed).length;
    document.getElementById('stat-tasks').textContent = dueSoon;
  } catch (e) {
    console.error('Todoist error', e);
    document.getElementById('tasks-list').innerHTML = '<div class="empty-state">failed to load tasks</div>';
  }
};

async function fetchTodoistTasks(token, query) {
  const url = new URL(`${TODOIST_API_BASE}/tasks`);
  url.searchParams.set('filter', query);
  url.searchParams.set('limit', '200');

  let resp;
  try {
    resp = await fetch(url.toString(), {
      headers: { Authorization: 'Bearer ' + token },
    });
  } catch (e) {
    throw new Error('Todoist fetch failed');
  }

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => '');
    if (resp.status === 401) {
      clearInvalidTodoistToken();
    }
    throw new Error(`Todoist error ${resp.status}: ${errorText}`);
  }

  return await resp.json();
}

function clearInvalidTodoistToken() {
  localStorage.removeItem('todoist_token');
  if (typeof todoistAccessToken !== 'undefined') todoistAccessToken = null;
  const todoistBtn = document.getElementById('todoist-auth-btn');
  if (todoistBtn) {
    todoistBtn.textContent = 'Connect Todoist';
    todoistBtn.classList.remove('connected');
    todoistBtn.disabled = false;
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');

  if (!tasks.length) {
    container.innerHTML = '<div class="empty-state">no tasks due soon 🎉</div>';
    return;
  }

  const today = todayStr();
  const tomorrow = tomorrowStr();

  tasks.sort((a, b) => {
    const aDue = getTodoistDueDate(a) || '';
    const bDue = getTodoistDueDate(b) || '';
    return aDue.localeCompare(bDue);
  });

  const shown = tasks.slice(0, 6);

  container.innerHTML = shown.map(task => {
    const dueDate = getTodoistDueDate(task);
    const isOverdue = dueDate && dueDate < today;
    const isToday = dueDate === today;
    const isTomorrow = dueDate === tomorrow;

    let dueLabel = '';
    let dueClass = '';
    if (isOverdue) { dueLabel = 'overdue'; dueClass = 'urgent'; }
    else if (isToday) { dueLabel = 'today'; dueClass = 'urgent'; }
    else if (isTomorrow) { dueLabel = 'tmr'; dueClass = 'soon'; }
    else if (dueDate) { dueLabel = formatShortDate(dueDate); }

    const checked = task.is_completed ? 'done' : '';
    const textClass = task.is_completed ? 'done' : '';
    const priorityClass = getTodoistPriorityClass(task.priority);
    const labels = getTodoistLabels(task);
    const labelHtml = labels.length
      ? `<div class="task-labels">${labels.map(label => `<span class="task-label">@${escHtml(label)}</span>`).join('')}</div>`
      : '';

    return `
      <div class="task-row" data-id="${task.id}">
        <div class="task-check ${priorityClass} ${checked}" onclick="toggleTodoistTask(this, '${task.id}')"></div>
        <div class="task-main">
          <div class="task-text ${textClass}">${escHtml(task.content)}</div>
          ${labelHtml}
        </div>
        <div class="task-due ${dueClass}">${dueLabel}</div>
      </div>`;
  }).join('');

  if (tasks.length > 6) {
    container.innerHTML += `<div class="empty-state" style="margin-top:8px;">+${tasks.length - 6} more in Todoist</div>`;
  }
}

function renderTasksShimmer() {
  document.getElementById('tasks-list').innerHTML =
    [1,2,3].map(() => `<div class="shimmer" style="width:${55+Math.random()*35}%"></div>`).join('');
}

window.toggleTodoistTask = async function(el, taskId) {
  const token = getTodoistToken();
  if (!token) return;

  const wasChecked = el.classList.contains('done');
  el.classList.toggle('done');
  const textEl = el.parentElement?.querySelector('.task-text');
  textEl?.classList.toggle('done');

  try {
    if (!wasChecked) {
      // Mark complete
      await fetch(`${TODOIST_API_BASE}/tasks/${taskId}/close`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
    } else {
      // Reopen
      await fetch(`${TODOIST_API_BASE}/tasks/${taskId}/reopen`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
    }
  } catch (e) {
    // Revert on error
    el.classList.toggle('done');
    textEl?.classList.toggle('done');
  }
};

function todayStr() {
  const d = new Date();
  return localDateKey(d);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDateKey(d);
}

function getTodoistDueDate(task) {
  const dueDate = normalizeTodoistDate(task.due?.date || task.due_date);
  if (dueDate) return dueDate;

  const dueDateTime = task.due?.datetime || task.due_datetime;
  if (dueDateTime) return localDateKey(new Date(dueDateTime));

  return '';
}

function normalizeTodoistDate(value) {
  if (typeof value !== 'string') return '';

  const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) return dateMatch[1];

  const parsed = new Date(value);
  return localDateKey(parsed);
}

function localDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatShortDate(dateStr) {
  if (!isDateKey(dateStr)) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTodoistPriorityClass(priority) {
  if (typeof priority === 'string') {
    const normalized = priority.toLowerCase();
    if (normalized === 'p1') return 'priority-high';
    if (normalized === 'p2') return 'priority-mid';
    if (normalized === 'p3') return 'priority-low';
  }

  const p = Number(priority);
  if (p === 4) return 'priority-high';
  if (p === 3) return 'priority-mid';
  if (p === 2) return 'priority-low';
  return 'priority-neutral';
}

function getTodoistLabels(task) {
  const labels = Array.isArray(task.labels)
    ? task.labels
    : (Array.isArray(task.label_names) ? task.label_names : []);

  return labels
    .map(label => {
      if (typeof label === 'string') return label.replace(/^@+/, '').trim();
      if (label?.name) return String(label.name).replace(/^@+/, '').trim();
      return '';
    })
    .filter(Boolean);
}
