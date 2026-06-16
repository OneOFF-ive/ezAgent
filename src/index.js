import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { env } from './config/env.js';
import { getUserConfigFilePath } from './config/user-config.js';
import { handleCommand } from './cli/commands.js';
import { createCliState, getCurrentModel, rollbackLastUserMessage } from './cli/state.js';
import { generateText } from './llm/client.js';
import {
  EXIT_COMMANDS,
  printAgentError,
  printAgentReply,
  printExit,
  printWelcome,
} from './cli/view.js';

async function main() {
  const rl = readline.createInterface({ input, output });
  const state = createCliState();

  printWelcome(getCurrentModel(state), getUserConfigFilePath(env.userConfigPath), state.agent);

  while (true) {
    const question = await rl.question('You: ');
    const trimmed = question.trim();

    if (!trimmed) {
      continue;
    }

    if (EXIT_COMMANDS.has(trimmed)) {
      break;
    }

    if (handleCommand(trimmed, state)) {
      continue;
    }

    try {
      const model = getCurrentModel(state);
      state.messages.push({ role: 'user', content: trimmed });
      const response = await generateText(state.messages, model);
      state.messages.push({ role: 'assistant', content: response });
      printAgentReply(model, response);
    } catch (error) {
      // 请求失败时回滚本轮 user 消息，避免错误输入污染上下文。
      rollbackLastUserMessage(state);
      printAgentError(error);
    }
  }

  printExit();
  rl.close();
}

main().catch((error) => {
  console.error('Program failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
