import dotenv from 'dotenv';
import { LLM_PROTOCOLS } from '../llm/protocols.js';

dotenv.config();

function requiredEnv(name, value, options = {}) {
  // 对必填配置做统一校验。
  // 这里既处理“未定义”，也处理“字符串存在但实际为空白”的情况。
  const { sources = [] } = options;

  if (typeof value === 'string') {
    const normalized = value.trim();

    if (!normalized) {
      const sourceHint =
        sources.length > 0 ? ` Expected one of: ${sources.join(', ')}.` : '';
      throw new Error(`Environment variable ${name} is required but is empty.${sourceHint}`);
    }

    return normalized;
  }

  if (value === undefined || value === null) {
    const sourceHint =
      sources.length > 0 ? ` Expected one of: ${sources.join(', ')}.` : '';
    throw new Error(`Environment variable ${name} is required but not defined.${sourceHint}`);
  }

  return value;
}

function toNumber(value, fallback) {
  // 环境变量默认都是字符串，这里负责把需要的值转成数字。
  // 如果转换失败，则回退到约定的默认值。
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function pickFirst(...values) {
  // 在多个候选值里选第一个有效值，用于实现“显式配置优先，其次回退默认值”。
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function parseCsv(value) {
  // 把逗号分隔的模型列表解析成数组，并清掉首尾空白和空项。
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeModelIdForEnv(modelId) {
  // 用户可以自由定义模型别名，但环境变量名需要更稳定的格式。
  // 这里把别名统一转成适合拼接环境变量名的大写下划线形式。
  return modelId.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
}

function modelEnvName(modelId, suffix) {
  // 根据模型别名和字段后缀，生成这一组模型专属环境变量名。
  return `LLM_MODEL_${normalizeModelIdForEnv(modelId)}_${suffix}`;
}

function normalizeBaseUrl(baseUrl) {
  // 去掉结尾多余的斜杠，避免后面拼接 path 时出现双斜杠。
  return baseUrl.replace(/\/+$/g, '');
}

function validateProtocol(protocol) {
  // 协议类型只允许来自系统当前支持的三种协议。
  const supportedProtocols = new Set(Object.values(LLM_PROTOCOLS));

  if (!supportedProtocols.has(protocol)) {
    throw new Error(
      `Unsupported LLM protocol "${protocol}". Use one of: ${Array.from(supportedProtocols).join(', ')}.`,
    );
  }
}

function resolveModelConfig(modelId) {
  // 这一层负责把“单个模型”的整组环境变量解析成统一配置对象。
  const protocolEnvName = modelEnvName(modelId, 'PROTOCOL');
  const baseUrlEnvName = modelEnvName(modelId, 'BASE_URL');
  const apiKeyEnvName = modelEnvName(modelId, 'API_KEY');
  const modelNameEnvName = modelEnvName(modelId, 'MODEL');
  const temperatureEnvName = modelEnvName(modelId, 'TEMPERATURE');
  const maxTokensEnvName = modelEnvName(modelId, 'MAX_TOKENS');
  const anthropicVersionEnvName = modelEnvName(modelId, 'ANTHROPIC_VERSION');

  const protocol = requiredEnv(protocolEnvName, process.env[protocolEnvName], {
    sources: [protocolEnvName],
  });
  validateProtocol(protocol);

  const baseUrl = normalizeBaseUrl(
    requiredEnv(baseUrlEnvName, process.env[baseUrlEnvName], {
      sources: [baseUrlEnvName],
    }),
  );
  const apiKey = requiredEnv(apiKeyEnvName, process.env[apiKeyEnvName], {
    sources: [apiKeyEnvName],
  });
  // MODEL 可选；如果不显式提供，就默认使用用户注册时声明的模型 ID。
  // 这样最小配置只需要协议、URL、API Key 三项。
  const modelName = requiredEnv(
    modelNameEnvName,
    pickFirst(process.env[modelNameEnvName], modelId),
    {
      sources: [modelNameEnvName],
    },
  );
  const temperature = toNumber(
    pickFirst(process.env[temperatureEnvName], process.env.LLM_TEMPERATURE),
    0.7,
  );
  const maxTokens = toNumber(
    pickFirst(process.env[maxTokensEnvName], process.env.LLM_MAX_TOKENS),
    1024,
  );
  const anthropicVersion = requiredEnv(
    anthropicVersionEnvName,
    pickFirst(process.env[anthropicVersionEnvName], process.env.ANTHROPIC_VERSION, '2023-06-01'),
    { sources: [anthropicVersionEnvName, 'ANTHROPIC_VERSION'] },
  );

  return {
    id: modelId,
    envPrefix: `LLM_MODEL_${normalizeModelIdForEnv(modelId)}`,
    protocol,
    baseUrl,
    apiKey,
    model: modelName,
    temperature,
    maxTokens,
    anthropicVersion,
  };
}

function resolveLlmConfig() {
  // 使用显式模型注册表，通过 LLM_ACTIVE_MODEL 选择当前实际调用哪一个。
  const modelIds = parseCsv(
    requiredEnv('LLM_MODELS', process.env.LLM_MODELS, {
      sources: ['LLM_MODELS'],
    }),
  );

  const activeModelId = requiredEnv(
    'LLM_ACTIVE_MODEL',
    pickFirst(process.env.LLM_ACTIVE_MODEL, modelIds[0]),
    { sources: ['LLM_ACTIVE_MODEL'] },
  );

  const models = Object.fromEntries(modelIds.map((modelId) => [modelId, resolveModelConfig(modelId)]));
  const activeModel = models[activeModelId];

  if (!activeModel) {
    throw new Error(
      `LLM_ACTIVE_MODEL "${activeModelId}" is not registered in LLM_MODELS (${modelIds.join(', ')}).`,
    );
  }

  return {
    modelIds,
    activeModelId,
    activeModel,
    models,
  };
}

const llm = resolveLlmConfig();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL || 'debug',
  maxSteps: toNumber(process.env.MAX_STEPS, 5),
  httpProxyUrl: process.env.HTTP_PROXY_URL || null,
  llm,
};
