# ezAgent

一个使用 Node.js 从零开始搭建 AI Agent 的学习型项目。

项目目标不是“快速拼出一个能跑的 demo”，而是通过逐步实现一个可扩展的 Agent，系统学习：

- Node.js 基础能力
- 命令行应用开发
- LLM 调用与消息编排
- 工具调用（Tools / Function Calling）
- 多轮对话状态管理
- Agent 运行机制与架构设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化环境变量

复制模板文件并按你的模型服务商填写配置：

```bash
cp .env.example .env
```

当前 LLM 接入层支持注册多个模型，并通过 `LLM_ACTIVE_MODEL` 选择当前使用的模型。

### 3. 本地开发

```bash
npm run dev
```

### 4. 运行检查

```bash
npm run validate
```

## 项目目标

### 学习目标

1. 熟悉 Node.js 项目结构、模块拆分、异步流程和错误处理。
2. 理解 AI Agent 的核心组成：模型、记忆、规划、工具、执行循环。
3. 从零实现一个可观察、可调试、可扩展的 Agent。
4. 在实现过程中沉淀文档、实验记录和阶段复盘。

### 产出目标

1. 一个基于 Node.js 的命令行 AI Agent。
2. 一套清晰的模块化工程结构。
3. 一份从入门到进阶的开发路线与里程碑。
4. 一套便于后续扩展 Web UI、插件系统和多 Agent 能力的基础架构。

## 开发愿景

我们把项目分成“先跑通、再抽象、再增强”的三层目标：

- 第一层：做出最小可用 Agent，能接收输入并调用模型返回结果。
- 第二层：加入记忆、工具调用、日志和配置管理，让 Agent 具备基础执行能力。
- 第三层：加入规划、任务拆解、长期记忆、评估和多 Agent 协作等进阶能力。

## 开发进度规划

### Phase 0: 项目初始化

目标：完成工程骨架和开发约定。

- 初始化 Node.js 项目
- 配置 `package.json`
- 约定目录结构
- 接入环境变量管理
- 初始化 README、AGENT 文档
- 选择代码规范方案（ESLint / Prettier）

完成标准：

- 项目可以本地启动
- 环境变量加载正常
- 目录结构清晰
- 文档可以指导下一阶段开发

当前状态：

- 已完成

### Phase 1: 最小 Agent 闭环

目标：实现一个最简单的对话式 Agent。

- 接收用户输入
- 调用大模型 API
- 返回模型回复
- 支持基础系统提示词
- 支持单轮/连续对话模式

完成标准：

- 运行 `node` 命令即可与 Agent 对话
- 支持读取 `OPENAI_API_KEY` 或其他模型配置
- 有基础错误处理和超时提示

### Phase 2: 上下文与记忆

目标：让 Agent 能“记住”对话上下文。

- 设计消息结构（system / user / assistant / tool）
- 保存对话历史
- 支持历史裁剪与上下文窗口控制
- 支持本地文件持久化会话

完成标准：

- Agent 能进行多轮连续对话
- 重启后可以恢复部分会话
- 上下文过长时有基本裁剪策略

### Phase 3: 工具调用能力

目标：让 Agent 不只是聊天，还能执行动作。

- 定义 Tool 接口
- 实现本地工具注册机制
- 先接入简单工具：
  - 时间查询
  - 文件读取
  - 文件写入
  - Shell 命令执行（受控）
- 加入 tool call 执行循环

完成标准：

- Agent 能根据任务自动选择工具
- 工具调用结果能回传给模型继续推理
- 工具执行失败时能正常提示

### Phase 4: Agent Loop 与任务执行

目标：从“对话机器人”升级为“任务执行器”。

- 实现 `plan -> act -> observe -> reflect` 基础循环
- 支持最大迭代次数
- 支持中间步骤日志输出
- 支持任务完成判断

完成标准：

- Agent 可执行一个多步骤任务
- 可以看到每一步动作和结果
- 能避免无限循环

### Phase 5: 可观测性与工程化

目标：让项目更像一个真正可维护的工程。

- 日志分级
- 配置中心
- 错误分类
- 单元测试
- Mock 模型层
- 增加开发脚本

完成标准：

- 核心模块有基础测试
- Agent 运行日志清晰
- 关键异常可以定位

### Phase 6: 进阶能力

目标：探索更真实的 Agent 架构能力。

- 短期记忆 / 长期记忆
- RAG 检索增强
- 简单规划器
- 任务拆解
- 多工具编排
- 多 Agent 协作实验

完成标准：

- 至少完成 1 个高级能力方向
- 有实验记录与效果复盘
- 架构仍然保持可读和可维护

## 建议目录结构

```text
ezAgent/
├── README.md
├── AGENT.md
├── package.json
├── src/
│   ├── index.js
│   ├── agent/
│   │   ├── core.js
│   │   ├── loop.js
│   │   └── memory.js
│   ├── llm/
│   │   ├── client.js
│   │   └── prompts.js
│   ├── tools/
│   │   ├── registry.js
│   │   └── builtins/
│   ├── config/
│   │   └── env.js
│   └── utils/
├── tests/
└── docs/
```

## 当前目录结构

当前项目已经落地的目录结构如下：

```text
ezAgent/
├── README.md
├── AGENT.md
├── .env
├── .env.example
├── package.json
├── src/
│   ├── index.js
│   ├── agent/
│   │   └── README.md
│   ├── config/
│   │   └── env.js
│   ├── llm/
│   │   ├── README.md
│   │   ├── client.js
│   │   └── protocols.js
│   ├── tools/
│   │   └── tools.js
│   └── utils/
│       └── utils.js
├── tests/
│   └── README.md
└── docs/
    └── README.md
```

说明：

- `src/llm/` 已经完成第一版接入层抽象
- `src/agent/`、`tests/`、`docs/` 当前处于骨架占位阶段
- `src/tools/`、`src/utils/` 已建立目录边界，等待后续逐步细化

## 阶段性交付目标

### 第 1 周

- 搭好 Node.js 项目
- 完成环境变量和模型调用
- 跑通最小对话 demo

### 第 2 周

- 完成多轮上下文
- 增加会话存储
- 抽出 Agent 基础类或核心模块

### 第 3 周

- 增加工具系统
- 接入 2 到 4 个内置工具
- 打通 tool call 流程

### 第 4 周

- 实现任务执行循环
- 增加日志、异常处理、基础测试
- 完成第一版可演示 Agent

## 当前优先级

建议先按下面顺序推进：

1. 初始化 `package.json` 和基础目录
2. 实现模型调用封装
3. 实现 CLI 输入输出
4. 打通最小对话闭环
5. 再开始做 memory 和 tools

## 开发脚本

当前可用脚本：

- `npm start`
  运行当前入口文件
- `npm run dev`
  以 watch 模式运行入口文件，适合本地开发
- `npm run lint`
  执行 ESLint 检查
- `npm run lint:fix`
  自动修复可修复的 ESLint 问题
- `npm run format`
  使用 Prettier 格式化代码
- `npm run format:check`
  检查代码格式是否符合约定
- `npm run check`
  运行 `lint + format:check`
- `npm run validate`
  作为当前阶段的一键自检入口
- `npm test`
  当前为占位脚本，测试体系将在后续阶段补充

## Phase 0 验收标准

当下面这些条件都满足时，`Phase 0` 可以认为完整结束：

1. 项目骨架和基础目录已经建立
2. `package.json`、ESLint、Prettier、`.gitignore` 已配置完成
3. `.env.example` 可以指导新环境初始化
4. `npm install`、`npm run lint`、`npm run format:check`、`npm run validate` 可以执行
5. 项目入口 `src/index.js` 可以正常启动到模型调用阶段
6. 根 README、Agent 文档和 LLM 子目录文档能说明当前结构和下一步方向

结论：

- 截至当前版本，`Phase 0` 已完成

## 成功标准

如果这个项目顺利推进，最终应该具备这些特征：

- 代码结构清晰，不是所有逻辑都堆在一个文件里
- 每新增一个能力，都能找到明确归属模块
- 能解释每个 Agent 组件为什么存在
- 能从代码中看懂一次完整任务是如何被执行的

## 下一步建议

`Phase 0` 收口后，下一步最适合进入：

1. 把 `src/index.js` 从固定消息 demo 升级成可交互 CLI
2. 抽出消息构造逻辑，准备进入多轮对话
3. 设计 `memory` 层的数据结构
4. 再开始推进 `Phase 1` 到 `Phase 2`
