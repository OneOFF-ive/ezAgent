# AGENT.md

## 项目定位

这是一个面向学习和实践的 Node.js AI Agent 项目。

当前重点不是一次性实现完整 Agent，而是通过可运行的小步迭代，逐步搭建：

- CLI 交互层
- 配置层
- LLM 接入层
- 后续的记忆、工具和任务执行层

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
- 解析激活模型和模型注册表

当前文件：

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

- 目录已建立
- 业务能力尚未正式实现

预留目录：

- `src/agent/`

### 5. Tool Layer

职责：

- 注册工具
- 校验参数
- 执行工具
- 回传工具结果

当前状态：

- 目录已建立
- 工具系统尚未正式实现

预留目录：

- `src/tools/`

## 当前已完成能力

### CLI

- 支持连续对话
- 支持多轮上下文
- 支持 `/help`
- 支持 `/model`
- 支持 `/models`
- 支持 `/switch <id>`
- 支持 `/clear`
- 支持 `exit / quit`

### LLM 接入

当前支持三种协议：

- `openai-responses`
- `openai-completions`
- `anthropic-messages`

### 配置系统

- `.env` 保存系统级配置
- `user-config.json` 保存用户模型配置
- 支持多个模型注册
- 支持默认激活模型
- 支持切换模型后持久化激活模型

## 推荐开发原则

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
- `src/agent/`、`src/tools/` 仍是后续阶段能力
- 还没有正式引入测试用例
- 还没有实现 memory 裁剪与持久化
- 还没有实现工具调用和任务循环

## 文档使用方式

这个文件用于记录：

- 当前实际架构
- 模块边界
- 已完成能力
- 后续实现方向

当代码结构发生明显变化时，优先同步更新这里，确保文档始终反映当前真实状态。
