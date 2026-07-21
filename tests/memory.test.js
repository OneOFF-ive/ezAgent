import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendAssistantMessage,
  appendUserMessage,
  clearMemory,
  createMemory,
  createMemorySnapshot,
  getMessages,
  getMemoryStats,
  restoreMemory,
  rollbackLastUserMessage,
} from '../src/agent/memory.js';

test('preserves the system message and trims the oldest conversation messages', () => {
  const memory = createMemory({ maxMessages: 4 });
  const systemMessage = getMessages(memory)[0];

  appendUserMessage(memory, 'user-1');
  appendAssistantMessage(memory, 'assistant-1');
  appendUserMessage(memory, 'user-2');
  appendAssistantMessage(memory, 'assistant-2');

  assert.equal(getMessages(memory)[0], systemMessage);
  assert.deepEqual(
    getMessages(memory).map((message) => message.content),
    [systemMessage.content, 'assistant-1', 'user-2', 'assistant-2'],
  );
  assert.equal(getMemoryStats(memory).trimmedMessages, 1);
});

test('rolls back only a trailing user message', () => {
  const memory = createMemory();

  appendUserMessage(memory, 'temporary question');
  rollbackLastUserMessage(memory);
  assert.equal(getMessages(memory).length, 1);

  appendAssistantMessage(memory, 'assistant message');
  rollbackLastUserMessage(memory);
  assert.equal(getMessages(memory).at(-1).content, 'assistant message');
});

test('clears conversation messages and resets memory counters', () => {
  const memory = createMemory();
  appendUserMessage(memory, 'question');
  memory.trimmedMessages = 2;
  memory.compressionCount = 3;
  memory.compressedMessages = 8;

  clearMemory(memory);

  assert.equal(getMessages(memory).length, 1);
  assert.equal(getMessages(memory)[0].role, 'system');
  assert.deepEqual(getMemoryStats(memory), {
    messageCount: 1,
    maxMessages: 100,
    conversationMessageCount: 0,
    trimmedMessages: 0,
    compressionCount: 0,
    compressedMessages: 0,
  });
});

test('creates an isolated snapshot and restores its state', () => {
  const memory = createMemory({ maxMessages: 8 });
  appendUserMessage(memory, 'original question');
  appendAssistantMessage(memory, 'original answer');
  memory.compressionCount = 1;
  memory.compressedMessages = 4;

  const snapshot = createMemorySnapshot(memory);
  const restored = restoreMemory(snapshot);

  snapshot.messages[1].content = 'changed snapshot';

  assert.equal(getMessages(memory)[1].content, 'original question');
  assert.equal(getMessages(restored)[1].content, 'original question');
  assert.notEqual(getMessages(restored)[1], getMessages(memory)[1]);
  assert.equal(getMemoryStats(restored).compressionCount, 1);
  assert.equal(getMemoryStats(restored).compressedMessages, 4);
});

test('restores a version 1 snapshot with current defaults', () => {
  const restored = restoreMemory({
    version: 1,
    maxMessages: 6,
    messages: [
      { role: 'user', content: 'legacy question' },
      { role: 'assistant', content: 'legacy answer' },
    ],
    trimmedMessages: 2,
  });

  assert.deepEqual(
    getMessages(restored).map((message) => message.role),
    ['system', 'user', 'assistant'],
  );
  assert.equal(getMemoryStats(restored).trimmedMessages, 2);
  assert.equal(getMemoryStats(restored).compressionCount, 0);
  assert.equal(getMemoryStats(restored).compressedMessages, 0);
});

test('rejects invalid memory snapshots and messages', () => {
  assert.throws(() => restoreMemory(null), /snapshot must be an object/i);
  assert.throws(() => restoreMemory([]), /snapshot must be an object/i);
  assert.throws(() => restoreMemory({ messages: null }), /messages must be an array/i);
  assert.throws(() => restoreMemory({ messages: [null] }), /message must be an object/i);
  assert.throws(
    () => restoreMemory({ messages: [{ role: 'developer', content: 'unsupported' }] }),
    /unsupported memory message role/i,
  );
  assert.throws(
    () => restoreMemory({ messages: [{ role: 'user', content: 42 }] }),
    /content must be a string/i,
  );
});
