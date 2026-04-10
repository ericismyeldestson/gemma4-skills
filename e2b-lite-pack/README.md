# E2B Lite Pack

Lightweight skills for Gemma 4 E2B style usage on mobile.

These skills are intentionally simple:

- no backend
- no cloud sandbox
- no multi-step agent loop
- no `run_js`

They are designed for the kinds of tasks that smaller on-device models handle well:

- translation
- rewriting
- single-turn queries

## Skills

- `translate-lite/`
- `rewrite-lite/`
- `query-lite/`

## Import

Import each skill by its directory URL on GitHub Pages.

Examples:

- `https://ericismyeldestson.github.io/gemma4-skills/e2b-lite-pack/translate-lite/`
- `https://ericismyeldestson.github.io/gemma4-skills/e2b-lite-pack/rewrite-lite/`
- `https://ericismyeldestson.github.io/gemma4-skills/e2b-lite-pack/query-lite/`

## Design goal

This pack follows the same boundary that PhoneClaw uses for Gemma 4 E2B:

- chat enhancement
- translation
- single-turn content handling

It does not attempt complex multi-tool planning or long agent chains.
