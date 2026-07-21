import dotenv from 'dotenv';
import { resolveAgentConfig } from './agent-config.js';
import { resolveLlmConfig } from './llm-config.js';

dotenv.config();

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function toPositiveInteger(value, fallback, minimum = 1) {
  const num = toNumber(value, fallback);

  if (!Number.isFinite(num) || num < 1) {
    return fallback;
  }

  return Math.max(Math.floor(num), minimum);
}

function toNonNegativeInteger(value, fallback) {
  const num = toNumber(value, fallback);

  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }

  return Math.floor(num);
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

const userConfigPath = process.env.USER_CONFIG_PATH || './user-config.json';
const agentConfigPath = process.env.AGENT_CONFIG_PATH || './agent.json';
const agent = resolveAgentConfig(agentConfigPath);
const memoryMaxMessages = toPositiveInteger(process.env.MEMORY_MAX_MESSAGES, 100, 2);
const memoryMaxTokens = toPositiveInteger(process.env.MEMORY_MAX_TOKENS, 12000, 100);
const compressionThresholdTokens = Math.floor(memoryMaxTokens * 0.8);
const compressionKeepRecentTokens = Math.floor(memoryMaxTokens * 0.3);
const llm = resolveLlmConfig(userConfigPath, {
  temperature: process.env.LLM_TEMPERATURE,
  maxTokens: process.env.LLM_MAX_TOKENS,
  anthropicVersion: process.env.ANTHROPIC_VERSION,
  toNumber,
});

export const env = {
  httpProxyUrl: process.env.HTTP_PROXY_URL || null,
  userConfigPath,
  agent,
  memory: {
    maxMessages: memoryMaxMessages,
    maxTokens: memoryMaxTokens,
    sessionDir: process.env.MEMORY_SESSION_DIR || './data/sessions',
    compression: {
      enabled: toBoolean(process.env.MEMORY_COMPRESSION_ENABLED, true),
      thresholdTokens: compressionThresholdTokens,
      keepRecentTokens: compressionKeepRecentTokens,
    },
  },
  llm: {
    ...llm,
    request: {
      timeoutMs: toPositiveInteger(process.env.LLM_REQUEST_TIMEOUT_MS, 30000, 100),
      // 这里记录的是“额外重试次数”，0 表示只执行首次请求。
      maxRetries: toNonNegativeInteger(process.env.LLM_MAX_RETRIES, 1),
      retryDelayMs: toNonNegativeInteger(process.env.LLM_RETRY_DELAY_MS, 500),
    },
  },
};
