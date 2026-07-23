# ezAgent

一个使用 Node.js 从零开始搭建 AI Agent 的学习型项目。

这个仓库当前重点是：

- 理解 Agent 的基础组成
- 从零实现可运行的命令行交互 Agent
- 逐步抽象 LLM 接入层、配置层和 CLI 层
- 为后续的记忆、工具调用和任务执行循环打基础

## 当前特性

- 基于 Node.js 与 ESM
- 命令行交互式 CLI
- 启动时支持创建新对话或选择已有会话继续
- 支持多轮上下文对话
- 支持基于估算 Token 预算管理 memory，并保留最大消息数裁剪作为兜底
- 支持达到 Token 阈值后调用当前模型压缩较早上下文
- 支持本地会话保存、恢复和自动保存
- 支持动态切换模型并保留上下文
- 支持多模型注册
- 支持 LLM 请求超时、可选重试、网络错误分类和代理连接复用
- 支持三种协议：
  - `openai-responses`
  - `openai-completions`
  - `anthropic-messages`
- 系统配置与用户配置分离：
  - `.env` 保存系统级配置
  - `user-config.json` 保存用户模型配置

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化配置

```bash
cp .env.example .env
cp user-config.example.json user-config.json
cp agent.example.json agent.json
cp soul.example.md soul.md
```

配置约定：

- `.env`
  保存系统级配置，例如运行环境、代理、默认参数、上下文压缩和用户配置文件路径
- `user-config.json`
  保存用户模型配置，例如默认模型、多个自定义模型
- `agent.json`
  保存 Agent 基础信息和使用的 soul 文件路径
- `soul.md`
  保存用户自定义系统提示词

### 3. 启动 CLI

```bash
npm run dev
```

CLI 启动后常用命令：

- `/help`
  查看完整命令说明
- `/menu`
  返回会话开始菜单
- `/session list`
  查看已保存会话
- `/session load <id>`
  加载指定会话
- `/model list`
  查看已注册模型
- `/model switch <id>`
  切换模型并保留当前上下文

### 4. 运行检查

```bash
npm run validate
```

### 上下文压缩配置

AI 上下文压缩默认开启，并复用当前激活模型及其 API 配置：

- `MEMORY_MAX_TOKENS`
  memory 的估算 Token 预算，默认 `12000`
- `MEMORY_COMPRESSION_ENABLED`
  是否启用 AI 压缩，默认 `true`
- `MEMORY_MAX_MESSAGES`
  最大消息数安全上限，默认 `100`，只作为异常兜底

程序会在估算 Token 达到 `MEMORY_MAX_TOKENS` 的 80% 时触发压缩，并按 Token 从后向前保留约 30% 的近期原始消息。较早消息会被发送给当前模型生成摘要，原始 system prompt、摘要和近期消息继续参与正常回答。如果压缩请求失败，程序会保留原上下文并继续对话。

当前 Token 数由内置通用估算器计算：ASCII 文本约按 4 个字符 1 Token，非 ASCII 字符按 1 个字符 1 Token，并包含每条消息的固定开销。它适合跨模型的近似预算控制，但不等同于供应商官方 tokenizer 的精确计数。

### LLM 请求稳定性配置

- `LLM_REQUEST_TIMEOUT_MS`
  单次请求超时时间，默认 `30000`
- `LLM_MAX_RETRIES`
  首次请求失败后的最大重试次数，默认 `1`；设为 `0` 可关闭重试
- `LLM_RETRY_DELAY_MS`
  首次重试等待时间，默认 `500`，后续按指数退避，最多等待 30 秒

只有网络错误、超时、HTTP 408、普通 429 和 5xx 会重试。认证失败、参数错误和额度不足不会重试。网络中断可能发生在服务端已经接收请求之后，因此开启重试时仍存在重复生成或重复计费的可能。

## 目录结构

```text
ezAgent/
├── README.md
├── AGENTS.md
├── .env
├── .env.example
├── agent.example.json
├── soul.example.md
├── user-config.json
├── user-config.example.json
├── data/
│   └── sessions/
├── docs/
│   ├── README.md
│   ├── learning-plan.md
│   └── next-actions.md
├── src/
│   ├── index.js
│   ├── agent/
│   │   ├── context-compressor.js
│   │   ├── memory.js
│   │   ├── README.md
│   │   ├── prompts.js
│   │   ├── session-store.js
│   │   └── token-estimator.js
│   ├── cli/
│   │   ├── commands.js
│   │   ├── state.js
│   │   └── view.js
│   ├── config/
│   │   ├── agent-config.js
│   │   ├── env.js
│   │   ├── llm-config.js
│   │   └── user-config.js
│   ├── llm/
│   │   ├── README.md
│   │   ├── client.js
│   │   ├── errors.js
│   │   ├── protocols.js
│   │   └── request-config.js
│   ├── tools/
│   │   ├── builtins/
│   │   │   ├── echo.js
│   │   │   └── get-system-time.js
│   │   ├── README.md
│   │   ├── registry.js
│   │   └── tool.js
├── test-support/
│   └── temp-dir.js
└── tests/
    ├── commands.test.js
    ├── context-compressor.test.js
    ├── get-system-time.test.js
    ├── llm-client.test.js
    ├── llm-config.test.js
    ├── memory.test.js
    ├── protocols.test.js
    ├── README.md
    ├── session-store.test.js
    ├── token-estimator.test.js
    ├── tool-registry.test.js
    └── tool.test.js
```

## 文件职责

### 根目录

- `README.md`
  项目总说明、使用方式、目录概览
- `AGENTS.md`
  Agent 架构说明、模块边界、后续实现约束
- `.env`
  系统级配置
- `.env.example`
  系统级配置模板
- `agent.example.json`
  Agent 配置模板
- `soul.example.md`
  Soul 提示词模板
- `user-config.json`
  用户级模型配置
- `user-config.example.json`
  用户级模型配置模板
- `data/sessions/`
  本地会话持久化目录，默认不提交到 Git

### `src/index.js`

- CLI 入口
- 启动交互循环
- 串联命令处理和模型调用

### `src/cli/`

- `commands.js`
  解析并执行 CLI 命令
- `state.js`
  管理 CLI 运行态和上下文状态
- `view.js`
  管理终端输出文案

### `src/config/`

- `agent-config.js`
  读取 Agent 配置和 Soul 提示词
- `env.js`
  加载 `.env` 并导出系统配置
- `llm-config.js`
  从 `user-config.json` 解析模型注册表
- `user-config.js`
  读写用户配置文件

### `src/llm/`

- `client.js`
  LLM 请求主流程入口，负责超时、重试和网络错误分类
- `request-config.js`
  生成请求 URL 与 `fetch` 参数，并复用代理 dispatcher
- `errors.js`
  解析接口错误并构造统一错误对象
- `protocols.js`
  协议适配层
- `README.md`
  LLM 接入层说明文档

### 其他目录

- `src/agent/`
  Agent 核心层，目前包含系统提示词、短期 memory、Token 估算、AI 上下文压缩和会话持久化模块
- `src/tools/`
  Tool 层，当前包含基础接口、参数校验、统一结果、工具注册表和本地 `echo`、`get-system-time` 工具；尚未接入模型 Tool Call
- `docs/`
  项目过程文档
- `tests/`
  自动化测试目录

## 可用命令

- `npm start`
  运行当前入口
- `npm run dev`
  以 watch 模式运行 CLI
- `npm run lint`
  执行 ESLint
- `npm run lint:fix`
  自动修复可修复的 ESLint 问题
- `npm run format`
  执行 Prettier 格式化
- `npm run format:check`
  检查代码格式
- `npm run check`
  运行 `lint + format:check`
- `npm run validate`
  运行代码检查和自动化测试的一键自检入口

## 相关文档

- 文档索引：
  [docs/README.md](docs/README.md)
- 学习计划与阶段规划：
  [docs/learning-plan.md](docs/learning-plan.md)
- 下一步建议：
  [docs/next-actions.md](docs/next-actions.md)
- Agent 架构说明：
  [AGENTS.md](AGENTS.md)
- LLM 接入层说明：
  [src/llm/README.md](src/llm/README.md)
