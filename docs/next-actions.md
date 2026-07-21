# 下一步建议

这个文档用于记录当前最值得做的下一步工作。

它和 [learning-plan.md](learning-plan.md) 的区别：

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

### 1. 增加最小测试

优先级：高

当前阶段：Phase 2

建议先用 Node 内置 `node:test`，不用急着引入复杂测试框架。

当前进展：测试入口已经建立，AI 上下文压缩和 Token 估算已有 5 个关键行为测试；下一步继续覆盖基础 memory 和持久化边界。

优先测试：

- `src/agent/memory.js`
- `src/agent/session-store.js`
- `src/config/llm-config.js`
- `src/llm/protocols.js`
- `src/cli/commands.js`

原因：

- 这些模块已经承担了关键边界。
- 未来继续重构时，测试能防止配置解析和协议适配回退。

### 2. 优化 LLM 请求稳定性

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

### 清理项目冗余

状态：已完成

完成内容：

- 删除未使用的 `src/utils/` 占位模块
- 用 `src/tools/README.md` 替换无实现的工具代码占位文件
- 移除未使用的运行配置、函数和多余导出
- CLI 只保留 `/session ...` 与 `/model ...` 规范命令
- 修正文档相对链接并移除重复的 Phase 1 Todo

### 增加 AI 上下文压缩

状态：已完成

完成内容：

- 新增 `src/agent/context-compressor.js`
- 新增 `src/agent/token-estimator.js`
- 使用 `MEMORY_MAX_TOKENS` 作为主要 memory 预算
- 达到估算 Token 预算的 80% 后复用当前模型 API 生成较早对话摘要
- 按 Token 预算保留原始 system prompt、AI 摘要和近期原始消息
- 保留最大消息数裁剪作为异常兜底
- 压缩失败时保留原上下文并继续正常对话
- memory 快照新增压缩次数和累计压缩消息数
- `/memory` 增加压缩配置与运行统计
- 使用 `node:test` 增加上下文压缩与 Token 估算测试

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

### 增加 memory 持久化

状态：已完成

完成内容：

- 新增 `src/agent/session-store.js`
- 支持导出和恢复 memory 快照
- 支持本地 JSON 会话保存与加载
- CLI 新增 `/session load <id>`、`/session`、`/session list`
- 新增 `MEMORY_SESSION_DIR` 配置

### 增加 session 自动加载和自动保存

状态：已完成

完成内容：

- 启动时通过开始菜单选择新建或加载会话
- 对话成功后自动保存当前 session
- `/clear` 后自动保存当前 session
- 自动保存为固定行为，不再提供关闭配置
- `/session` 显示最近保存时间

### 增加启动会话菜单

状态：已完成

完成内容：

- CLI 启动时先进入会话开始菜单
- 支持创建新对话并生成 session id
- 支持选择已有会话继续对话
- 保留 `/session load <id>`、`/session`、`/session list` 命令

### 增加运行中返回菜单

状态：已完成

完成内容：

- CLI 新增 `/menu`
- 返回菜单前会自动保存当前会话
- 可在运行中创建新对话或选择已有会话继续

### 优化 CLI 命令命名

状态：已完成

完成内容：

- 会话命令统一为 `/session ...`
- 模型命令统一为 `/model ...`
- 移除未正式发布的短命令别名，减少重复分支

### 优化 CLI 命令提示

状态：已完成

完成内容：

- 启动页只展示高频命令，避免一行命令过长
- `/help` 按对话、会话、模型、调试分组展示
- README 补充 CLI 常用命令入口

### Phase 1 核心闭环收口

状态：已完成

完成内容：

- Phase 1 验收标准已检查
- CLI、LLM 接入、Agent prompt 和短期 memory 链路已具备
- 后续重点切换到 Phase 2 的 memory 持久化
