# 下一步建议

这个文档用于记录当前最值得做的下一步工作。

它和 [learning-plan.md](/root/ezAgent/docs/learning-plan.md) 的区别：

- `learning-plan.md`
  记录长期阶段规划和验收标准。
- `next-actions.md`
  记录近期建议、优先级和为什么现在适合做。

## 维护规则

每次给出“下一步建议”时，都需要同步检查并更新这个文档。

需要更新的情况：

1. 建议的优先级发生变化。
2. 某个建议已经完成或不再适合。
3. 新增了更适合当前阶段的建议。
4. 代码结构变化导致建议内容需要调整。

如果只是回答概念问题，没有给出新的执行建议，可以不更新。

## 当前建议

### 1. 增加 memory 持久化

优先级：高

建议继续扩展 memory 能力：

- 会话快照导出
- 本地会话保存
- 本地会话恢复
- 会话文件目录约定

原因：

- memory 模块已经支持短期消息管理和上下文裁剪。
- 下一步做持久化，可以让 Agent 从“当前进程内记忆”升级到“可恢复会话”。

### 2. 增加最小测试

优先级：高

建议先用 Node 内置 `node:test`，不用急着引入复杂测试框架。

优先测试：

- `src/agent/memory.js`
- `src/config/llm-config.js`
- `src/llm/protocols.js`
- `src/cli/commands.js`

原因：

- 这些模块已经承担了关键边界。
- 未来继续重构时，测试能防止配置解析和协议适配回退。

### 3. 优化 LLM 请求稳定性

优先级：中

建议补充：

- 请求超时
- 更清晰的网络错误提示
- 可选重试
- 代理 dispatcher 复用

原因：

- 当前 LLM 接入层结构已经比较清楚。
- 下一步增强可靠性会比继续拆文件更有收益。

## 最近完成

### 抽出系统提示词

状态：已完成

完成内容：

- 新增 `src/agent/prompts.js`
- 从 `src/cli/state.js` 移除硬编码系统提示词
- 由 Agent 层统一提供初始 system message

### 支持 Agent / Soul 自定义 prompt

状态：已完成

完成内容：

- 新增 `src/config/agent-config.js`
- 新增 `agent.example.json` 和 `soul.example.md`
- 支持通过 `agent.json` 指定 `soulPath`
- 支持通过 `soul.md` 自定义系统提示词
- CLI 新增 `/agent` 查看当前 Agent 和 Soul 来源

### 建立最小 memory 模块

状态：已完成

完成内容：

- 新增 `src/agent/memory.js`
- 从 `src/cli/state.js` 抽离消息数组管理
- 支持创建初始消息、追加 user / assistant 消息
- 支持清空上下文和回滚失败请求的 user 消息

### 增加 memory 裁剪和状态查看

状态：已完成

完成内容：

- 新增 `MEMORY_MAX_MESSAGES` 配置
- memory 自动保留 system message 和最近对话消息
- 支持记录已裁剪消息数量
- CLI 新增 `/memory` 查看当前 memory 状态
- 同步更新 Phase 1 / Phase 2 进度说明
