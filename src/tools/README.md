# Tool 层说明

这个目录保存 Agent 可调用的本地工具、工具注册表及其基础运行契约。

当前文件：

- `tool.ts`
  定义 Tool、参数校验、统一执行入口和接近 MCP 的 ToolResult 结构。
- `registry.ts`
  提供注册、查找、列举和按名称执行工具的最小注册表。
- `builtins/echo.ts`
  无副作用的回显工具，用于验证最小本地 Tool 流程。
- `builtins/get-system-time.ts`
  返回主机本地时间、ISO 时间、时间戳和系统时区。

## Tool 定义

统一使用 `createTool()` 创建工具：

```js
const tool = createTool({
  name,
  description,
  inputSchema,
  execute,
});
```

TypeScript 工具可以通过泛型关联参数和结构化结果：

```ts
type Arguments = {
  text: string;
};

type Result = {
  text: string;
};

const tool = createTool<Arguments, Result>({
  // ...
});
```

第一个泛型对应 `execute()` 的 `args`，第二个泛型对应 ToolResult 的 `structuredContent`。模型输入仍然必须经过 `inputSchema` 运行时校验。

字段说明：

| 字段          | 类型       | 必填 | 含义                                   |
| ------------- | ---------- | ---- | -------------------------------------- |
| `name`        | `string`   | 是   | 工具唯一名称，供 Registry 和模型识别   |
| `description` | `string`   | 是   | 描述工具的用途、适用场景和重要限制     |
| `inputSchema` | `object`   | 是   | 描述模型可以传入的参数结构             |
| `execute`     | `function` | 是   | 工具执行入口，接收 `args` 和 `context` |

### `name`

规则：

- 长度为 1～64 个字符。
- 只能包含英文字母、数字、下划线和短横线。
- 在同一个 Registry 中必须唯一。

合法示例：

```text
echo
get-system-time
read_file
weather_v2
```

非法示例：

```text
get system time
读取时间
tool@example
```

建议使用能准确表达动作的名称，例如 `get-system-time`，避免使用 `tool1` 这类含义不清晰的名称。

### `description`

`description` 是给模型阅读的工具说明，不能为空。它应说明：

- 工具做什么。
- 什么时候应该使用。
- 返回什么结果。
- 是否有权限、范围或副作用限制。
- 是否需要参数。

示例：

```js
{
  description: '获取运行 EZAgent 的主机当前系统时间和时区，无需参数。',
}
```

描述越明确，模型越容易选择正确的工具并生成正确参数。

## `inputSchema`

`inputSchema` 描述 `execute(args, context)` 中 `args` 的结构。当前实现采用 JSON Schema 风格，但只支持一个最小子集，不等同于完整 JSON Schema。

根节点必须是对象 Schema：

```js
inputSchema: {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
}
```

字段说明：

| 字段                   | 类型       | 必填 | 默认值 | 含义                                 |
| ---------------------- | ---------- | ---- | ------ | ------------------------------------ |
| `type`                 | `"object"` | 是   | 无     | 当前根节点只允许对象                 |
| `properties`           | `object`   | 否   | `{}`   | 声明允许传入的参数及其类型           |
| `required`             | `string[]` | 否   | `[]`   | 声明哪些参数在调用时必须提供         |
| `additionalProperties` | `boolean`  | 否   | `true` | 是否允许传入 `properties` 之外的字段 |

这里有两种不同的“必填”：

- `inputSchema` 是 Tool 定义的必填字段。
- `inputSchema.required` 是一个可选数组，用来指定哪些调用参数必填。

### 无参数工具

工具不需要参数时：

```js
inputSchema: {
  type: 'object',
  properties: {},
  additionalProperties: false,
}
```

调用时仍传入空对象：

```js
await registry.execute('get-system-time', {});
```

`required: []` 可以省略。

### 有必填参数的工具

```js
inputSchema: {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      description: '需要原样返回的文本。',
    },
    repeat: {
      type: 'integer',
      description: '重复次数。',
    },
  },
  required: ['text'],
  additionalProperties: false,
}
```

这里：

- `text` 必填。
- `repeat` 可选。
- 不允许传入 `text` 和 `repeat` 之外的字段。

合法参数：

```js
{ text: 'hello' }
{ text: 'hello', repeat: 2 }
```

非法参数：

```js
{} // 缺少 text
{ text: 42 } // text 类型错误
{ text: 'hello', unknown: true } // 包含未声明字段
```

### 当前支持的参数类型

每个 `properties` 成员都必须包含受支持的 `type`：

| Schema 类型 | JavaScript 值               |
| ----------- | --------------------------- |
| `string`    | 字符串                      |
| `number`    | 有限数字，整数和小数均可    |
| `integer`   | 整数                        |
| `boolean`   | `true` 或 `false`           |
| `object`    | 非 `null`、非数组的普通对象 |
| `array`     | 数组                        |
| `null`      | `null`                      |

当前校验器只检查顶层参数、必填字段、基础类型和额外字段。暂不支持：

- 嵌套对象递归校验。
- 数组元素 Schema。
- `enum`。
- `oneOf`、`anyOf`。
- 字符串长度和格式。
- 数字最小值、最大值。

如果后续需要完整 JSON Schema，可以引入 Ajv，但应继续保持现有 Tool 外部接口。

### `additionalProperties`

如果省略：

```js
inputSchema: {
  type: 'object',
  additionalProperties: true,
}
```

调用者可以传入未在 `properties` 中声明的字段。

本项目的 Tool 通常建议显式设置：

```js
inputSchema: {
  type: 'object',
  additionalProperties: false,
}
```

这样可以更早发现模型拼错参数名或生成多余参数。

## `execute(args, context)`

`execute` 是工具真正执行工作的函数：

```js
async execute(args, context) {
  return createTextToolResult('执行完成');
}
```

虽然同步函数也可以被 `executeTool()` 等待并处理，但建议统一写成异步函数，为后续网络、文件或数据库操作保留空间。

### `args`

`args` 来自模型 Tool Call，属于不可信输入：

```js
async execute({ text }) {
  // text 已通过 inputSchema 的基础校验
}
```

调用 `execute` 之前，`executeTool()` 会使用 `inputSchema` 校验 `args`。参数不合法时不会执行工具，而是返回 `INVALID_ARGUMENTS` ToolResult。

### `context`

`context` 由 Agent Runtime 提供，不来自模型：

```js
async execute(args, context) {
  context.logger?.info('Tool started');
}
```

它可以保存：

- `requestId`
- `sessionId`
- `AbortSignal`
- 权限信息
- 工作目录
- 日志器
- 数据库或 HTTP Client 等运行时服务

区分原则：

- `args` 表示模型希望工具做什么，需要 Schema 校验。
- `context` 表示工具在什么运行环境中执行，由 Agent 控制。

不要把 API Key、权限开关或数据库连接放进 `args`，也不要把整个 `context` 返回给模型。

## ToolResult

每个 Tool 都必须返回 ToolResult。推荐通过辅助函数创建，不要手动拼接：

- `createToolResult()`
- `createTextToolResult()`
- `createToolErrorResult()`

完整结构：

```js
{
  content: [
    {
      type: 'text',
      text: '工具执行完成',
    },
  ],
  structuredContent: {
    value: 123,
  },
  isError: false,
  _meta: {
    durationMs: 10,
  },
}
```

字段说明：

| 字段                | 类型             | 必填 | 默认值  | 含义                           |
| ------------------- | ---------------- | ---- | ------- | ------------------------------ |
| `content`           | `ContentBlock[]` | 是   | 无      | 面向模型、用户或 UI 的结果内容 |
| `structuredContent` | `object`         | 否   | 无      | 供程序稳定读取的结构化数据     |
| `isError`           | `boolean`        | 否   | `false` | 本次工具执行是否失败           |
| `_meta`             | `object`         | 否   | 无      | 错误码、耗时等运行时元数据     |

### `content`

`content` 必须是数组，每个内容块必须包含字符串 `type`。

当前最常用的是文本块：

```js
{
  type: 'text',
  text: '当前系统时间：2026-07-23 10:00:00',
}
```

当 `type` 为 `text` 时，`text` 必须是字符串。

### `structuredContent`

`structuredContent` 必须是普通对象，不能是数组或 `null`。它适合保存供程序使用的稳定字段：

```js
structuredContent: {
  localTime: '2026/7/23 10:00:00',
  isoTime: '2026-07-23T02:00:00.000Z',
  timestamp: 1784772000000,
  timeZone: 'Asia/Shanghai',
}
```

推荐分工：

- `content` 提供简短、可读的说明。
- `structuredContent` 提供完整、稳定、可编程处理的数据。

简单工具可以只有 `content`；当后续代码需要读取具体字段时，再提供 `structuredContent`。

### `isError` 和 `_meta`

失败结果示例：

```js
createToolErrorResult('PERMISSION_DENIED', '当前工具没有文件读取权限。', {
  retryable: false,
  details: {
    path: 'secret.txt',
  },
});
```

返回结构：

```js
{
  content: [
    {
      type: 'text',
      text: '当前工具没有文件读取权限。',
    },
  ],
  isError: true,
  _meta: {
    error: {
      code: 'PERMISSION_DENIED',
      retryable: false,
      details: {
        path: 'secret.txt',
      },
    },
  },
}
```

`content` 中的错误说明用于让模型理解并修正行为，`_meta.error` 用于让 Agent Runtime 根据错误码做控制。

## 执行工具

不建议直接调用：

```js
await tool.execute(args, context);
```

应使用统一入口：

```js
const result = await executeTool(tool, args, context);
```

`executeTool()` 会依次：

1. 校验参数。
2. 参数非法时返回 `INVALID_ARGUMENTS`。
3. 调用 `tool.execute(args, context)`。
4. 校验返回的 ToolResult。
5. 将执行异常或非法返回值转换为 `TOOL_EXECUTION_ERROR`。

## Tool Registry

创建注册表：

```js
const registry = createToolRegistry([echoTool]);
```

提供的方法：

| 方法                           | 含义                                  |
| ------------------------------ | ------------------------------------- |
| `register(tool)`               | 注册一个 Tool，重复名称会抛出异常     |
| `get(name)`                    | 获取 Tool，不存在时返回 `undefined`   |
| `has(name)`                    | 判断 Tool 是否已注册                  |
| `list()`                       | 按注册顺序返回 Tool 数组快照          |
| `execute(name, args, context)` | 按名称查找并通过 `executeTool()` 执行 |

使用示例：

```js
const registry = createToolRegistry([echoTool]);

const result = await registry.execute('echo', {
  text: 'Hello Tool',
});
```

调用未知工具不会抛出异常，而是返回错误结果：

```js
{
  isError: true,
  _meta: {
    error: {
      code: 'TOOL_NOT_FOUND',
      retryable: false,
    },
  },
}
```

重复注册属于程序配置错误，会直接抛出异常；未知工具调用可能由模型生成，因此使用 ToolResult 让后续 Agent Loop 有机会处理。

## 完整示例

```ts
import { createTextToolResult, createTool } from '../tool.ts';

type EchoArguments = {
  text: string;
};

type EchoResult = {
  text: string;
};

export const echoTool = createTool<EchoArguments, EchoResult>({
  name: 'echo',
  description: '原样返回输入文本，用于验证本地 Tool 执行流程。',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '需要原样返回的文本。',
      },
    },
    required: ['text'],
    additionalProperties: false,
  },
  async execute({ text }) {
    return createTextToolResult(text, {
      structuredContent: { text },
    });
  },
});
```

## 新增 Tool 检查清单

新增本地 Tool 时检查：

1. 使用 `createTool()` 创建工具。
2. `name` 合法且没有重复。
3. `description` 能让模型理解用途、参数和限制。
4. `inputSchema.type` 为 `object`。
5. `properties` 中每个参数都声明受支持的 `type`。
6. 必填参数加入 `required`。
7. 通常设置 `additionalProperties: false`。
8. `execute` 返回合法 ToolResult。
9. 通过 Registry 注册，不直接绕过执行入口。
10. 添加正常、非法参数和异常路径测试。
11. 新增模块后同步 `src/tools/README.md`、根 README 和 `AGENTS.md`。

## 当前边界

当前已经完成 Tool 接口、基础参数校验、统一结果、注册表和本地执行。模型 Tool Call 归一化、三种模型协议映射和 Agent Loop 尚未实现。
