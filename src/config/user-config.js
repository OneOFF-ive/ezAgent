import fs from 'node:fs';
import path from 'node:path';

function resolveUserConfigPath(configPath) {
  return path.resolve(process.cwd(), configPath);
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function loadUserConfig(configPath) {
  const filePath = resolveUserConfigPath(configPath);
  return readJsonFile(filePath);
}

function saveUserConfig(configPath, config) {
  const filePath = resolveUserConfigPath(configPath);
  fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`);
}

export function updateActiveModelId(configPath, activeModelId) {
  const config = loadUserConfig(configPath);
  config.activeModelId = activeModelId;
  saveUserConfig(configPath, config);
}

export function getUserConfigFilePath(configPath) {
  return resolveUserConfigPath(configPath);
}
