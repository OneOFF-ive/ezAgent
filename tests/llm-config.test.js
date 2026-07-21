import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { resolveLlmConfig } from '../src/config/llm-config.js';
import { createTempDir } from '../test-support/temp-dir.js';

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
}

function systemDefaults(overrides = {}) {
  return {
    temperature: undefined,
    maxTokens: undefined,
    anthropicVersion: undefined,
    toNumber,
    ...overrides,
  };
}

function writeConfig(directory, fileName, config) {
  const filePath = path.join(directory, fileName);
  fs.writeFileSync(filePath, JSON.stringify(config));
  return filePath;
}

test('resolves model defaults and normalizes the base URL', (t) => {
  const directory = createTempDir(t, 'ezagent-llm-config-test-');
  const configPath = writeConfig(directory, 'defaults.json', {
    models: {
      primary: {
        protocol: 'openai-responses',
        baseUrl: 'https://example.test/v1///',
        apiKey: 'test-key',
      },
    },
  });

  const config = resolveLlmConfig(configPath, systemDefaults());

  assert.equal(config.activeModelId, 'primary');
  assert.deepEqual(config.modelIds, ['primary']);
  assert.equal(config.activeModel.baseUrl, 'https://example.test/v1');
  assert.equal(config.activeModel.model, 'primary');
  assert.equal(config.activeModel.temperature, 0.7);
  assert.equal(config.activeModel.maxTokens, 1024);
  assert.equal(config.activeModel.anthropicVersion, '2023-06-01');
});

test('applies shared defaults and model-level overrides', (t) => {
  const directory = createTempDir(t, 'ezagent-llm-config-test-');
  const configPath = writeConfig(directory, 'overrides.json', {
    activeModelId: 'secondary',
    models: {
      primary: {
        protocol: 'openai-completions',
        baseUrl: 'https://primary.test',
        apiKey: 'primary-key',
      },
      secondary: {
        protocol: 'anthropic-messages',
        baseUrl: 'https://secondary.test',
        apiKey: 'secondary-key',
        model: 'secondary-model',
        temperature: 0.2,
        maxTokens: 4096,
        anthropicVersion: 'custom-version',
      },
    },
  });

  const config = resolveLlmConfig(
    configPath,
    systemDefaults({ temperature: 0.5, maxTokens: 2048, anthropicVersion: 'shared-version' }),
  );

  assert.equal(config.models.primary.temperature, 0.5);
  assert.equal(config.models.primary.maxTokens, 2048);
  assert.equal(config.models.primary.anthropicVersion, 'shared-version');
  assert.equal(config.activeModel.model, 'secondary-model');
  assert.equal(config.activeModel.temperature, 0.2);
  assert.equal(config.activeModel.maxTokens, 4096);
  assert.equal(config.activeModel.anthropicVersion, 'custom-version');
});

test('rejects invalid root config shapes and empty model registries', (t) => {
  const directory = createTempDir(t, 'ezagent-llm-config-test-');
  const cases = [
    ['null.json', null, /must be a JSON object/i],
    ['array.json', [], /must be a JSON object/i],
    ['missing-models.json', {}, /must contain a "models" object/i],
    ['array-models.json', { models: [] }, /must contain a "models" object/i],
    ['empty-models.json', { models: {} }, /define at least one model/i],
  ];

  for (const [fileName, config, expectedError] of cases) {
    const configPath = writeConfig(directory, fileName, config);
    assert.throws(() => resolveLlmConfig(configPath, systemDefaults()), expectedError);
  }
});

test('rejects unsupported protocols and missing required model fields', (t) => {
  const directory = createTempDir(t, 'ezagent-llm-config-test-');
  const cases = [
    [
      'protocol.json',
      {
        models: {
          bad: { protocol: 'unknown', baseUrl: 'https://example.test', apiKey: 'key' },
        },
      },
      /unsupported LLM protocol/i,
    ],
    [
      'base-url.json',
      { models: { bad: { protocol: 'openai-responses', apiKey: 'key' } } },
      /models\.bad\.baseUrl.*required/i,
    ],
    [
      'api-key.json',
      {
        models: { bad: { protocol: 'openai-responses', baseUrl: 'https://example.test' } },
      },
      /models\.bad\.apiKey.*required/i,
    ],
  ];

  for (const [fileName, config, expectedError] of cases) {
    const configPath = writeConfig(directory, fileName, config);
    assert.throws(() => resolveLlmConfig(configPath, systemDefaults()), expectedError);
  }
});

test('rejects an active model id that is not registered', (t) => {
  const directory = createTempDir(t, 'ezagent-llm-config-test-');
  const configPath = writeConfig(directory, 'active-model.json', {
    activeModelId: 'missing',
    models: {
      primary: {
        protocol: 'openai-responses',
        baseUrl: 'https://example.test',
        apiKey: 'key',
      },
    },
  });

  assert.throws(
    () => resolveLlmConfig(configPath, systemDefaults()),
    /activeModelId "missing" is not registered/i,
  );
});
