---
name: e2b-runner
description: Run server-side E2B sandbox jobs from Gemma 4 mobile through a secure proxy.
---

# E2B Runner

Use this skill when the user wants to execute cloud sandbox work from Gemma 4 mobile.

Always call `run_js` immediately with a JSON `data` string.

Do not open the webview directly without payload. This skill only works when the caller provides a concrete `command` or `code` payload.

This skill does not talk to E2B directly from the phone. It calls your own HTTPS proxy endpoint, and that proxy holds the real `E2B_API_KEY`.

## Supported modes

## run (default)
Execute a remote command or code job.

data:
```json
{
  "mode": "run",
  "endpoint": "https://example.com/api/e2b/jobs",
  "authToken": "proxy-token",
  "title": "Check Python version",
  "language": "shell",
  "command": "python --version",
  "pollIntervalMs": 2000
}
```

## snapshot_run
Open an interactive camera view, capture one image, attach it as `input.jpg`, then submit the remote job.

data:
```json
{
  "mode": "snapshot_run",
  "endpoint": "https://example.com/api/e2b/jobs",
  "authToken": "proxy-token",
  "title": "OCR and summarize receipt",
  "language": "python",
  "code": "print('Use input.jpg here')",
  "camera": "environment"
}
```

## Data contract

- `endpoint`: required. Your HTTPS proxy endpoint for `POST /jobs`.
- `authToken`: optional proxy auth token. Never send the real E2B API key to the phone.
- `title`: optional short label shown in the UI.
- `language`: optional. One of `shell`, `python`, `javascript`.
- `command`: shell command to run remotely.
- `code`: source code to run remotely. Use with `language=python` or `language=javascript`.
- `files`: optional array of input files:
```json
[
  {
    "name": "notes.txt",
    "content": "hello",
    "encoding": "text"
  }
]
```
- `resultPath`: optional sandbox path to expose back as a downloadable artifact.
- `metadata`: optional freeform JSON object passed through to your proxy.
- `pollIntervalMs`: optional polling interval, default `2000`.
- `autoStart`: optional boolean, default `true`.

## Calling rules

- If the user asks for E2B or cloud sandbox execution, use this skill.
- Rewrite vague user intent into explicit `command` or `code` before calling.
- Prefer `command` for simple shell tasks.
- Prefer `code` for multi-step Python or JavaScript work.
- Use `snapshot_run` only when the job needs a fresh photo from the phone camera.
- Never place the real `E2B_API_KEY` in `authToken` or any client-side field.
- Never open the webview as a standalone page. Always call `run_js` with a full JSON payload first.

## iOS test prompt

Use this exact payload pattern for the first mobile smoke test:

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

If the user mentions `e2b-runner`, `test e2b-runner`, or `run e2b-runner`, interpret that as a request to build a payload and call `run_js`, not as a request to open the page directly.
