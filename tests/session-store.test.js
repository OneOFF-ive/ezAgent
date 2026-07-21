import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { listSessions, loadSession, saveSession } from '../src/agent/session-store.js';
import { createTempDir } from '../test-support/temp-dir.js';

function createSnapshot(content = 'hello') {
  return {
    version: 2,
    maxMessages: 10,
    messages: [
      { role: 'system', content: 'system' },
      { role: 'user', content },
    ],
    trimmedMessages: 0,
    compressionCount: 0,
    compressedMessages: 0,
  };
}

test('saves and loads a session snapshot', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-session-test-');
  const snapshot = createSnapshot();
  const saved = saveSession(sessionDir, 'chat-1', snapshot);
  const loaded = loadSession(sessionDir, 'chat-1');

  assert.equal(fs.existsSync(saved.filePath), true);
  assert.equal(saved.sessionId, 'chat-1');
  assert.equal(saved.messageCount, 2);
  assert.equal(Number.isNaN(Date.parse(saved.savedAt)), false);
  assert.deepEqual(loaded.memory, snapshot);
  assert.equal(loaded.savedAt, saved.savedAt);
});

test('lists JSON sessions by id and ignores unrelated entries', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-session-test-');
  saveSession(sessionDir, 'session-b', createSnapshot('b'));
  saveSession(sessionDir, 'session-a', createSnapshot('a'));
  fs.writeFileSync(path.join(sessionDir, 'notes.txt'), 'ignored');
  fs.mkdirSync(path.join(sessionDir, 'nested.json'));

  const sessions = listSessions(sessionDir);

  assert.deepEqual(
    sessions.map((session) => session.sessionId),
    ['session-a', 'session-b'],
  );
  assert.equal(
    sessions.every((session) => !Number.isNaN(Date.parse(session.updatedAt))),
    true,
  );
});

test('returns empty results for missing sessions and directories', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-session-test-');
  const missingDir = path.join(sessionDir, 'missing');

  assert.equal(loadSession(sessionDir, 'missing-session'), null);
  assert.deepEqual(listSessions(missingDir), []);
});

test('rejects invalid session ids', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-session-test-');
  const invalidIds = ['', '../escape', 'space id', '/absolute'];

  for (const sessionId of invalidIds) {
    assert.throws(
      () => saveSession(sessionDir, sessionId, createSnapshot()),
      /session id must start/i,
    );
    assert.throws(() => loadSession(sessionDir, sessionId), /session id must start/i);
  }
});

test('rejects malformed session files', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-session-test-');

  fs.writeFileSync(path.join(sessionDir, 'broken.json'), '{not-json');
  fs.writeFileSync(path.join(sessionDir, 'array.json'), '[]');
  fs.writeFileSync(path.join(sessionDir, 'missing-memory.json'), '{}');

  assert.throws(() => loadSession(sessionDir, 'broken'), SyntaxError);
  assert.throws(() => loadSession(sessionDir, 'array'), /must contain a JSON object/i);
  assert.throws(() => loadSession(sessionDir, 'missing-memory'), /missing memory snapshot/i);
});
