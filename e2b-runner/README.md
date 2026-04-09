# E2B Runner

This skill package adds a practical first step for Gemma 4 mobile to use E2B without breaking the local-first experience of the phone app.

## What this version does

- Adds a standalone `e2b-runner` skill.
- Keeps the real `E2B_API_KEY` on your server, not on the phone.
- Lets Gemma 4 mobile submit deterministic jobs as `command` or `code`.
- Supports an optional `snapshot_run` mode that captures `input.jpg` on the phone, then sends it to your proxy.

## What this version does not do

- It is not a full cloud agent.
- It does not translate vague natural-language goals into code on the proxy.
- It does not replace the realtime subtitle flow in `bubble-subtitle`.

That split is intentional. E2B is strongest when the phone uses it as a remote execution layer, not as the critical path for realtime UI or speech bubbles.

## Recommended architecture

1. Gemma 4 mobile decides that a task needs cloud execution.
2. The skill calls `run_js` with explicit `command` or `code`.
3. The phone WebView calls your HTTPS proxy.
4. Your proxy creates the E2B sandbox and uploads any files.
5. The proxy runs the job, stores status in your backend, and returns job updates.
6. The skill polls the proxy and renders result text, logs, and optional artifact links.

## Proxy contract

### `POST /api/e2b/jobs`

Request body:

```json
{
  "title": "Check Python version",
  "language": "shell",
  "executionType": "command",
  "command": "python --version",
  "files": [],
  "metadata": {},
  "resultPath": "/workspace/output.txt"
}
```

Response:

```json
{
  "jobId": "job_123",
  "status": "queued",
  "statusMessage": "Job accepted",
  "statusUrl": "https://example.com/api/e2b/jobs/job_123",
  "cancelUrl": "https://example.com/api/e2b/jobs/job_123/cancel"
}
```

### `GET /api/e2b/jobs/:jobId`

Response:

```json
{
  "jobId": "job_123",
  "status": "completed",
  "statusMessage": "Remote sandbox finished successfully",
  "resultText": "Python 3.12.1",
  "stdout": "Python 3.12.1\n",
  "stderr": "",
  "exitCode": 0,
  "sandboxId": "sbx_xxx",
  "downloadUrl": "https://...",
  "downloadName": "output.txt"
}
```

### `POST /api/e2b/jobs/:jobId/cancel`

Response:

```json
{
  "jobId": "job_123",
  "status": "cancelled",
  "statusMessage": "Job cancelled"
}
```

## Security rules

- Never send the real `E2B_API_KEY` to the mobile client.
- Treat `authToken` as a proxy credential only.
- Validate `language`, `executionType`, and file count on the server.
- Restrict allowed commands if untrusted users can trigger the proxy.
- Add rate limits and per-user quotas before exposing the proxy broadly.

## Suggested first use cases

- Run Python data cleaning on files captured or created on the phone.
- Use `snapshot_run` to send a fresh image into OCR or vision post-processing code.
- Generate `txt`, `json`, `csv`, `srt`, or `vtt` artifacts in the sandbox and expose them with a signed download URL.
- Execute package-heavy scripts remotely when the phone should stay lightweight.

## Next steps

If this first version works well, the next upgrade path is:

1. Add upload support for larger files through signed URLs.
2. Store sandbox IDs so long-running jobs can be resumed or inspected.
3. Add a planner layer that converts user intent into code before calling the proxy.
4. Wire the finished runner into `bubble-subtitle` as a post-processing step, not as the realtime recognition path.
