const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const SUPPORTED_PARAMETER_TYPES = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getValueType(value) {
  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  if (Number.isInteger(value)) {
    return 'integer';
  }

  return typeof value;
}

function matchesType(value, expectedType) {
  if (expectedType === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  if (expectedType === 'integer') {
    return Number.isInteger(value);
  }

  if (expectedType === 'object') {
    return isPlainObject(value);
  }

  if (expectedType === 'array') {
    return Array.isArray(value);
  }

  if (expectedType === 'null') {
    return value === null;
  }

  return typeof value === expectedType;
}

function validateInputSchema(inputSchema) {
  if (!isPlainObject(inputSchema) || inputSchema.type !== 'object') {
    throw new TypeError('Tool inputSchema must be an object schema.');
  }

  const properties = inputSchema.properties ?? {};
  const required = inputSchema.required ?? [];

  if (!isPlainObject(properties)) {
    throw new TypeError('Tool inputSchema.properties must be an object.');
  }

  if (!Array.isArray(required) || required.some((name) => typeof name !== 'string')) {
    throw new TypeError('Tool inputSchema.required must be an array of strings.');
  }

  for (const [name, propertySchema] of Object.entries(properties)) {
    if (!isPlainObject(propertySchema)) {
      throw new TypeError(`Tool parameter schema for "${name}" must be an object.`);
    }

    if (!SUPPORTED_PARAMETER_TYPES.has(propertySchema.type)) {
      throw new TypeError(`Tool parameter "${name}" has an unsupported type.`);
    }
  }
}

function validateToolResult(result) {
  if (!isPlainObject(result) || !Array.isArray(result.content)) {
    throw new TypeError('Tool execute() must return a ToolResult with a content array.');
  }

  for (const block of result.content) {
    if (!isPlainObject(block) || typeof block.type !== 'string') {
      throw new TypeError('Each ToolResult content block must have a type.');
    }

    if (block.type === 'text' && typeof block.text !== 'string') {
      throw new TypeError('A text ToolResult content block must have string text.');
    }
  }

  if (result.structuredContent !== undefined && !isPlainObject(result.structuredContent)) {
    throw new TypeError('ToolResult structuredContent must be an object.');
  }

  if (result.isError !== undefined && typeof result.isError !== 'boolean') {
    throw new TypeError('ToolResult isError must be a boolean.');
  }

  if (result._meta !== undefined && !isPlainObject(result._meta)) {
    throw new TypeError('ToolResult _meta must be an object.');
  }
}

export function createTool({ name, description, inputSchema, execute }) {
  if (typeof name !== 'string' || !TOOL_NAME_PATTERN.test(name)) {
    throw new TypeError('Tool name must contain 1-64 letters, numbers, underscores, or hyphens.');
  }

  if (typeof description !== 'string' || description.trim() === '') {
    throw new TypeError('Tool description must be a non-empty string.');
  }

  validateInputSchema(inputSchema);

  if (typeof execute !== 'function') {
    throw new TypeError('Tool execute must be a function.');
  }

  return Object.freeze({ name, description, inputSchema, execute });
}

export function createToolResult({ content, structuredContent, isError = false, _meta } = {}) {
  const result = { content, isError };

  if (structuredContent !== undefined) {
    result.structuredContent = structuredContent;
  }

  if (_meta !== undefined) {
    result._meta = _meta;
  }

  validateToolResult(result);
  return result;
}

export function createTextToolResult(text, { structuredContent, _meta } = {}) {
  return createToolResult({
    content: [{ type: 'text', text }],
    structuredContent,
    _meta,
  });
}

export function createToolErrorResult(code, message, { details, retryable = false } = {}) {
  return createToolResult({
    content: [{ type: 'text', text: message }],
    isError: true,
    _meta: {
      error: {
        code,
        retryable,
        ...(details === undefined ? {} : { details }),
      },
    },
  });
}

export function validateToolArguments(tool, args) {
  if (!isPlainObject(tool) || !isPlainObject(tool.inputSchema)) {
    throw new TypeError('A valid Tool is required.');
  }

  if (!isPlainObject(args)) {
    return {
      valid: false,
      errors: [
        {
          path: '$',
          code: 'INVALID_TYPE',
          message: 'Tool arguments must be an object.',
        },
      ],
    };
  }

  const { properties = {}, required = [], additionalProperties = true } = tool.inputSchema;
  const errors = [];

  for (const name of required) {
    if (!Object.hasOwn(args, name)) {
      errors.push({
        path: `$.${name}`,
        code: 'REQUIRED',
        message: `Required tool argument "${name}" is missing.`,
      });
    }
  }

  for (const [name, value] of Object.entries(args)) {
    const propertySchema = properties[name];

    if (!propertySchema) {
      if (additionalProperties === false) {
        errors.push({
          path: `$.${name}`,
          code: 'UNEXPECTED_PROPERTY',
          message: `Unexpected tool argument "${name}".`,
        });
      }
      continue;
    }

    if (!matchesType(value, propertySchema.type)) {
      errors.push({
        path: `$.${name}`,
        code: 'INVALID_TYPE',
        message: `Tool argument "${name}" must be ${propertySchema.type}, received ${getValueType(value)}.`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function executeTool(tool, args, context = {}) {
  const validation = validateToolArguments(tool, args);

  if (!validation.valid) {
    return createToolErrorResult('INVALID_ARGUMENTS', 'Tool arguments failed validation.', {
      details: validation.errors,
    });
  }

  try {
    const result = await tool.execute(args, context);
    validateToolResult(result);
    return result;
  } catch (error) {
    // 执行错误转换为模型可见的结果，使后续 Agent Loop 有机会修正参数或结束任务。
    return createToolErrorResult(
      'TOOL_EXECUTION_ERROR',
      error instanceof Error ? error.message : 'Tool execution failed.',
    );
  }
}
