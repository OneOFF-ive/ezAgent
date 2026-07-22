import assert from 'node:assert/strict';
import test from 'node:test';
import { echoTool } from '../src/tools/builtins/echo.js';
import {
  createTextToolResult,
  createTool,
  executeTool,
  validateToolArguments,
} from '../src/tools/tool.js';

test('creates and executes an asynchronous local tool', async () => {
  const result = await executeTool(echoTool, { text: 'hello tool' });

  assert.deepEqual(result, {
    content: [{ type: 'text', text: 'hello tool' }],
    isError: false,
    structuredContent: { text: 'hello tool' },
  });
});

test('returns structured validation errors without executing the tool', async () => {
  let executionCount = 0;
  const tool = createTool({
    name: 'counted_echo',
    description: 'Echo text while counting executions.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
      additionalProperties: false,
    },
    async execute({ text }) {
      executionCount += 1;
      return createTextToolResult(text);
    },
  });

  const result = await executeTool(tool, { text: 42, extra: true });

  assert.equal(executionCount, 0);
  assert.equal(result.isError, true);
  assert.equal(result._meta.error.code, 'INVALID_ARGUMENTS');
  assert.deepEqual(
    result._meta.error.details.map((error) => error.code),
    ['INVALID_TYPE', 'UNEXPECTED_PROPERTY'],
  );
});

test('reports missing required arguments', () => {
  const validation = validateToolArguments(echoTool, {});

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.errors, [
    {
      path: '$.text',
      code: 'REQUIRED',
      message: 'Required tool argument "text" is missing.',
    },
  ]);
});

test('converts thrown execution errors into ToolResult errors', async () => {
  const failingTool = createTool({
    name: 'failing_tool',
    description: 'Always fails for testing.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      throw new Error('expected failure');
    },
  });

  const result = await executeTool(failingTool, {});

  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, 'expected failure');
  assert.equal(result._meta.error.code, 'TOOL_EXECUTION_ERROR');
});

test('rejects invalid tool definitions and invalid execution results', async () => {
  assert.throws(
    () =>
      createTool({
        name: 'invalid tool name',
        description: 'Invalid name.',
        inputSchema: { type: 'object' },
        execute() {},
      }),
    /tool name/i,
  );

  const invalidResultTool = createTool({
    name: 'invalid_result',
    description: 'Returns an invalid result.',
    inputSchema: { type: 'object' },
    async execute() {
      return 'not a ToolResult';
    },
  });

  const result = await executeTool(invalidResultTool, {});
  assert.equal(result.isError, true);
  assert.equal(result._meta.error.code, 'TOOL_EXECUTION_ERROR');
});
