// ============================================================
//  TODOIST
// ============================================================

window.loadTodoist = async function () {
  const token = getTodoistToken();
  if (!token) return;

  renderTasksShimmer();

  try {
    const url = new URL('https://api.todoist.com/rest/v2/tasks');
    url.searchParams.set('filter', 'overdue | today | tomorrow');

    const resp = await fetch(url.toString(), {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => '');
      console.error('Todoist error', resp.status, errorText);
      document.getElementById('tasks-list').innerHTML = '<div class="empty-state">failed to load tasks</div>';
      return;
    }

    const tasks = await resp.json();
    renderTasks(tasks);

    const dueSoon = tasks.filter(t => !t.is_completed).length;
    document.getElementById('stat-tasks').textContent = dueSoon;
  } catch (e) {
    console.error('Todoist error', e);
    document.getElementById('tasks-list').innerHTML = '<div class="empty-state">failed to load tasks</div>';
  }
};

function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');

  if (!tasks.length) {
    container.innerHTML = '<div class="empty-state">no tasks due soon 🎉</div>';
    return;
  }

  // Sort: overdue first, then today, then tomorrow
  const today = todayStr();
  const tomorrow = tomorrowStr();

  tasks.sort((a, b) => {
    const aDue = a.due?.date || '';
    const bDue = b.due?.date || '';
    return aDue.localeCompare(bDue);
  });

  // Show max 6 tasks
  const shown = tasks.slice(0, 6);

  container.innerHTML = shown.map(task => {
    const dueDate = task.due?.date;
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

    return `
      <div class="task-row" data-id="${task.id}">
        <div class="task-check ${checked}" onclick="toggleTodoistTask(this, '${task.id}')"></div>
        <div class="task-text ${textClass}">${escHtml(task.content)}</div>
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
  const textEl = el.nextElementSibling;
  textEl.classList.toggle('done');

  try {
    if (!wasChecked) {
      // Mark complete
      await fetch(`https://api.todoist.com/rest/v2/tasks/${taskId}/close`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
    } else {
      // Reopen
      await fetch(`https://api.todoist.com/rest/v2/tasks/${taskId}/reopen`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
    }
  } catch (e) {
    // Revert on error
    el.classList.toggle('done');
    textEl.classList.toggle('done');
  }
};

function todayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
