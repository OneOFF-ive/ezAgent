import { createToolErrorResult, executeTool } from './tool.js';

function assertTool(tool) {
  if (
    tool === null ||
    typeof tool !== 'object' ||
    Array.isArray(tool) ||
    typeof tool.name !== 'string' ||
    typeof tool.description !== 'string' ||
    tool.inputSchema === null ||
    typeof tool.inputSchema !== 'object' ||
    Array.isArray(tool.inputSchema) ||
    typeof tool.execute !== 'function'
  ) {
    throw new TypeError('A valid Tool created by createTool() is required.');
  }
}

export function createToolRegistry(initialTools = []) {
  if (!Array.isArray(initialTools)) {
    throw new TypeError('Tool registry initialTools must be an array.');
  }

  // Map 保留注册顺序，同时通过闭包避免调用者绕过重复名称检查直接修改注册表。
  const tools = new Map();

  function register(tool) {
    assertTool(tool);

    if (tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }

    tools.set(tool.name, tool);
    return tool;
  }

  function get(name) {
    return tools.get(name);
  }

  function has(name) {
    return tools.has(name);
  }

  function list() {
    return [...tools.values()];
  }

  async function execute(name, args, context = {}) {
    const tool = get(name);

    if (!tool) {
      return createToolErrorResult('TOOL_NOT_FOUND', `Tool "${name}" is not registered.`);
    }

    return executeTool(tool, args, context);
  }

  for (const tool of initialTools) {
    register(tool);
  }

  return Object.freeze({ register, get, has, list, execute });
}
