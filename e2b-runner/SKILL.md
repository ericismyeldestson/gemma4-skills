---
name: e2b-runner
description: E4B-first mobile workbench for translate, rewrite, query, and optional legacy remote sandbox jobs.
---

# E4B Workbench

Use this skill as the main structured mobile workbench for Gemma 4 E4B.

Always call `run_js` immediately with a JSON `data` string.

This skill now has two groups of modes:

- local E4B modes: `translate`, `rewrite`, `query`
- legacy remote modes: `run`, `snapshot_run`

Prefer the local E4B modes unless the user explicitly wants a remote sandbox or secure proxy flow.

## Local E4B modes

These modes do not require a backend.
They prepare a structured on-device task packet inside the workbench UI.

### translate

Use when the user wants direct translation.

data:
```json
{
  "mode": "translate",
  "title": "Translate to English",
  "sourceText": "我明天下午会到公司。",
  "targetLanguage": "English",
  "autoStart": true
}
```

### rewrite

Use when the user wants polishing, shortening, expansion, or tone change.

data:
```json
{
  "mode": "rewrite",
  "title": "Make this more formal",
  "sourceText": "我们明天聊一下这个事。",
  "rewriteGoal": "Rewrite in a more formal and concise tone.",
  "autoStart": true
}
```

### query

Use when the user wants a one-shot explanation, summary, extraction, or comparison.

data:
```json
{
  "mode": "query",
  "title": "Summarize this text",
  "sourceText": "Paste the text or notes here.",
  "question": "Summarize the key points in 3 bullets.",
  "autoStart": true
}
```

## Legacy remote modes

Keep using these only when the user explicitly wants remote execution or a proxy-backed sandbox.

### run

```json
{
  "mode": "run",
  "endpoint": "https://example.com/api/e2b/jobs",
  "authToken": "proxy-token",
  "title": "Check Python version",
  "language": "shell",
  "command": "python --version",
  "autoStart": false
}
```

### snapshot_run

```json
{
  "mode": "snapshot_run",
  "endpoint": "https://example.com/api/e2b/jobs",
  "authToken": "proxy-token",
  "title": "OCR and summarize receipt",
  "language": "python",
  "code": "print('Use input.jpg here')",
  "camera": "environment",
  "autoStart": false
}
```

## Calling rules

- Prefer `translate` for direct translation.
- Prefer `rewrite` for polish, tone shift, shortening, or expansion.
- Prefer `query` for one-shot explanation, extraction, summary, or comparison.
- Prefer `run` and `snapshot_run` only for explicit remote execution.
- For local modes, put the real user text into `sourceText`.
- For `translate`, set `targetLanguage`.
- For `rewrite`, set `rewriteGoal`.
- For `query`, set `question`.
- Never place the real `E2B_API_KEY` on the phone.

## iOS test payloads

### Local translate smoke test

```json
{
  "mode": "translate",
  "title": "Translate to English",
  "sourceText": "我明天下午会到公司。",
  "targetLanguage": "English",
  "autoStart": false
}
```

### Local rewrite smoke test

```json
{
  "mode": "rewrite",
  "title": "Make this more formal",
  "sourceText": "我们明天聊一下这个事。",
  "rewriteGoal": "Rewrite in a more formal tone.",
  "autoStart": false
}
```

### Local query smoke test

```json
{
  "mode": "query",
  "title": "Summarize this text",
  "sourceText": "PhoneClaw is a local iPhone AI agent.",
  "question": "Summarize this in 2 short bullet points.",
  "autoStart": false
}
```
