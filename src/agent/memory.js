import { createSystemMessage } from './prompts.js';

const DEFAULT_MAX_MESSAGES = 20;
const MIN_MAX_MESSAGES = 2;

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
  const nextConversationMessages = conversationMessages.slice(-maxConversationMessages);
  const nextMessages = [...systemMessages, ...nextConversationMessages];

  memory.trimmedMessages += memory.messages.length - nextMessages.length;
  memory.messages = nextMessages;
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
