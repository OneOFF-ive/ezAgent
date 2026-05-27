import { env } from '../config/env.js';
import { updateActiveModelId } from '../config/user-config.js';

const SYSTEM_PROMPT = 'You are a helpful assistant.';

export function createInitialMessages() {
  return [{ role: 'system', content: SYSTEM_PROMPT }];
}

export function createCliState() {
  return {
    messages: createInitialMessages(),
    currentModelId: env.llm.activeModelId,
  };
}

export function getModelById(modelId) {
  return env.llm.models[modelId];
}

export function getCurrentModel(state) {
  return getModelById(state.currentModelId);
}

export function clearMessages(state) {
  state.messages = createInitialMessages();
}

export function rollbackLastUserMessage(state) {
  state.messages = state.messages.slice(0, -1);
}

export function switchModel(state, nextModelId) {
  const nextModel = getModelById(nextModelId);

  if (!nextModel) {
    return null;
  }

  state.currentModelId = nextModelId;
  updateActiveModelId(env.userConfigPath, state.currentModelId);
  return nextModel;
}
