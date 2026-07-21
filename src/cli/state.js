import { env } from '../config/env.js';
import { updateActiveModelId } from '../config/user-config.js';
import {
  appendAssistantMessage as appendMemoryAssistantMessage,
  appendUserMessage as appendMemoryUserMessage,
  clearMemory,
  createMemory,
  createMemorySnapshot,
  getMemoryStats as getAgentMemoryStats,
  getMessages as getMemoryMessages,
  restoreMemory,
  rollbackLastUserMessage as rollbackMemoryLastUserMessage,
} from '../agent/memory.js';
import { listSessions, loadSession, saveSession } from '../agent/session-store.js';
import { compressMemoryContext } from '../agent/context-compressor.js';
import { estimateMessagesTokens } from '../agent/token-estimator.js';

function createInitialMemory() {
  return {
    memory: createMemory({ maxMessages: env.memory.maxMessages }),
    lastSavedAt: null,
    sessionLoaded: false,
  };
}

export function createCliState() {
  const initialMemory = createInitialMemory();

  return {
    agent: env.agent,
    memory: initialMemory.memory,
    memoryMaxTokens: env.memory.maxTokens,
    memoryCompression: env.memory.compression,
    sessionDir: env.memory.sessionDir,
    activeSession: null,
    lastSavedAt: initialMemory.lastSavedAt,
    sessionLoaded: initialMemory.sessionLoaded,
    currentModelId: env.llm.activeModelId,
  };
}

export function getMessages(state) {
  return getMemoryMessages(state.memory);
}

export function getMemoryStats(state) {
  return {
    ...getAgentMemoryStats(state.memory),
    estimatedTokens: estimateMessagesTokens(getMemoryMessages(state.memory)),
    maxTokens: state.memoryMaxTokens,
    compressionEnabled: state.memoryCompression.enabled,
    compressionThresholdTokens: state.memoryCompression.thresholdTokens,
    compressionKeepRecentTokens: state.memoryCompression.keepRecentTokens,
  };
}

export function getSessionInfo(state) {
  return {
    activeSession: state.activeSession,
    sessionDir: state.sessionDir,
    lastSavedAt: state.lastSavedAt,
    sessionLoaded: state.sessionLoaded,
    memory: getMemoryStats(state),
  };
}

export function appendUserMessage(state, content) {
  return appendMemoryUserMessage(state.memory, content);
}

export function appendAssistantMessage(state, content) {
  return appendMemoryAssistantMessage(state.memory, content);
}

export function compressCurrentContext(state, summarize) {
  return compressMemoryContext(state.memory, {
    ...state.memoryCompression,
    summarize,
  });
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

export function startNewSession(state, sessionId) {
  state.memory = createMemory({ maxMessages: env.memory.maxMessages });
  state.activeSession = sessionId;
  state.lastSavedAt = null;
  state.sessionLoaded = false;
}

export function rollbackLastUserMessage(state) {
  rollbackMemoryLastUserMessage(state.memory);
}

function saveCurrentSession(state, sessionId = state.activeSession) {
  if (!sessionId) {
    throw new Error('No active session. Please create or load a session first.');
  }

  const savedSession = saveSession(state.sessionDir, sessionId, createMemorySnapshot(state.memory));

  state.activeSession = savedSession.sessionId;
  state.lastSavedAt = savedSession.savedAt;
  state.sessionLoaded = true;
  return savedSession;
}

export function autoSaveCurrentSession(state) {
  return saveCurrentSession(state, state.activeSession);
}

export function loadCurrentSession(state, sessionId = state.activeSession) {
  if (!sessionId) {
    throw new Error('No active session. Please provide a session id.');
  }

  const loadedSession = loadSession(state.sessionDir, sessionId);

  if (!loadedSession) {
    return null;
  }

  state.memory = restoreMemory(loadedSession.memory, { maxMessages: env.memory.maxMessages });
  state.activeSession = loadedSession.sessionId;
  state.lastSavedAt = loadedSession.savedAt;
  state.sessionLoaded = true;

  return {
    ...loadedSession,
    memory: getMemoryStats(state),
  };
}

export function listSavedSessions(state) {
  return listSessions(state.sessionDir);
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
