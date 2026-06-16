import { env } from '../config/env.js';

export function createSystemMessage() {
  return {
    role: 'system',
    content: env.agent.systemPrompt,
  };
}
