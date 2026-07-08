import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { env } from './config/env.js';
import { getUserConfigFilePath } from './config/user-config.js';
import { handleCommand } from './cli/commands.js';
import {
  appendAssistantMessage,
  appendUserMessage,
  autoSaveCurrentSession,
  createCliState,
  getCurrentModel,
  getMessages,
  listSavedSessions,
  loadCurrentSession,
  rollbackLastUserMessage,
  startNewSession,
} from './cli/state.js';
import { generateText } from './llm/client.js';
import {
  EXIT_COMMANDS,
  printAgentError,
  printAgentReply,
  printExit,
  printSessionCreated,
  printSessionLoaded,
  printSessionNotFound,
  printStartMenu,
  printStartMenuInvalidChoice,
  printStartMenuNoSessions,
  printWelcome,
} from './cli/view.js';

function createSessionId() {
  return `session-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
}

async function askNonEmpty(rl, prompt, fallback) {
  const answer = await rl.question(prompt);
  return answer.trim() || fallback;
}

async function chooseSavedSession(rl, state, sessions) {
  if (sessions.length === 0) {
    printStartMenuNoSessions();
    return false;
  }

  while (true) {
    const answer = await rl.question('请选择会话编号，或输入 session id: ');
    const trimmed = answer.trim();

    if (!trimmed) {
      continue;
    }

    const selectedSession = sessions[Number(trimmed) - 1];
    const sessionId = selectedSession?.sessionId ?? trimmed;
    const loadedSession = loadCurrentSession(state, sessionId);

    if (!loadedSession) {
      printSessionNotFound(sessionId);
      continue;
    }

    printSessionLoaded(loadedSession);
    return true;
  }
}

async function createNewConversation(rl, state) {
  const sessionId = await askNonEmpty(rl, '请输入新会话 id，直接回车自动生成: ', createSessionId());
  startNewSession(state, sessionId);

  try {
    autoSaveCurrentSession(state);
    printSessionCreated(sessionId);
  } catch (error) {
    printAgentError(error);
  }
}

async function runStartMenu(rl, state) {
  while (true) {
    const sessions = listSavedSessions(state);
    printStartMenu(sessions);

    const answer = await rl.question('请选择: ');
    const choice = answer.trim().toLowerCase();

    if (choice === '1' || choice === 'n' || choice === 'new') {
      await createNewConversation(rl, state);
      return;
    }

    if (choice === '2' || choice === 'c' || choice === 'continue') {
      const loaded = await chooseSavedSession(rl, state, sessions);

      if (loaded) {
        return;
      }

      continue;
    }

    if (EXIT_COMMANDS.has(choice)) {
      return false;
    }

    printStartMenuInvalidChoice();
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const state = createCliState();

  const shouldContinue = await runStartMenu(rl, state);

  if (shouldContinue === false) {
    printExit();
    rl.close();
    return;
  }

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

    if (trimmed === '/menu') {
      try {
        autoSaveCurrentSession(state);
      } catch (error) {
        printAgentError(error);
      }

      const shouldReturnToChat = await runStartMenu(rl, state);

      if (shouldReturnToChat === false) {
        break;
      }

      printWelcome(getCurrentModel(state), getUserConfigFilePath(env.userConfigPath), state.agent);
      continue;
    }

    if (handleCommand(trimmed, state)) {
      continue;
    }

    try {
      const model = getCurrentModel(state);
      appendUserMessage(state, trimmed);
      const response = await generateText(getMessages(state), model);
      appendAssistantMessage(state, response);
      printAgentReply(model, response);

      try {
        autoSaveCurrentSession(state);
      } catch (error) {
        printAgentError(error);
      }
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
