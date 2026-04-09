import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Sandbox } from 'e2b';

const PORT = Number(process.env.PORT || 8787);
const AUTH_TOKEN = process.env.PROXY_AUTH_TOKEN || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MAX_FILES = Number(process.env.MAX_FILES || 6);
const MAX_TEXT_FILE_BYTES = Number(process.env.MAX_TEXT_FILE_BYTES || 200000);
const DEFAULT_TIMEOUT_MS = Number(process.env.DEFAULT_TIMEOUT_MS || 120000);
const MAX_TIMEOUT_MS = Number(process.env.MAX_TIMEOUT_MS || 600000);
const SUPPORTED_LANGUAGES = new Set(['shell', 'python', 'javascript']);
const SUPPORTED_EXECUTION_TYPES = new Set(['command', 'code']);
const jobs = new Map();

function markCancelled(job, message = 'Job cancelled') {
  job.cancelRequested = true;
  job.status = 'cancelled';
  job.statusMessage = message;
  job.resultText = job.resultText || 'Job cancelled.';
  job.finishedAt = job.finishedAt || new Date().toISOString();
}

function writeJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(body));
}

function respondError(res, status, message, extra = {}) {
  writeJson(res, status, { error: message, ...extra });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function isAuthorized(req) {
  if (!AUTH_TOKEN) return true;
  return req.headers.authorization === `Bearer ${AUTH_TOKEN}`;
}

function clampTimeout(value) {
  const timeoutMs = Number(value || DEFAULT_TIMEOUT_MS);
  return Math.min(Math.max(timeoutMs, 1000), MAX_TIMEOUT_MS);
}

function normalizeJobInput(body) {
  const executionType = body.executionType || (body.command ? 'command' : 'code');
  const language = body.language || (executionType === 'command' ? 'shell' : 'python');
  const files = Array.isArray(body.files) ? body.files : [];

  if (!SUPPORTED_EXECUTION_TYPES.has(executionType)) {
    throw new Error(`Unsupported executionType: ${executionType}`);
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (executionType === 'command' && !String(body.command || '').trim()) {
    throw new Error('Provide command for executionType=command');
  }

  if (executionType === 'code' && !String(body.code || '').trim()) {
    throw new Error('Provide code for executionType=code');
  }

  if (files.length > MAX_FILES) {
    throw new Error(`Too many files. Max is ${MAX_FILES}`);
  }

  for (const file of files) {
    validateFile(file);
  }

  return {
    title: String(body.title || 'Untitled E2B job').slice(0, 120),
    language,
    executionType,
    command: String(body.command || ''),
    code: String(body.code || ''),
    files,
    metadata: isPlainObject(body.metadata) ? body.metadata : {},
    resultPath: normalizeResultPath(body.resultPath || ''),
    timeoutMs: clampTimeout(body.timeoutMs)
  };
}

function validateFile(file) {
  if (!file || typeof file !== 'object') {
    throw new Error('Each file must be an object');
  }

  const name = String(file.name || '').trim();
  if (!name) {
    throw new Error('Each file needs a name');
  }
  if (name.includes('..') || name.includes('\\')) {
    throw new Error(`Invalid file name: ${name}`);
  }

  const encoding = String(file.encoding || 'text');
  if (!['text', 'base64'].includes(encoding)) {
    throw new Error(`Unsupported file encoding for ${name}`);
  }

  const content = String(file.content || '');
  if (encoding === 'text' && Buffer.byteLength(content, 'utf8') > MAX_TEXT_FILE_BYTES) {
    throw new Error(`Text file too large: ${name}`);
  }
}

function normalizeResultPath(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (!value.startsWith('/workspace/')) {
    throw new Error('resultPath must stay under /workspace/');
  }
  if (value.includes('..')) {
    throw new Error('resultPath must not contain ..');
  }
  return value;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function uploadFiles(sandbox, files) {
  for (const file of files) {
    const targetPath = `/workspace/${file.name}`;
    if (file.encoding === 'base64') {
      await sandbox.files.write(targetPath, Buffer.from(file.content || '', 'base64'));
    } else {
      await sandbox.files.write(targetPath, String(file.content || ''));
    }
  }
}

function buildExecution(job) {
  if (job.executionType === 'command') {
    return { runner: job.command, bootFiles: [] };
  }

  if (job.language === 'javascript') {
    return {
      runner: 'node /workspace/job.mjs',
      bootFiles: [{ path: '/workspace/job.mjs', data: job.code }]
    };
  }

  if (job.language === 'python') {
    return {
      runner: 'python /workspace/job.py',
      bootFiles: [{ path: '/workspace/job.py', data: job.code }]
    };
  }

  return {
    runner: 'bash /workspace/job.sh',
    bootFiles: [{ path: '/workspace/job.sh', data: job.code }]
  };
}

function presentJob(req, job) {
  return {
    jobId: job.jobId,
    status: job.status,
    statusMessage: job.statusMessage,
    resultText: job.resultText,
    stdout: job.stdout,
    stderr: job.stderr,
    exitCode: job.exitCode,
    sandboxId: job.sandboxId,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    title: job.title,
    metadata: job.metadata,
    cancelRequested: Boolean(job.cancelRequested),
    downloadUrl: job.downloadUrl,
    downloadName: job.downloadName,
    statusUrl: absoluteUrl(req, `/api/e2b/jobs/${job.jobId}`),
    cancelUrl: absoluteUrl(req, `/api/e2b/jobs/${job.jobId}/cancel`)
  };
}

function absoluteUrl(req, path) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}${path}`;
}

async function executeJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  let sandbox = null;
  try {
    if (job.cancelRequested) {
      markCancelled(job, 'Job cancelled before sandbox creation');
      return;
    }

    job.status = 'running';
    job.statusMessage = 'Creating E2B sandbox';
    job.startedAt = new Date().toISOString();

    sandbox = await Sandbox.create({ timeoutMs: job.timeoutMs });
    job.sandboxId = sandbox.sandboxId;
    job.liveSandbox = sandbox;

    if (job.cancelRequested) {
      markCancelled(job, 'Job cancelled after sandbox creation');
      return;
    }

    job.statusMessage = 'Uploading files';
    await uploadFiles(sandbox, job.files);

    if (job.cancelRequested) {
      markCancelled(job, 'Job cancelled during upload');
      return;
    }

    const exec = buildExecution(job);
    for (const file of exec.bootFiles) {
      await sandbox.files.write(file.path, file.data);
    }

    if (job.cancelRequested) {
      markCancelled(job, 'Job cancelled before execution');
      return;
    }

    job.statusMessage = 'Executing in sandbox';
    const result = await sandbox.commands.run(exec.runner);

    if (job.cancelRequested) {
      markCancelled(job, 'Job cancelled while executing');
      return;
    }

    job.stdout = result.stdout || '';
    job.stderr = result.stderr || '';
    job.exitCode = typeof result.exitCode === 'number' ? result.exitCode : 0;
    job.resultText = job.stdout || job.stderr || 'Job finished with no output.';
    job.status = job.exitCode === 0 ? 'completed' : 'failed';
    job.statusMessage = job.status === 'completed'
      ? 'Remote sandbox finished successfully'
      : 'Remote sandbox exited with a non-zero code';

    if (job.resultPath) {
      try {
        job.downloadUrl = await sandbox.downloadUrl(job.resultPath);
        job.downloadName = job.resultPath.split('/').pop() || 'artifact';
      } catch (_) {
        job.statusMessage += ' (artifact missing)';
      }
    }
  } catch (error) {
    if (job.cancelRequested) {
      job.stderr = [job.stderr, error.stack || error.message].filter(Boolean).join('\n');
      markCancelled(job, 'Job cancelled');
    } else {
      job.status = 'failed';
      job.statusMessage = error.message;
      job.stderr = [job.stderr, error.stack || error.message].filter(Boolean).join('\n');
      job.resultText = job.stderr || 'Job failed';
    }
  } finally {
    job.finishedAt = new Date().toISOString();
    job.liveSandbox = null;
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (_) {}
    }
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    writeJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && url.pathname === '/healthz') {
    writeJson(res, 200, {
      ok: true,
      hasE2BKey: Boolean(process.env.E2B_API_KEY),
      jobsInMemory: jobs.size
    });
    return;
  }

  if (!isAuthorized(req)) {
    respondError(res, 401, 'Unauthorized proxy request');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    writeJson(res, 200, {
      name: 'gemma4-e2b-proxy',
      routes: ['POST /api/e2b/jobs', 'GET /api/e2b/jobs/:jobId', 'POST /api/e2b/jobs/:jobId/cancel', 'GET /healthz']
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/e2b/jobs') {
    try {
      const body = normalizeJobInput(await readBody(req));
      const jobId = 'job_' + randomUUID();
      const job = {
        jobId,
        ...body,
        status: 'queued',
        statusMessage: 'Job accepted',
        resultText: '',
        stdout: '',
        stderr: '',
        exitCode: null,
        sandboxId: '',
        startedAt: null,
        finishedAt: null,
        cancelRequested: false,
        liveSandbox: null,
        downloadUrl: '',
        downloadName: ''
      };
      jobs.set(jobId, job);
      executeJob(jobId);
      writeJson(res, 202, presentJob(req, job));
    } catch (error) {
      respondError(res, 400, error.message);
    }
    return;
  }

  if (req.method === 'GET' && /^\/api\/e2b\/jobs\/[^/]+$/.test(url.pathname)) {
    const jobId = url.pathname.split('/').pop();
    const job = jobs.get(jobId);
    if (!job) {
      respondError(res, 404, 'Job not found');
      return;
    }
    writeJson(res, 200, presentJob(req, job));
    return;
  }

  if (req.method === 'POST' && /^\/api\/e2b\/jobs\/[^/]+\/cancel$/.test(url.pathname)) {
    const parts = url.pathname.split('/');
    const jobId = parts[parts.length - 2];
    const job = jobs.get(jobId);
    if (!job) {
      respondError(res, 404, 'Job not found');
      return;
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      writeJson(res, 200, presentJob(req, job));
      return;
    }

    job.cancelRequested = true;
    job.statusMessage = 'Cancellation requested';

    if (job.liveSandbox) {
      try {
        await job.liveSandbox.kill();
      } catch (_) {}
      markCancelled(job, 'Job cancelled');
    } else if (job.status === 'queued') {
      markCancelled(job, 'Job cancelled before execution');
    }

    writeJson(res, 200, presentJob(req, job));
    return;
  }

  respondError(res, 404, 'Route not found');
});

server.listen(PORT, () => {
  console.log(`gemma4-e2b-proxy listening on http://localhost:${PORT}`);
  console.log(`healthz: http://localhost:${PORT}/healthz`);
  if (!process.env.E2B_API_KEY) {
    console.warn('E2B_API_KEY is missing. Real job execution will fail until it is set.');
  }
});

