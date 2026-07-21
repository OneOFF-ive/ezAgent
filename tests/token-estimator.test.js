import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimateMessageTokens,
  estimateMessagesTokens,
  estimateTextTokens,
} from '../src/agent/token-estimator.js';

test('estimates ASCII and non-ASCII text with the generic heuristic', () => {
  assert.equal(estimateTextTokens('abcd'), 1);
  assert.equal(estimateTextTokens('你好'), 2);
  assert.equal(estimateTextTokens('ab你好'), 3);
});

test('includes per-message overhead in the token estimate', () => {
  const messages = [
    { role: 'user', content: 'abcd' },
    { role: 'assistant', content: '你好' },
  ];

  assert.equal(estimateMessageTokens(messages[0]), 5);
  assert.equal(estimateMessagesTokens(messages), 11);
});
