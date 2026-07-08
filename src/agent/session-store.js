import fs from 'node:fs';
import path from 'node:path';

const SESSION_FILE_VERSION = 1;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function resolveSessionDir(sessionDir) {
  return path.resolve(process.cwd(), sessionDir);
}

function assertSessionId(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
    throw new Error(
      'Session id must start with a letter or number and only contain letters, numbers, dot, underscore, or dash.',
    );
  }
}

function sessionFilePath(sessionDir, sessionId) {
  assertSessionId(sessionId);
  return path.join(resolveSessionDir(sessionDir), `${sessionId}.json`);
}

function ensureSessionDir(sessionDir) {
  const resolvedDir = resolveSessionDir(sessionDir);
  fs.mkdirSync(resolvedDir, { recursive: true });
  return resolvedDir;
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function saveSession(sessionDir, sessionId, memorySnapshot) {
  const resolvedDir = ensureSessionDir(sessionDir);
  const filePath = sessionFilePath(resolvedDir, sessionId);
  const savedAt = new Date().toISOString();
  const payload = {
    version: SESSION_FILE_VERSION,
    sessionId,
    savedAt,
    memory: memorySnapshot,
  };

  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);

  return {
    sessionId,
    filePath,
    savedAt,
    messageCount: memorySnapshot.messages.length,
  };
}

export function loadSession(sessionDir, sessionId) {
  const filePath = sessionFilePath(sessionDir, sessionId);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const payload = readJsonFile(filePath);

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`Session file must contain a JSON object: ${filePath}`);
  }

  if (!payload.memory) {
    throw new Error(`Session file is missing memory snapshot: ${filePath}`);
  }

  return {
    sessionId,
    filePath,
    savedAt: payload.savedAt || null,
    memory: payload.memory,
  };
}

export function listSessions(sessionDir) {
  const resolvedDir = resolveSessionDir(sessionDir);

  if (!fs.existsSync(resolvedDir)) {
    return [];
  }

  return fs
    .readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const sessionId = path.basename(entry.name, '.json');
      const filePath = path.join(resolvedDir, entry.name);
      const stats = fs.statSync(filePath);

      return {
        sessionId,
        filePath,
        updatedAt: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.sessionId.localeCompare(b.sessionId));
}

export function getSessionFilePath(sessionDir, sessionId) {
  return sessionFilePath(sessionDir, sessionId);
}
