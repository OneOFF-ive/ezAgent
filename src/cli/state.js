import { env } from '../config/env.js';
import { updateActiveModelId } from '../config/user-config.js';
import {
  appendAssistantMessage as appendMemoryAssistantMessage,
  appendUserMessage as appendMemoryUserMessage,
  clearMemory,
  createMemory,
  getMemoryStats as getAgentMemoryStats,
  getMessages as getMemoryMessages,
  rollbackLastUserMessage as rollbackMemoryLastUserMessage,
} from '../agent/memory.js';

export function createCliState() {
  return {
    agent: env.agent,
    memory: createMemory({ maxMessages: env.memory.maxMessages }),
    currentModelId: env.llm.activeModelId,
  };
}

export function getMessages(state) {
  return getMemoryMessages(state.memory);
}

export function getMemoryStats(state) {
  return getAgentMemoryStats(state.memory);
}

export function appendUserMessage(state, content) {
  return appendMemoryUserMessage(state.memory, content);
}

export function appendAssistantMessage(state, content) {
  return appendMemoryAssistantMessage(state.memory, content);
}

export function getModelById(modelId) {
  return env.llm.models[modelId];
}

export function getCurrentModel(state) {
  return getModelById(state.currentModelId);
}

export function clearMessages(state) {
  clearMemory(state.memory);
}

export function rollbackLastUserMessage(state) {
  rollbackMemoryLastUserMessage(state.memory);
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
