import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LLM_PROTOCOLS,
  buildHeadersByProtocol,
  buildRequestBodyByProtocol,
  endpointPathByProtocol,
  extractTextByProtocol,
} from '../src/llm/protocols.js';

const config = {
  apiKey: 'test-key',
  model: 'test-model',
  temperature: 0.3,
  maxTokens: 2048,
  anthropicVersion: 'test-version',
};

const messages = [
  { role: 'system', content: 'system prompt' },
  { role: 'developer', content: 'developer prompt' },
  { role: 'user', content: 'hello' },
  { role: 'assistant', content: 'hi' },
];

test('maps each protocol to its endpoint path', () => {
  assert.equal(endpointPathByProtocol(LLM_PROTOCOLS.OPENAI_RESPONSES), '/responses');
  assert.equal(endpointPathByProtocol(LLM_PROTOCOLS.OPENAI_COMPLETIONS), '/chat/completions');
  assert.equal(endpointPathByProtocol(LLM_PROTOCOLS.ANTHROPIC_MESSAGES), '/messages');
});

test('builds OpenAI-compatible request bodies and headers', () => {
  for (const protocol of [LLM_PROTOCOLS.OPENAI_RESPONSES, LLM_PROTOCOLS.OPENAI_COMPLETIONS]) {
    const headers = buildHeadersByProtocol(protocol, config);
    const body = buildRequestBodyByProtocol(protocol, config, messages);

    assert.equal(headers.Authorization, 'Bearer test-key');
    assert.equal(headers['Content-Type'], 'application/json');
    assert.equal(body.model, 'test-model');
    assert.equal(body.temperature, 0.3);
  }

  assert.deepEqual(
    buildRequestBodyByProtocol(LLM_PROTOCOLS.OPENAI_RESPONSES, config, messages).input,
    messages,
  );
  assert.deepEqual(
    buildRequestBodyByProtocol(LLM_PROTOCOLS.OPENAI_COMPLETIONS, config, messages).messages,
    messages,
  );
});

test('moves Anthropic system instructions to the top-level system field', () => {
  const headers = buildHeadersByProtocol(LLM_PROTOCOLS.ANTHROPIC_MESSAGES, config);
  const body = buildRequestBodyByProtocol(LLM_PROTOCOLS.ANTHROPIC_MESSAGES, config, messages);

  assert.deepEqual(headers, {
    'Content-Type': 'application/json',
    'x-api-key': 'test-key',
    'anthropic-version': 'test-version',
  });
  assert.equal(body.system, 'system prompt\n\ndeveloper prompt');
  assert.deepEqual(body.messages, messages.slice(2));
  assert.equal(body.max_tokens, 2048);
});

test('extracts text from all supported response shapes', () => {
  assert.equal(
    extractTextByProtocol(LLM_PROTOCOLS.OPENAI_RESPONSES, { output_text: 'responses text' }),
    'responses text',
  );
  assert.equal(
    extractTextByProtocol(LLM_PROTOCOLS.OPENAI_COMPLETIONS, {
      choices: [{ message: { content: 'completion text' } }],
    }),
    'completion text',
  );
  assert.equal(
    extractTextByProtocol(LLM_PROTOCOLS.ANTHROPIC_MESSAGES, {
      content: [
        { type: 'text', text: 'part one' },
        { type: 'tool_use', id: 'ignored' },
        { type: 'text', text: ' and two' },
      ],
    }),
    'part one and two',
  );
});

test('rejects unsupported protocols when building requests', () => {
  assert.throws(() => endpointPathByProtocol('unknown'), /unsupported LLM protocol/i);
  assert.throws(() => buildHeadersByProtocol('unknown', config), /unsupported LLM protocol/i);
  assert.throws(
    () => buildRequestBodyByProtocol('unknown', config, messages),
    /unsupported LLM protocol/i,
  );
  assert.equal(extractTextByProtocol('unknown', {}), '');
});
