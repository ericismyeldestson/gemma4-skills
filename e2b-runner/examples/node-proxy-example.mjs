import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Sandbox } from 'e2b';

const PORT = Number(process.env.PORT || 8787);
const AUTH_TOKEN = process.env.PROXY_AUTH_TOKEN || '';
const jobs = new Map();

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(body));
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

function authOk(req) {
  if (!AUTH_TOKEN) return true;
  const header = req.headers.authorization || '';
  return header === `Bearer ${AUTH_TOKEN}`;
}

function normalizeJobInput(body) {
  const executionType = body.executionType || (body.command ? 'command' : 'code');
  const language = body.language || (executionType === 'command' ? 'shell' : 'python');
  return {
    title: body.title || 'Untitled E2B job',
    language,
    executionType,
    command: body.command || '',
    code: body.code || '',
    files: Array.isArray(body.files) ? body.files : [],
    metadata: body.metadata || {},
    resultPath: body.resultPath || '',
    timeoutMs: Number(body.timeoutMs || 120000)
  };
}

async function uploadFiles(sandbox, files) {
  for (const file of files) {
    const targetPath = `/workspace/${file.name || randomUUID()}`;
    if (file.encoding === 'base64') {
      const bytes = Buffer.from(file.content || '', 'base64');
      await sandbox.files.write(targetPath, bytes);
    } else {
      await sandbox.files.write(targetPath, String(file.content || ''));
    }
  }
}

function buildExecution(job) {
  if (job.executionType === 'command') {
    return {
      runner: job.command,
      bootFiles: []
    };
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

async function executeJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  let sandbox = null;
  try {
    job.status = 'running';
    job.statusMessage = 'Creating E2B sandbox';

    sandbox = await Sandbox.create({ timeoutMs: job.timeoutMs });
    job.sandboxId = sandbox.sandboxId;
    job.statusMessage = 'Uploading files';

    await uploadFiles(sandbox, job.files);

    const exec = buildExecution(job);
    for (const file of exec.bootFiles) {
      await sandbox.files.write(file.path, file.data);
    }

    job.statusMessage = 'Executing in sandbox';
    const result = await sandbox.commands.run(exec.runner);

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
        job.downloadUrl = await sandbox.downloadUrl(job.resultPath, {
          useSignatureExpiration: 10 * 60 * 1000
        });
        job.downloadName = job.resultPath.split('/').pop() || 'artifact';
      } catch (_) {
        job.statusMessage += ' (artifact missing)';
      }
    }
  } catch (error) {
    job.status = 'failed';
    job.statusMessage = error.message;
    job.stderr = [job.stderr, error.stack || error.message].filter(Boolean).join('\n');
    job.resultText = job.stderr || 'Job failed';
  } finally {
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (_) {}
    }
  }
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
    downloadUrl: job.downloadUrl,
    downloadName: job.downloadName,
    statusUrl: `http://${req.headers.host}/api/e2b/jobs/${job.jobId}`,
    cancelUrl: `http://${req.headers.host}/api/e2b/jobs/${job.jobId}/cancel`
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  if (!authOk(req)) {
    json(res, 401, { error: 'Unauthorized proxy request' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/e2b/jobs') {
    try {
      const body = normalizeJobInput(await readBody(req));
      if (!body.command && !body.code) {
        json(res, 400, { error: 'Provide command or code' });
        return;
      }

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
        downloadUrl: '',
        downloadName: ''
      };
      jobs.set(jobId, job);
      executeJob(jobId);
      json(res, 202, presentJob(req, job));
    } catch (error) {
      json(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/e2b/jobs/')) {
    const jobId = url.pathname.split('/').pop();
    const job = jobs.get(jobId);
    if (!job) {
      json(res, 404, { error: 'Job not found' });
      return;
    }
    json(res, 200, presentJob(req, job));
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/e2b/jobs/') && url.pathname.endsWith('/cancel')) {
    const parts = url.pathname.split('/');
    const jobId = parts[parts.length - 2];
    const job = jobs.get(jobId);
    if (!job) {
      json(res, 404, { error: 'Job not found' });
      return;
    }
    job.status = 'cancelled';
    job.statusMessage = 'Cancellation recorded by proxy';
    job.resultText = job.resultText || 'Job marked as cancelled.';
    json(res, 200, presentJob(req, job));
    return;
  }

  json(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`E2B proxy example listening on http://localhost:${PORT}`);
  console.log('Set E2B_API_KEY in the environment before using this example.');
});
