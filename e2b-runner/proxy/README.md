# gemma4-e2b-proxy

Minimal Node proxy for the `e2b-runner` mobile skill.

## Quickstart

1. Copy `.env.example` to `.env.local`.
2. Fill in `E2B_API_KEY`.
3. Set `PROXY_AUTH_TOKEN` to a value you will also pass from the mobile skill.
4. Install dependencies:

```bash
npm install
```

5. Start the service:

```bash
npm run dev
```

6. Check health:

```bash
curl http://localhost:8787/healthz
```

## Required environment variables

- `E2B_API_KEY`: real E2B server-side key.
- `PROXY_AUTH_TOKEN`: simple bearer token used by the mobile client.

## Main routes

- `POST /api/e2b/jobs`
- `GET /api/e2b/jobs/:jobId`
- `POST /api/e2b/jobs/:jobId/cancel`
- `GET /healthz`

## Notes

- Jobs are stored in memory in this first version.
- This is good for local development and first integration tests.
- For production, move job state to Redis, Postgres, or another persistent store.
- Keep `ALLOWED_ORIGIN` narrow in production if your mobile webview exposes an origin.
