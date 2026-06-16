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
  console.log('可用命令: /help, /agent, /clear, /model, /models, /switch <id>, exit, quit\n');
}

export function printHelp() {
  console.log('命令说明:');
  console.log('- 直接输入问题即可与当前模型对话');
  console.log('- /agent: 查看当前 Agent 和 Soul 配置');
  console.log('- /clear: 清空当前会话上下文');
  console.log('- /model: 查看当前模型');
  console.log('- /models: 查看已注册模型');
  console.log('- /switch <id>: 切换到指定模型，并继续沿用当前上下文');
  console.log('- /help: 查看帮助');
  console.log('- exit 或 quit: 退出 CLI\n');
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

export function printModelNotFound(modelId) {
  console.log(`未找到模型: ${modelId}\n`);
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

export function printAgentError(error) {
  console.error(`Agent Error: ${error instanceof Error ? error.message : String(error)}\n`);
}

export function printExit() {
  console.log('已退出 ezAgent CLI。');
}
