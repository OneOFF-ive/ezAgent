# Tool 层说明

这个目录保存 Agent 可调用的本地工具及其基础运行契约。

当前实现：

- `tool.js`
  定义 Tool、参数校验、统一执行入口和接近 MCP 的 ToolResult 结构。
- `registry.js`
  提供注册、查找、列举和按名称执行工具的最小注册表。
- `builtins/echo.js`
  无副作用的回显工具，用于验证最小本地 Tool 流程。

Tool 定义包含：

- `name`
- `description`
- `inputSchema`
- `execute(args, context)`

统一 ToolResult 包含：

- `content`
- `structuredContent`（可选）
- `isError`
- `_meta`（可选）

注册表使用工具名称作为唯一键，重复注册会直接失败；运行时调用未知工具则返回 `TOOL_NOT_FOUND` ToolResult。当前参数校验只实现顶层对象、必填字段、基础类型和额外字段限制，不等同于完整 JSON Schema 实现。模型协议映射和 Agent Loop 将在后续小步接入。
