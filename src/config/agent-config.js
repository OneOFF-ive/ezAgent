import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_AGENT_NAME = 'ezAgent';
export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

function resolveProjectPath(filePath) {
  return path.resolve(process.cwd(), filePath);
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function assertConfigObject(config, filePath) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`Agent config must be a JSON object: ${filePath}`);
  }
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function resolveRelativePath(baseFilePath, targetPath) {
  if (path.isAbsolute(targetPath)) {
    return targetPath;
  }

  return path.resolve(path.dirname(baseFilePath), targetPath);
}

function readSoulPrompt(soulFilePath) {
  if (!fs.existsSync(soulFilePath)) {
    throw new Error(`Soul file does not exist: ${soulFilePath}`);
  }

  const prompt = fs.readFileSync(soulFilePath, 'utf8').trim();

  if (!prompt) {
    throw new Error(`Soul file must not be empty: ${soulFilePath}`);
  }

  return prompt;
}

function createDefaultAgentConfig(configFilePath) {
  return {
    name: DEFAULT_AGENT_NAME,
    description: 'Default built-in agent.',
    configPath: configFilePath,
    soulPath: null,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    promptSource: 'built-in default prompt',
  };
}

export function resolveAgentConfig(configPath) {
  const configFilePath = resolveProjectPath(configPath);

  if (!fs.existsSync(configFilePath)) {
    return createDefaultAgentConfig(configFilePath);
  }

  const rawConfig = readJsonFile(configFilePath);
  assertConfigObject(rawConfig, configFilePath);

  const name = normalizeOptionalString(rawConfig.name) || DEFAULT_AGENT_NAME;
  const description = normalizeOptionalString(rawConfig.description) || '';
  const soulPathValue = normalizeOptionalString(rawConfig.soulPath);
  const inlinePrompt = normalizeOptionalString(rawConfig.systemPrompt);

  if (soulPathValue) {
    const soulFilePath = resolveRelativePath(configFilePath, soulPathValue);

    return {
      name,
      description,
      configPath: configFilePath,
      soulPath: soulFilePath,
      systemPrompt: readSoulPrompt(soulFilePath),
      promptSource: soulFilePath,
    };
  }

  return {
    name,
    description,
    configPath: configFilePath,
    soulPath: null,
    systemPrompt: inlinePrompt || DEFAULT_SYSTEM_PROMPT,
    promptSource: inlinePrompt ? configFilePath : 'built-in default prompt',
  };
}
