import { LLM_PROTOCOLS } from '../llm/protocols.js';
import { loadUserConfig } from './user-config.js';

function buildSourceHint(sources) {
  return sources.length > 0 ? ` Expected one of: ${sources.join(', ')}.` : '';
}

function requiredEnv(name, value, options = {}) {
  const { sources = [] } = options;
  const sourceHint = buildSourceHint(sources);

  if (typeof value === 'string') {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error(`Environment variable ${name} is required but is empty.${sourceHint}`);
    }

    return normalized;
  }

  if (value === undefined || value === null) {
    throw new Error(`Environment variable ${name} is required but not defined.${sourceHint}`);
  }

  return value;
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/g, '');
}

function validateProtocol(protocol) {
  const supportedProtocols = new Set(Object.values(LLM_PROTOCOLS));

  if (!supportedProtocols.has(protocol)) {
    throw new Error(
      `Unsupported LLM protocol "${protocol}". Use one of: ${Array.from(supportedProtocols).join(', ')}.`,
    );
  }
}

function validateUserConfigShape(userConfig) {
  if (!userConfig || typeof userConfig !== 'object' || Array.isArray(userConfig)) {
    throw new Error('User config must be a JSON object.');
  }

  if (
    !userConfig.models ||
    typeof userConfig.models !== 'object' ||
    Array.isArray(userConfig.models)
  ) {
    throw new Error('User config must contain a "models" object.');
  }
}

function resolveModelConfig(modelId, rawModelConfig, systemDefaults) {
  if (!rawModelConfig || typeof rawModelConfig !== 'object' || Array.isArray(rawModelConfig)) {
    throw new Error(`Model "${modelId}" must be configured as an object.`);
  }

  const protocol = requiredEnv(`models.${modelId}.protocol`, rawModelConfig.protocol, {
    sources: [`models.${modelId}.protocol`],
  });
  validateProtocol(protocol);

  const baseUrl = normalizeBaseUrl(
    requiredEnv(`models.${modelId}.baseUrl`, rawModelConfig.baseUrl, {
      sources: [`models.${modelId}.baseUrl`],
    }),
  );
  const apiKey = requiredEnv(`models.${modelId}.apiKey`, rawModelConfig.apiKey, {
    sources: [`models.${modelId}.apiKey`],
  });
  const modelName = requiredEnv(
    `models.${modelId}.model`,
    pickFirst(rawModelConfig.model, modelId),
    {
      sources: [`models.${modelId}.model`],
    },
  );

  return {
    id: modelId,
    protocol,
    baseUrl,
    apiKey,
    model: modelName,
    temperature: systemDefaults.toNumber(
      pickFirst(rawModelConfig.temperature, systemDefaults.temperature),
      0.7,
    ),
    maxTokens: systemDefaults.toNumber(
      pickFirst(rawModelConfig.maxTokens, systemDefaults.maxTokens),
      1024,
    ),
    anthropicVersion: requiredEnv(
      `models.${modelId}.anthropicVersion`,
      pickFirst(rawModelConfig.anthropicVersion, systemDefaults.anthropicVersion, '2023-06-01'),
      {
        sources: [`models.${modelId}.anthropicVersion`, 'ANTHROPIC_VERSION'],
      },
    ),
  };
}

export function resolveLlmConfig(userConfigPath, systemDefaults) {
  const userConfig = loadUserConfig(userConfigPath);
  validateUserConfigShape(userConfig);

  const modelIds = Object.keys(userConfig.models);

  if (modelIds.length === 0) {
    throw new Error('User config must define at least one model in "models".');
  }

  const activeModelId = requiredEnv(
    'activeModelId',
    pickFirst(userConfig.activeModelId, modelIds[0]),
    { sources: ['activeModelId'] },
  );

  const models = Object.fromEntries(
    modelIds.map((modelId) => [
      modelId,
      resolveModelConfig(modelId, userConfig.models[modelId], systemDefaults),
    ]),
  );
  const activeModel = models[activeModelId];

  if (!activeModel) {
    throw new Error(
      `activeModelId "${activeModelId}" is not registered in user config models (${modelIds.join(', ')}).`,
    );
  }

  return {
    modelIds,
    activeModelId,
    activeModel,
    models,
  };
}
