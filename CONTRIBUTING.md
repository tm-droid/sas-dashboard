# Contributing to SAS Dashboard

Thanks for wanting to help! This is a small open project built for SAS students, so contributions of any size are welcome — bug reports, fixes, new features, or just suggestions.

---

## Reporting a bug

Open an [issue](https://github.com/tm-droid/sas-dashboard/issues) and include:

- What you expected to happen
- What actually happened
- Your browser and OS
- Any errors you see in the browser console (right-click → Inspect → Console)

---

## Suggesting a feature

Open an issue with the label `enhancement`. Describe what problem it solves and who at SAS would benefit. Features that work for everyone (not just one grade or one tool) are most likely to be added.

---

## Making a change

1. Fork the repo and create a branch: `git checkout -b my-fix`
2. Make your changes
3. Test locally — run `npx serve .` and open `http://localhost:3000`
4. Open a pull request with a short description of what you changed and why

No build step, no package manager, no test suite — just open the HTML in a browser and check it works.

---

## Code style

- Vanilla JS only — no frameworks, no npm packages
- Keep each source file focused on one thing (auth, gcal, gmail, todoist, ui)
- Use `escHtml()` whenever rendering user-provided strings into HTML
- Prefer `async/await` over promise chains
- Match the existing formatting — 2-space indents, single quotes

---

## What's in scope

Good candidates for contributions:

- Bug fixes
- Better error handling or loading states
- Accessibility improvements
- Mobile layout fixes
- New quick links that are useful to SAS students

Probably out of scope for this repo:

- Adding entirely new data sources that require a backend
- Schoology integration (their API requires school-level approval)
- Anything that stores data outside the user's own browser