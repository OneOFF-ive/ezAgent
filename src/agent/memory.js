import { createSystemMessage } from './prompts.js';

const DEFAULT_MAX_MESSAGES = 20;
const MIN_MAX_MESSAGES = 2;
const SNAPSHOT_VERSION = 1;
const MESSAGE_ROLES = new Set(['system', 'user', 'assistant', 'tool']);

function normalizeMaxMessages(maxMessages) {
  const normalized = Number(maxMessages);

  if (!Number.isFinite(normalized) || normalized < 1) {
    return DEFAULT_MAX_MESSAGES;
  }

  return Math.max(Math.floor(normalized), MIN_MAX_MESSAGES);
}

function trimMemory(memory) {
  if (memory.messages.length <= memory.maxMessages) {
    return;
  }

  const firstMessage = memory.messages[0];
  const systemMessages = firstMessage?.role === 'system' ? [firstMessage] : [];
  const conversationMessages =
    firstMessage?.role === 'system' ? memory.messages.slice(1) : memory.messages;
  const maxConversationMessages = Math.max(memory.maxMessages - systemMessages.length, 0);
  const nextConversationMessages =
    maxConversationMessages > 0 ? conversationMessages.slice(-maxConversationMessages) : [];
  const nextMessages = [...systemMessages, ...nextConversationMessages];

  memory.trimmedMessages += memory.messages.length - nextMessages.length;
  memory.messages = nextMessages;
}

function cloneMessage(message) {
  return {
    role: message.role,
    content: message.content,
  };
}

function normalizeSnapshotMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new Error('Memory snapshot messages must be an array.');
  }

  const normalizedMessages = messages.map((message) => {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      throw new Error('Memory snapshot message must be an object.');
    }

    if (!MESSAGE_ROLES.has(message.role)) {
      throw new Error(`Unsupported memory message role: ${message.role}`);
    }

    if (typeof message.content !== 'string') {
      throw new Error('Memory snapshot message content must be a string.');
    }

    return cloneMessage(message);
  });

  if (normalizedMessages[0]?.role !== 'system') {
    normalizedMessages.unshift(createSystemMessage());
  }

  return normalizedMessages;
}

export function createMemory(options = {}) {
  return {
    maxMessages: normalizeMaxMessages(options.maxMessages),
    messages: [createSystemMessage()],
    trimmedMessages: 0,
  };
}

export function getMessages(memory) {
  return memory.messages;
}

export function getMemoryStats(memory) {
  return {
    messageCount: memory.messages.length,
    maxMessages: memory.maxMessages,
    conversationMessageCount: memory.messages.filter((message) => message.role !== 'system').length,
    trimmedMessages: memory.trimmedMessages,
  };
}

export function createMemorySnapshot(memory) {
  return {
    version: SNAPSHOT_VERSION,
    maxMessages: memory.maxMessages,
    messages: memory.messages.map(cloneMessage),
    trimmedMessages: memory.trimmedMessages,
  };
}

export function restoreMemory(snapshot, options = {}) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Memory snapshot must be an object.');
  }

  const memory = {
    maxMessages: normalizeMaxMessages(options.maxMessages ?? snapshot.maxMessages),
    messages: normalizeSnapshotMessages(snapshot.messages),
    trimmedMessages: Number(snapshot.trimmedMessages) || 0,
  };

  trimMemory(memory);
  return memory;
}

function appendMessage(memory, role, content) {
  const message = { role, content };
  memory.messages.push(message);
  trimMemory(memory);
  return message;
}

export function appendUserMessage(memory, content) {
  return appendMessage(memory, 'user', content);
}

export function appendAssistantMessage(memory, content) {
  return appendMessage(memory, 'assistant', content);
}

export function clearMemory(memory) {
  memory.messages = [createSystemMessage()];
  memory.trimmedMessages = 0;
}

export function rollbackLastUserMessage(memory) {
  const lastMessage = memory.messages.at(-1);

  if (lastMessage?.role === 'user') {
    memory.messages.pop();
  }
}
