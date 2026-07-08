# Agent 层说明

这个目录用于承载 Agent 核心能力。

当前阶段已经开始从 CLI 层抽离 Agent 相关职责。

当前文件：

- `prompts.js`
  负责提供默认系统提示词和初始 system message。
- `memory.js`
  负责管理当前会话的短期消息记忆。

相关用户配置：

- `agent.json`
  定义 Agent 名称、描述和 `soulPath`。
- `soul.md`
  存放用户自定义系统提示词。

后续计划放置的能力包括：

- `core.js`
  负责组合模型、记忆和工具
- `loop.js`
  负责任务执行循环

当前状态：

- `prompts.js` 已建立
- 支持从 `agent.json` / `soul.md` 加载用户自定义 prompt
- `memory.js` 已建立，支持创建、追加、清空和回滚消息
- `core.js`、`loop.js` 等待后续阶段落地
