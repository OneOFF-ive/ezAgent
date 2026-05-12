import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { env } from './config/env.js';
import { generateText } from './llm/client.js';

const SYSTEM_PROMPT = 'You are a helpful assistant.';
const EXIT_COMMANDS = new Set(['exit', 'quit', '/exit', '/quit']);

function createInitialMessages() {
  return [{ role: 'system', content: SYSTEM_PROMPT }];
}

function printWelcome() {
  const model = env.llm.activeModel;

  console.log('ezAgent CLI 已启动');
  console.log(`当前模型: ${model.id} (${model.protocol})`);
  console.log('可用命令: /help, /clear, exit, quit\n');
}

function printHelp() {
  console.log('命令说明:');
  console.log('- 直接输入问题即可与当前模型对话');
  console.log('- /clear: 清空当前会话上下文');
  console.log('- /help: 查看帮助');
  console.log('- exit 或 quit: 退出 CLI\n');
}

async function main() {
  const rl = readline.createInterface({ input, output });
  let messages = createInitialMessages();

  printWelcome();

  while (true) {
    const question = await rl.question('You: ');
    const trimmed = question.trim();

    if (!trimmed) {
      continue;
    }

    if (EXIT_COMMANDS.has(trimmed)) {
      break;
    }

    if (trimmed === '/help') {
      printHelp();
      continue;
    }

    if (trimmed === '/clear') {
      messages = createInitialMessages();
      console.log('会话上下文已清空。\n');
      continue;
    }

    try {
      messages.push({ role: 'user', content: trimmed });
      const response = await generateText(messages);
      messages.push({ role: 'assistant', content: response });
      console.log(`Agent: ${response}\n`);
    } catch (error) {
      // 请求失败时回滚本轮 user 消息，避免错误输入污染上下文。
      messages = messages.slice(0, -1);
      console.error(
        `Agent Error: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  }

  console.log('已退出 ezAgent CLI。');
  rl.close();
}

main().catch((error) => {
  console.error('Program failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
