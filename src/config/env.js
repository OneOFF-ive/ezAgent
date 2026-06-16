import dotenv from 'dotenv';
import { resolveAgentConfig } from './agent-config.js';
import { resolveLlmConfig } from './llm-config.js';

dotenv.config();

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

const userConfigPath = process.env.USER_CONFIG_PATH || './user-config.json';
const agentConfigPath = process.env.AGENT_CONFIG_PATH || './agent.json';
const agent = resolveAgentConfig(agentConfigPath);
const llm = resolveLlmConfig(userConfigPath, {
  temperature: process.env.LLM_TEMPERATURE,
  maxTokens: process.env.LLM_MAX_TOKENS,
  anthropicVersion: process.env.ANTHROPIC_VERSION,
  toNumber,
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL || 'debug',
  maxSteps: toNumber(process.env.MAX_STEPS, 5),
  httpProxyUrl: process.env.HTTP_PROXY_URL || null,
  userConfigPath,
  agentConfigPath,
  agent,
  llm,
};
