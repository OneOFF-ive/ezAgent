import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { handleCommand } from '../src/cli/commands.js';
import {
  appendUserMessage,
  createCliState,
  getMessages,
  startNewSession,
} from '../src/cli/state.js';
import { createTempDir } from '../test-support/temp-dir.js';

function captureConsole(t) {
  const output = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => output.push(args.join(' '));
  console.error = (...args) => output.push(args.join(' '));

  t.after(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  return output;
}

test('routes canonical commands without accessing real session data', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-command-test-');
  const state = createCliState();
  const output = captureConsole(t);
  state.sessionDir = sessionDir;

  for (const command of [
    '/help',
    '/agent',
    '/memory',
    '/session',
    '/session list',
    '/session load',
    '/session load missing-session',
    '/model',
    '/model list',
    '/model switch',
    '/model switch missing-model',
  ]) {
    assert.equal(handleCommand(command, state), true, command);
  }

  assert.ok(output.length > 0);
});

test('clears and saves the active session', (t) => {
  const sessionDir = createTempDir(t, 'ezagent-command-test-');
  const state = createCliState();
  captureConsole(t);
  state.sessionDir = sessionDir;
  startNewSession(state, 'command-session');
  appendUserMessage(state, 'temporary message');

  assert.equal(handleCommand('/clear', state), true);
  assert.equal(getMessages(state).length, 1);
  assert.equal(fs.existsSync(path.join(sessionDir, 'command-session.json')), true);
});

test('does not route removed aliases or unknown commands', () => {
  const state = createCliState();

  for (const command of ['/load session', '/sessions', '/models', '/switch model', '/unknown']) {
    assert.equal(handleCommand(command, state), false, command);
  }
});
