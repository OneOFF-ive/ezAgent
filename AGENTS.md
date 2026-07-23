# AGENTS.md

## 项目定位

这是一个面向学习和实践的 Node.js AI Agent 项目，正在采用 JavaScript / TypeScript 共存方式渐进迁移 TypeScript。

当前重点不是一次性实现完整 Agent，而是通过可运行的小步迭代，逐步搭建：

- CLI 交互层
- 配置层
- LLM 接入层
- 记忆层
- 后续的工具和任务执行层

## 当前架构

### 1. Interface Layer

职责：

- 负责 CLI 交互
- 管理用户输入与命令分发
- 输出模型回复和运行信息

当前文件：

- `src/index.js`
- `src/cli/commands.js`
- `src/cli/state.js`
- `src/cli/view.js`

### 2. Config Layer

职责：

- 读取系统级配置
- 读取用户模型配置
- 读取 Agent 与 Soul 配置
- 解析激活模型和模型注册表

当前文件：

- `src/config/agent-config.js`
- `src/config/env.js`
- `src/config/llm-config.js`
- `src/config/user-config.js`

### 3. Model Layer

职责：

- 适配多种 LLM 协议
- 生成请求配置
- 发起模型请求
- 统一错误处理

当前文件：

- `src/llm/client.js`
- `src/llm/request-config.js`
- `src/llm/errors.js`
- `src/llm/protocols.js`

### 4. Agent Layer

职责：

- 组合模型、记忆和工具
- 管理任务执行过程
- 决定何时继续、何时结束

当前状态：

- 已抽出基础系统提示词
- 已建立最小 memory 模块
- 已支持 memory 本地持久化
- 已支持基于估算 Token 预算调用当前模型 API 压缩较早上下文
- 支持从 `agent.json` / `soul.md` 加载用户自定义 prompt
- core、loop 尚未正式实现

当前文件：

- `src/agent/memory.js`
- `src/agent/context-compressor.js`
- `src/agent/token-estimator.js`
- `src/agent/prompts.js`
- `src/agent/session-store.js`

### 5. Tool Layer

职责：

- 注册工具
- 校验参数
- 执行工具
- 回传工具结果

当前状态：

- 已使用 TypeScript 定义最小 Tool 接口、泛型参数和接近 MCP 的 ToolResult 结构
- 已支持基础参数校验和统一异步执行入口
- 已提供无副作用的本地 `echo` 和 `get-system-time` 工具
- 已支持工具注册、查找、列举、重复名称拒绝和按名称执行
- 模型 Tool Call 归一化、协议映射和 Agent Loop 尚未实现

当前文件：

- `src/tools/tool.ts`
- `src/tools/registry.ts`
- `src/tools/builtins/echo.ts`
- `src/tools/builtins/get-system-time.ts`
- `src/tools/README.md`

## 当前已完成能力

### CLI

- 支持连续对话
- 支持多轮上下文
- 支持启动时创建新对话或选择已有会话继续
- 支持 `/help`
- 支持 `/menu`
- 支持 `/agent`
- 支持 `/memory`
- 支持 `/model`
- 支持 `/model list`
- 支持 `/model switch <id>`
- 支持 `/session`
- 支持 `/session list`
- 支持 `/session load <id>`
- 支持 `/clear`
- 支持 `exit / quit`

### LLM 接入

当前支持三种协议：

- `openai-responses`
- `openai-completions`
- `anthropic-messages`

可靠性能力：

- 支持单次请求超时
- 支持可配置重试次数和指数退避
- 只重试网络错误、超时、408、普通 429 和 5xx
- 支持清晰区分认证、额度、服务端、超时和网络错误
- 支持复用代理 dispatcher

### 配置系统

- `.env` 保存系统级配置
- `user-config.json` 保存用户模型配置
- 支持多个模型注册
- 支持默认激活模型
- 支持切换模型后持久化激活模型

### Agent 层

- 已抽出默认系统提示词
- 已提供初始 system message 创建入口
- 支持用户通过 `agent.json` / `soul.md` 自定义 prompt
- 已建立短期消息 memory 模块
- 已支持基于估算 Token 管理 memory，并以最大消息数裁剪作为兜底
- 已支持达到 Token 阈值后通过 AI 摘要压缩较早上下文
- 已支持本地会话保存、恢复和自动保存

### 工程配置

- 已引入 TypeScript 编译器和与 Node 24 匹配的类型定义
- 已提供 `tsconfig.json`，允许 JavaScript / TypeScript 共存
- 新增或迁移的 TypeScript 文件启用严格类型检查
- `npm run check` 和 `npm run validate` 已包含 `typecheck`
- Tool 层已迁移到 TypeScript，并由 Node 24 原生类型擦除执行
- CLI、LLM 和 Agent 层暂时仍为 JavaScript

### 阶段进度

- Phase 0 已完成
- Phase 1 核心闭环已完成
- Phase 2 与 M2 已完成，memory、上下文压缩和 session 持久化关键边界已有自动化测试
- LLM 请求稳定性补强已完成
- 配置、三种协议和规范 CLI 命令分发测试已补齐
- Phase 3 已开始，最小 Tool 接口与本地注册表已完成
- TypeScript 渐进迁移基础设施与 Tool 层迁移已完成，当前重点是统一模型 Tool Call 数据结构

## 推荐开发原则

### 程序改动同步计划文档

每次修改程序代码时，都需要同步检查计划文档是否需要更新。

默认检查范围：

- `docs/learning-plan.md`
  更新阶段进度、Todo、验收标准或下一步计划。
- `docs/next-actions.md`
  更新近期建议、优先级和建议完成状态。
- `AGENTS.md`
  当模块边界、架构职责或开发约定变化时同步更新。
- `README.md`
  当启动方式、目录结构、配置方式或用户可见能力变化时同步更新。

同步规则：

- 如果代码改动影响当前阶段进度，更新 `docs/learning-plan.md`。
- 如果给出新的下一步建议，或建议优先级发生变化，更新 `docs/next-actions.md`。
- 如果某条建议已经完成或不再适合，从 `docs/next-actions.md` 中更新状态或移除。
- 如果代码改动新增、删除或重命名模块，更新 `AGENTS.md` 和必要的 README 目录说明。
- 如果只是纯内部重构，但不改变计划状态，也要在最终说明中明确“计划文档无需更新”的判断。
- 不把详细开发计划塞回根 README；根 README 只保留项目说明和文档入口。

### 保持小步迭代

每次只增加一个可验证能力，例如：

- 先打磨 CLI
- 再引入记忆
- 再引入工具
- 最后做执行循环

### 保持模块单一职责

避免把这些逻辑重新堆回一个文件里：

- CLI 命令处理
- 配置解析
- LLM 请求配置
- 错误处理
- Agent loop

### 先跑通，再优化

优先保证：

- 能运行
- 能观察
- 能解释

然后再继续：

- 收敛重复逻辑
- 优化模块边界
- 增强功能能力

## 里程碑定义

### M1: Chat Agent

能力：

- 用户输入问题
- Agent 调用模型
- 返回文本结果
- 支持多轮 CLI 对话

### M2: Memory Agent

能力：

- 显式管理历史消息
- 支持上下文裁剪
- 支持持久化会话

### M3: Tool Agent

能力：

- 能调用本地工具
- 能把工具结果继续交给模型处理

### M4: Task Agent

能力：

- 执行多步骤任务
- 具备基础 loop

### M5: Reliable Agent

能力：

- 日志
- 测试
- 错误分类
- 更稳定的配置和调试能力

## 当前约束

- 目前核心能力仍聚焦在 CLI 与 LLM 接入层
- `src/agent/` 目前已有 prompts、memory、token-estimator、context-compressor、session-store 和自定义 prompt 加载能力，core / loop 仍是后续阶段能力
- `src/tools/` 已有最小 Tool 接口、参数校验、统一结果、注册表和本地 `echo`、`get-system-time` 工具，尚未接入模型工具调用
- Tool 层已使用严格 TypeScript，其他正式源码仍为 JavaScript
- 已使用 Node.js 内置 `node:test` 覆盖 memory、上下文压缩、Token 估算、session-store、LLM Client、模型配置、协议、CLI 命令分发、基础 Tool 执行、内置时间工具与工具注册表
- 还没有实现模型 Tool Call 归一化、协议映射和任务循环

## 文档使用方式

这个文件用于记录：

- 当前实际架构
- 模块边界
- 已完成能力
- 后续实现方向

当代码结构发生明显变化时，优先同步更新这里，确保文档始终反映当前真实状态。
