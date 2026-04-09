# GitHub Pages Publish Notes

This skill is meant to be published the same way as `bubble-subtitle`: as static files on GitHub Pages, then imported by the iOS app as an external skill.

## What must be published

Publish these files exactly as static assets:

- `e2b-runner/SKILL.md`
- `e2b-runner/scripts/index.html`
- `e2b-runner/assets/webview.html`

The `proxy/` folder is not part of GitHub Pages hosting. It runs separately on your own server.

## Expected public URLs

If your Pages site is:

`https://YOUR_NAME.github.io/YOUR_REPO/`

then the external skill URL should be:

`https://YOUR_NAME.github.io/YOUR_REPO/e2b-runner/SKILL.md`

The skill entry file and webview should then resolve as:

- `https://YOUR_NAME.github.io/YOUR_REPO/e2b-runner/scripts/index.html`
- `https://YOUR_NAME.github.io/YOUR_REPO/e2b-runner/assets/webview.html`

## Notes

- Keep `.nojekyll` at the repo root for safest static serving.
- The mobile app should import `SKILL.md`, not `index.html`.
- The current `e2b-runner` package shape already matches the existing `bubble-subtitle` packaging pattern.
- If the iOS app blocks cross-origin `fetch`, the next step is to test against your real proxy endpoint from the mobile webview.
