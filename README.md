# Dash

Dash is the internal operations dashboard for People of Valor. It gives one view of how the business is running: revenue and projected income, client pipeline stage, Skool platform numbers, upcoming launches and content, and a running to-do list.

## How to open it

No install, no server, no build step.

1. Open `index.html` in any web browser (double-click it, or right-click and choose "Open with" your browser).
2. Start entering numbers. Everything you type is saved automatically in that browser, so it will still be there next time you open the file.

## What's in version one

All data entry is manual right now: revenue, Skool numbers, and pipeline figures are typed in by hand. There are no external connections yet. Once the dashboard has been in daily use for a while, the next step is deciding which of these should pull in automatically (Skool's API or export, a CRM, etc.).

## Files

- `index.html` — the page structure and the five sections of the dashboard.
- `style.css` — the visual design.
- `app.js` — all the logic: saving your data, rendering each section, and handling every button and form on the page.

## A note on your data

Everything is stored in your browser's local storage, tied to this file on this device. It does not sync across devices or browsers on its own. If you switch computers or clear your browser data, back up important numbers first.
