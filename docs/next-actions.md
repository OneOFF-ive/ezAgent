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

### 1. 抽出系统提示词

优先级：高

当前 `SYSTEM_PROMPT` 仍在 `src/cli/state.js` 中。建议移动到 Agent 层，例如：

- `src/agent/prompts.js`

原因：

- CLI 不应该拥有 Agent 的行为设定。
- 后续做 memory、tool、agent loop 时，可以统一复用系统提示词。
- 这一步能让 `src/agent/` 从占位目录变成真正的业务边界。

### 2. 建立最小 memory 模块

优先级：高

建议新增：

- `src/agent/memory.js`

先负责最基础的消息管理：

- 创建初始消息
- 追加 user / assistant 消息
- 清空上下文
- 回滚失败请求的 user 消息

原因：

- 当前上下文逻辑在 CLI state 里。
- Phase 2 的核心是 memory，提前抽出能让后续裁剪、持久化更自然。

### 3. 增加最小测试

优先级：中

建议先用 Node 内置 `node:test`，不用急着引入复杂测试框架。

优先测试：

- `src/config/llm-config.js`
- `src/llm/protocols.js`
- `src/cli/commands.js`

原因：

- 这些模块已经承担了关键边界。
- 未来继续重构时，测试能防止配置解析和协议适配回退。

### 4. 优化 LLM 请求稳定性

优先级：中

建议补充：

- 请求超时
- 更清晰的网络错误提示
- 可选重试
- 代理 dispatcher 复用

原因：

- 当前 LLM 接入层结构已经比较清楚。
- 下一步增强可靠性会比继续拆文件更有收益。

### 5. 更新 Phase 1 状态

优先级：中

建议在完成 prompt 抽离和 memory 雏形后，更新 [learning-plan.md](/root/ezAgent/docs/learning-plan.md)。

可以将 Phase 1 标记为：

- 核心闭环已完成
- 剩余测试、错误体验和 Phase 2 过渡工作
