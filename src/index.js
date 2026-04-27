import { generateText } from './llm/client.js';

async function main() {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: '请用一句话解释什么是 AI Agent。' },
  ];

  const response = await generateText(messages);
  console.log('LLM Response:', response);
}

main().catch((error) => {
  console.error('Program failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
