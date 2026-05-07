// ============================================================
//  APP — initialise everything
// ============================================================

function init() {
  updateClock();
  updateGreeting();
  updateDate();
  setInterval(updateClock, 10000);

  initAuth();

  // If already authed, load data straight away
  if (getGoogleToken()) {
    window.loadCalendar();
    window.loadGmail();
  }
  if (getTodoistToken()) {
    window.loadTodoist();
  }
}

document.addEventListener('DOMContentLoaded', init);
