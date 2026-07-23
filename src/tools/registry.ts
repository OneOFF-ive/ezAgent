import {
  createToolErrorResult,
  executeTool,
  type JsonObject,
  type Tool,
  type ToolExecutionContext,
  type ToolResult,
} from './tool.ts';

type RegisteredTool = Tool<JsonObject, JsonObject, ToolExecutionContext>;

export interface ToolRegistry {
  register(tool: RegisteredTool): RegisteredTool;
  get(name: string): RegisteredTool | undefined;
  has(name: string): boolean;
  list(): RegisteredTool[];
  execute(
    name: string,
    args: unknown,
    context?: ToolExecutionContext,
  ): Promise<ToolResult<JsonObject>>;
}

function assertTool(tool: unknown): asserts tool is RegisteredTool {
  const candidate = tool as Record<string, unknown> | null;

  if (
    candidate === null ||
    typeof candidate !== 'object' ||
    Array.isArray(candidate) ||
    typeof candidate.name !== 'string' ||
    typeof candidate.description !== 'string' ||
    candidate.inputSchema === null ||
    typeof candidate.inputSchema !== 'object' ||
    Array.isArray(candidate.inputSchema) ||
    typeof candidate.execute !== 'function'
  ) {
    throw new TypeError('A valid Tool created by createTool() is required.');
  }
}

export function createToolRegistry(initialTools: readonly RegisteredTool[] = []): ToolRegistry {
  if (!Array.isArray(initialTools)) {
    throw new TypeError('Tool registry initialTools must be an array.');
  }

  // Map 保留注册顺序，同时通过闭包避免调用者绕过重复名称检查直接修改注册表。
  const tools = new Map<string, RegisteredTool>();

  function register(tool: RegisteredTool): RegisteredTool {
    assertTool(tool);

    if (tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }

    tools.set(tool.name, tool);
    return tool;
  }

  function get(name: string): RegisteredTool | undefined {
    return tools.get(name);
  }

  function has(name: string): boolean {
    return tools.has(name);
  }

  function list(): RegisteredTool[] {
    return [...tools.values()];
  }

  async function execute(
    name: string,
    args: unknown,
    context: ToolExecutionContext = {},
  ): Promise<ToolResult<JsonObject>> {
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
