import { env } from '../config/env.js';

export const EXIT_COMMANDS = new Set(['exit', 'quit', '/exit', '/quit']);

export function formatModelLabel(model) {
  return `${model.id} -> ${model.model} (${model.protocol})`;
}

export function printWelcome(model, userConfigPath, agent) {
  console.log(`${agent.name} CLI 已启动`);
  console.log(`当前 Agent: ${agent.name}`);
  console.log(`Agent 配置文件: ${agent.configPath}`);
  console.log(`Soul 来源: ${agent.promptSource}`);
  console.log(`当前模型: ${formatModelLabel(model)}`);
  console.log(`用户配置文件: ${userConfigPath}`);
  console.log('');
  console.log('常用命令:');
  console.log('- /help: 查看完整命令说明');
  console.log('- /menu: 返回会话菜单');
  console.log('- /session list: 查看已保存会话');
  console.log('- /model list: 查看已注册模型');
  console.log('- exit 或 quit: 退出 CLI\n');
}

export function printStartMenu(sessions) {
  console.log('请选择会话:');
  console.log('1. 创建新对话');
  console.log('2. 选择已有会话继续');

  if (sessions.length > 0) {
    console.log('');
    console.log('已保存会话:');

    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.sessionId} (${session.updatedAt})`);
    });
  } else {
    console.log('');
    console.log('当前还没有已保存会话。');
  }

  console.log('');
}

export function printStartMenuNoSessions() {
  console.log('还没有已保存会话，请先创建新对话。\n');
}

export function printStartMenuInvalidChoice() {
  console.log('无效选择，请输入 1、2，或输入 exit 退出。\n');
}

export function printHelp() {
  console.log('命令说明:');
  console.log('');
  console.log('对话:');
  console.log('- 直接输入内容: 与当前模型对话');
  console.log('- /clear: 清空当前会话上下文，并自动保存');
  console.log('- /menu: 返回会话开始菜单');
  console.log('- exit 或 quit: 退出 CLI');
  console.log('');
  console.log('会话:');
  console.log('- /session: 查看当前会话信息');
  console.log('- /session list: 查看已保存会话');
  console.log('- /session load <id>: 加载已保存会话，运行中切换会话');
  console.log('');
  console.log('模型:');
  console.log('- /model: 查看当前模型');
  console.log('- /model list: 查看已注册模型');
  console.log('- /model switch <id>: 切换到指定模型，并继续沿用当前上下文');
  console.log('');
  console.log('调试:');
  console.log('- /agent: 查看当前 Agent 和 Soul 配置');
  console.log('- /memory: 查看当前 memory 状态');
  console.log('- /help: 查看帮助\n');
}

export function printCurrentModel(model) {
  console.log(`当前模型: ${formatModelLabel(model)}`);
  console.log(`接口地址: ${model.baseUrl}\n`);
}

export function printRegisteredModels(currentModelId, getModelById) {
  console.log('已注册模型:');

  for (const modelId of env.llm.modelIds) {
    const model = getModelById(modelId);
    const marker = modelId === currentModelId ? '*' : '-';
    console.log(`${marker} ${formatModelLabel(model)}`);
  }

  console.log('');
}

export function printCurrentAgent(agent) {
  console.log(`当前 Agent: ${agent.name}`);
  console.log(`Agent 配置文件: ${agent.configPath}`);
  console.log(`Soul 来源: ${agent.promptSource}`);

  if (agent.description) {
    console.log(`说明: ${agent.description}`);
  }

  console.log('');
}

export function printMemoryStats(stats) {
  console.log('Memory 状态:');
  console.log(`- 当前消息数: ${stats.messageCount}/${stats.maxMessages}`);
  console.log(`- 对话消息数: ${stats.conversationMessageCount}`);
  console.log(`- 当前估算 Token: ${stats.estimatedTokens}/${stats.maxTokens}`);
  console.log(`- 已裁剪消息数: ${stats.trimmedMessages}`);
  console.log(`- AI 压缩: ${stats.compressionEnabled ? '开启' : '关闭'}`);
  console.log(`- 压缩触发 Token: ${stats.compressionThresholdTokens}`);
  console.log(`- 压缩后保留近期 Token: ${stats.compressionKeepRecentTokens}`);
  console.log(`- 已执行压缩次数: ${stats.compressionCount}`);
  console.log(`- 累计压缩消息数: ${stats.compressedMessages}\n`);
}

export function printSessionInfo(info) {
  console.log('Session 状态:');
  console.log(`- 当前会话: ${info.activeSession}`);
  console.log(`- 会话目录: ${info.sessionDir}`);
  console.log('- 自动保存: 开启');
  console.log(`- 启动时已加载: ${info.sessionLoaded ? '是' : '否'}`);
  console.log(`- 最近保存时间: ${info.lastSavedAt || '尚未保存'}`);
  console.log(`- 当前消息数: ${info.memory.messageCount}/${info.memory.maxMessages}`);
  console.log(`- 已裁剪消息数: ${info.memory.trimmedMessages}\n`);
}

export function printSessionLoaded(session) {
  console.log(`会话已加载: ${session.sessionId}`);
  console.log(`文件: ${session.filePath}`);

  if (session.savedAt) {
    console.log(`保存时间: ${session.savedAt}`);
  }

  console.log(`当前消息数: ${session.memory.messageCount}/${session.memory.maxMessages}\n`);
}

export function printSessionLoadUsage() {
  console.log('请提供会话 id，例如：/session load my-session\n');
}

export function printSessionCreated(sessionId) {
  console.log(`新会话已创建: ${sessionId}\n`);
}

export function printSessionNotFound(sessionId) {
  console.log(`未找到会话: ${sessionId}\n`);
}

export function printSavedSessions(sessions, activeSession) {
  if (sessions.length === 0) {
    console.log('还没有已保存会话。\n');
    return;
  }

  console.log('已保存会话:');

  for (const session of sessions) {
    const marker = session.sessionId === activeSession ? '*' : '-';
    console.log(`${marker} ${session.sessionId} (${session.updatedAt})`);
  }

  console.log('');
}

export function printCommandError(error) {
  console.error(`Command Error: ${error instanceof Error ? error.message : String(error)}\n`);
}

export function printModelNotFound(modelId) {
  console.log(`未找到模型: ${modelId}\n`);
}

export function printModelSwitchUsage() {
  console.log('请提供模型 id，例如：/model switch openai-main\n');
}

export function printMessagesCleared() {
  console.log('会话上下文已清空。\n');
}

export function printModelSwitched(model) {
  console.log(`已切换到模型: ${formatModelLabel(model)}`);
  console.log(`接口地址: ${model.baseUrl}`);
  console.log('当前会话上下文已保留。下次启动会默认使用这个模型。\n');
}

export function printAgentReply(model, response) {
  console.log(`[${model.id}] Agent: ${response}\n`);
}

export function printContextCompressed(result) {
  console.log(
    `上下文已压缩: ${result.sourceMessageCount} 条旧消息（约 ${result.sourceTokenCount} Token）` +
      ` -> 1 条摘要，保留 ${result.retainedMessageCount} 条近期消息（约 ${result.retainedTokenCount} Token）。`,
  );
  console.log(`估算 Token: ${result.tokenCountBefore} -> ${result.tokenCountAfter}\n`);
}

export function printContextCompressionError(error) {
  console.error(
    `Context Compression Warning: ${error instanceof Error ? error.message : String(error)}`,
  );
  console.error('已保留原上下文，并继续处理当前问题。\n');
}

export function printAgentError(error) {
  console.error(`Agent Error: ${error instanceof Error ? error.message : String(error)}\n`);
}

export function printExit() {
  console.log('已退出 ezAgent CLI。');
}
