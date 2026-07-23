import assert from 'node:assert/strict';
import test from 'node:test';
import { echoTool } from '../src/tools/builtins/echo.ts';
import { createToolRegistry } from '../src/tools/registry.ts';
import { createTextToolResult, createTool } from '../src/tools/tool.ts';

test('registers, finds, and lists tools in registration order', () => {
  const secondTool = createTool({
    name: 'second_tool',
    description: 'A second tool for registry tests.',
    inputSchema: { type: 'object' },
    async execute() {
      return createTextToolResult('second');
    },
  });
  const registry = createToolRegistry([echoTool]);

  registry.register(secondTool);

  assert.equal(registry.has('echo'), true);
  assert.equal(registry.get('echo'), echoTool);
  assert.equal(registry.get('missing'), undefined);
  assert.deepEqual(registry.list(), [echoTool, secondTool]);
});

test('executes a registered tool by name', async () => {
  const registry = createToolRegistry([echoTool]);
  const result = await registry.execute('echo', { text: 'registry ready' });

  assert.deepEqual(result, {
    content: [{ type: 'text', text: 'registry ready' }],
    isError: false,
    structuredContent: { text: 'registry ready' },
  });
});

test('forwards execution context to registered tools', async () => {
  const contextualTool = createTool({
    name: 'context_reader',
    description: 'Reads a value from the trusted execution context.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, context) {
      return createTextToolResult(context.requestId);
    },
  });
  const registry = createToolRegistry([contextualTool]);

  const result = await registry.execute('context_reader', {}, { requestId: 'request-123' });

  assert.equal(result.content[0].text, 'request-123');
});

test('rejects duplicate tool names', () => {
  const registry = createToolRegistry([echoTool]);

  assert.throws(() => registry.register(echoTool), /already registered/i);
  assert.throws(() => createToolRegistry([echoTool, echoTool]), /already registered/i);
});

test('returns a ToolResult error for an unknown tool', async () => {
  const registry = createToolRegistry();
  const result = await registry.execute('missing_tool', {});

  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, 'Tool "missing_tool" is not registered.');
  assert.equal(result._meta.error.code, 'TOOL_NOT_FOUND');
  assert.equal(result._meta.error.retryable, false);
});

test('rejects invalid registry input and invalid tools', () => {
  const registry = createToolRegistry();

  assert.throws(() => createToolRegistry(echoTool), /must be an array/i);
  assert.throws(() => registry.register({ name: 'incomplete' }), /valid tool/i);
});
