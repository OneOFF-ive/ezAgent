import assert from 'node:assert/strict';
import test from 'node:test';
import { generateText } from '../src/llm/client.js';

const model = {
  id: 'test-model',
  protocol: 'openai-completions',
  baseUrl: 'https://example.test/v1',
  apiKey: 'test-key',
  model: 'test-model-name',
  temperature: 0,
  maxTokens: 100,
  anthropicVersion: '2023-06-01',
};

const messages = [{ role: 'user', content: 'hello' }];

function createResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}

function createRuntime(fetchImpl, overrides = {}) {
  return {
    fetchImpl,
    requestPolicy: {
      timeoutMs: 1234,
      maxRetries: 1,
      retryDelayMs: 10,
      ...overrides.requestPolicy,
    },
    createTimeoutSignal: () => 'test-timeout-signal',
    waitImpl: overrides.waitImpl ?? (async () => {}),
  };
}

test('returns model text and applies a timeout signal', async () => {
  let receivedOptions;
  const runtime = createRuntime(async (_url, options) => {
    receivedOptions = options;
    return createResponse(200, {
      choices: [{ message: { content: 'success' } }],
    });
  });

  const result = await generateText(messages, model, runtime);

  assert.equal(result, 'success');
  assert.equal(receivedOptions.signal, 'test-timeout-signal');
});

test('retries a retryable API response with exponential delay', async () => {
  let attempts = 0;
  const delays = [];
  const runtime = createRuntime(
    async () => {
      attempts += 1;

      if (attempts === 1) {
        return createResponse(503, { error: { message: 'temporarily unavailable' } });
      }

      return createResponse(200, {
        choices: [{ message: { content: 'recovered' } }],
      });
    },
    {
      waitImpl: async (delayMs) => delays.push(delayMs),
    },
  );

  const result = await generateText(messages, model, runtime);

  assert.equal(result, 'recovered');
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [10]);
});

test('retries a network failure and returns a clear error after exhaustion', async () => {
  let attempts = 0;
  const runtime = createRuntime(async () => {
    attempts += 1;
    throw new Error('socket disconnected');
  });

  await assert.rejects(
    generateText(messages, model, runtime),
    /LLM network request failed.*socket disconnected/,
  );
  assert.equal(attempts, 2);
});

test('reports request timeout after retry exhaustion', async () => {
  const timeoutError = new Error('timed out');
  timeoutError.name = 'TimeoutError';
  const runtime = createRuntime(async () => {
    throw timeoutError;
  });

  await assert.rejects(generateText(messages, model, runtime), /LLM request timed out.*1234 ms/);
});

test('does not retry permanent API errors or insufficient quota', async () => {
  for (const response of [
    createResponse(400, { error: { message: 'bad request', code: 'invalid_request' } }),
    createResponse(429, { error: { message: 'quota', code: 'insufficient_quota' } }),
  ]) {
    let attempts = 0;
    const runtime = createRuntime(async () => {
      attempts += 1;
      return response;
    });

    await assert.rejects(generateText(messages, model, runtime));
    assert.equal(attempts, 1);
  }
});
