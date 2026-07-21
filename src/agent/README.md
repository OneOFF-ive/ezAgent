# Agent 层说明

这个目录用于承载 Agent 核心能力。

当前阶段已经开始从 CLI 层抽离 Agent 相关职责。

当前文件：

- `prompts.js`
  负责提供默认系统提示词和初始 system message。
- `memory.js`
  负责管理当前会话的短期消息记忆。
- `context-compressor.js`
  负责选择较早消息、构造摘要请求并把 AI 摘要写回 memory。
- `token-estimator.js`
  负责以跨模型的通用近似规则估算文本和消息 Token 数。
- `session-store.js`
  负责把 memory 快照保存到本地 JSON 文件，并从文件恢复会话。

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
- `memory.js` 已建立，支持创建、追加、清空、回滚和最大消息数裁剪
- 支持按估算 Token 预算触发当前模型压缩，并按 Token 保留近期原始消息
- 支持通过 `data/sessions/` 保存、恢复和自动保存本地会话
- `core.js`、`loop.js` 等待后续阶段落地
