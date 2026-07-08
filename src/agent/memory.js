import { createSystemMessage } from './prompts.js';

export function createMemory() {
  return {
    messages: [createSystemMessage()],
  };
}

export function getMessages(memory) {
  return memory.messages;
}

function appendMessage(memory, role, content) {
  const message = { role, content };
  memory.messages.push(message);
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
}

export function rollbackLastUserMessage(memory) {
  const lastMessage = memory.messages.at(-1);

  if (lastMessage?.role === 'user') {
    memory.messages.pop();
  }
}
