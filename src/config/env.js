import dotenv from 'dotenv';

dotenv.config();

function requiredEnv(name, value) {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not defined.`);
  }

  return value;
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function resolveLlmConfig() {
  const provider = pickFirst(process.env.LLM_PROVIDER, 'openai');
  const volcengineBaseUrl =
    process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3';

  const providerDefaults = {
    openai: {
      apiStyle: 'responses',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    'volcengine-coding': {
      apiStyle: 'chat-completions',
      baseUrl: volcengineBaseUrl,
      apiKey: process.env.VOLCENGINE_API_KEY,
      model: process.env.VOLCENGINE_MODEL || 'ark-code-latest',
    },
    'openai-compatible': {
      apiStyle: 'chat-completions',
      baseUrl: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    },
  };

  const defaults = providerDefaults[provider];

  if (!defaults) {
    throw new Error(
      `Unsupported LLM_PROVIDER "${provider}". Use "openai", "volcengine-coding", or "openai-compatible".`,
    );
  }

  const apiStyle = pickFirst(process.env.LLM_API_STYLE, defaults.apiStyle);
  const apiKey = pickFirst(
    process.env.LLM_API_KEY,
    defaults.apiKey,
    process.env.OPENAI_API_KEY,
    process.env.VOLCENGINE_API_KEY,
  );
  const baseUrl = pickFirst(
    process.env.LLM_BASE_URL,
    defaults.baseUrl,
    process.env.OPENAI_BASE_URL,
    volcengineBaseUrl,
  );
  const model = pickFirst(
    process.env.LLM_MODEL,
    defaults.model,
    process.env.OPENAI_MODEL,
    process.env.VOLCENGINE_MODEL,
  );

  return {
    provider,
    apiStyle,
    apiKey: requiredEnv('LLM_API_KEY', apiKey),
    baseUrl: requiredEnv('LLM_BASE_URL', baseUrl),
    model: requiredEnv('LLM_MODEL', model),
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
