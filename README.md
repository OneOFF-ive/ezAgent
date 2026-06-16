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
- 支持多轮上下文对话
- 支持动态切换模型并保留上下文
- 支持多模型注册
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
```

配置约定：

- `.env`
  保存系统级配置，例如运行环境、代理、默认参数、用户配置文件路径
- `user-config.json`
  保存用户模型配置，例如默认模型、多个自定义模型

### 3. 启动 CLI

```bash
npm run dev
```

### 4. 运行检查

```bash
npm run validate
```

## 目录结构

```text
ezAgent/
├── README.md
├── AGENTS.md
├── .env
├── .env.example
├── user-config.json
├── user-config.example.json
├── docs/
│   ├── README.md
│   ├── learning-plan.md
│   └── next-actions.md
├── src/
│   ├── index.js
│   ├── agent/
│   │   └── README.md
│   ├── cli/
│   │   ├── commands.js
│   │   ├── state.js
│   │   └── view.js
│   ├── config/
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
│   │   └── tools.js
│   └── utils/
│       └── utils.js
└── tests/
    └── README.md
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
- `user-config.json`
  用户级模型配置
- `user-config.example.json`
  用户级模型配置模板

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

- `env.js`
  加载 `.env` 并导出系统配置
- `llm-config.js`
  从 `user-config.json` 解析模型注册表
- `user-config.js`
  读写用户配置文件

### `src/llm/`

- `client.js`
  LLM 请求主流程入口
- `request-config.js`
  生成请求 URL 与 `fetch` 参数
- `errors.js`
  解析接口错误并构造统一错误对象
- `protocols.js`
  协议适配层
- `README.md`
  LLM 接入层说明文档

### 其他目录

- `src/agent/`
  预留给 Agent 核心层
- `src/tools/`
  预留给工具系统
- `src/utils/`
  预留给通用工具函数
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
  当前阶段的一键自检入口

## 相关文档

- 文档索引：
  [docs/README.md](/root/ezAgent/docs/README.md)
- 学习计划与阶段规划：
  [docs/learning-plan.md](/root/ezAgent/docs/learning-plan.md)
- 下一步建议：
  [docs/next-actions.md](/root/ezAgent/docs/next-actions.md)
- Agent 架构说明：
  [AGENTS.md](/root/ezAgent/AGENTS.md)
- LLM 接入层说明：
  [src/llm/README.md](/root/ezAgent/src/llm/README.md)
