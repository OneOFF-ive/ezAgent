import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendAssistantMessage,
  appendUserMessage,
  createMemory,
  createMemorySnapshot,
  getMessages,
  getMemoryStats,
} from '../src/agent/memory.js';
import { compressMemoryContext } from '../src/agent/context-compressor.js';
import { estimateMessagesTokens } from '../src/agent/token-estimator.js';

function appendConversation(memory, count) {
  for (let index = 1; index <= count; index += 1) {
    const append = index % 2 === 1 ? appendUserMessage : appendAssistantMessage;
    append(memory, `message-${index}`);
  }
}

test('compresses older messages and preserves the recent conversation', async () => {
  const memory = createMemory({ maxMessages: 20 });
  appendConversation(memory, 6);
  const currentMessages = getMessages(memory);
  const currentTokenCount = estimateMessagesTokens(currentMessages);
  const keepRecentTokens = estimateMessagesTokens(currentMessages.slice(-2));
  let compressionRequest;

  const result = await compressMemoryContext(memory, {
    enabled: true,
    thresholdTokens: currentTokenCount,
    keepRecentTokens,
    summarize: async (messages) => {
      compressionRequest = messages;
      return 'The user and assistant discussed messages 1 through 4.';
    },
  });

  assert.equal(result.sourceMessageCount, 4);
  assert.equal(result.retainedMessageCount, 2);
  assert.equal(result.tokenCountBefore, currentTokenCount);
  assert.ok(result.tokenCountAfter < result.tokenCountBefore);
  assert.match(compressionRequest[1].content, /message-1/);
  assert.doesNotMatch(compressionRequest[1].content, /message-5/);
  assert.deepEqual(
    getMessages(memory).map((message) => message.role),
    ['system', 'system', 'user', 'assistant'],
  );
  assert.match(getMessages(memory)[1].content, /Earlier conversation summary/);
  assert.equal(getMessages(memory)[2].content, 'message-5');
  assert.deepEqual(getMemoryStats(memory), {
    messageCount: 4,
    maxMessages: 20,
    conversationMessageCount: 2,
    trimmedMessages: 0,
    compressionCount: 1,
    compressedMessages: 4,
  });
});

test('does not call the API before the compression threshold', async () => {
  const memory = createMemory({ maxMessages: 20 });
  appendConversation(memory, 3);
  const currentTokenCount = estimateMessagesTokens(getMessages(memory));
  let called = false;

  const result = await compressMemoryContext(memory, {
    enabled: true,
    thresholdTokens: currentTokenCount + 1,
    keepRecentTokens: 10,
    summarize: async () => {
      called = true;
      return 'unused';
    },
  });

  assert.equal(result, null);
  assert.equal(called, false);
});

test('keeps memory unchanged when the API returns an empty summary', async () => {
  const memory = createMemory({ maxMessages: 20 });
  appendConversation(memory, 4);
  const currentMessages = getMessages(memory);
  const before = createMemorySnapshot(memory);

  await assert.rejects(
    compressMemoryContext(memory, {
      enabled: true,
      thresholdTokens: estimateMessagesTokens(currentMessages),
      keepRecentTokens: estimateMessagesTokens(currentMessages.slice(-2)),
      summarize: async () => '   ',
    }),
    /empty summary/,
  );

  assert.deepEqual(createMemorySnapshot(memory), before);
});
