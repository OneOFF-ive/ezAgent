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

### 1. 统一模型 Tool Call 数据结构

优先级：高

当前阶段：Phase 3

定义协议无关的内部调用结构：

- 调用 ID
- 工具名称
- 已解析或待解析的参数
- 参数解析失败结果

先让 Registry 只接收统一结构，不直接识别任何模型厂商格式。

### 2. 映射三种模型 Tool Call 协议

优先级：中

内部结构稳定后，再分别解析 OpenAI Responses、OpenAI Completions 和 Anthropic Messages 的调用请求，并把统一 ToolResult 转回对应协议。暂不在协议适配稳定前实现多步 Agent Loop。

## 最近完成

### 实现最小工具注册表

状态：已完成

完成内容：

- 新增 `src/tools/registry.js`
- 支持初始化注册、运行时注册、按名称查找和按注册顺序列举
- 重复工具名称在注册阶段直接拒绝
- 支持通过注册表按名称执行工具并透传可信 `context`
- 未知工具统一返回 `TOOL_NOT_FOUND` ToolResult
- 新增 `tests/tool-registry.test.js`，自动化测试由 39 个增加到 45 个

### 定义最小 Tool 接口

状态：已完成

完成内容：

- 新增 `src/tools/tool.js`，定义 Tool、基础参数校验和统一异步执行入口
- ToolResult 使用接近 MCP 的 `content`、`structuredContent`、`isError` 和 `_meta`
- 参数错误和执行异常统一转换为模型可观察的失败结果
- 新增无副作用的 `src/tools/builtins/echo.js`
- 新增 `tests/tool.test.js`，自动化测试由 34 个增加到 39 个

### 补充配置、协议与 CLI 测试

状态：已完成

完成内容：

- 新增 `tests/llm-config.test.js`，覆盖默认值、覆盖值和非法配置
- 新增 `tests/protocols.test.js`，覆盖三种协议的请求与响应映射
- 新增 `tests/commands.test.js`，覆盖规范命令和旧别名拒绝
- 临时配置和 Session 测试统一复用 `test-support/temp-dir.js`
- 自动化测试由 21 个增加到 34 个

### 优化 LLM 请求稳定性

状态：已完成

完成内容：

- 新增单次请求超时配置和清晰的超时错误
- 支持通过 `LLM_MAX_RETRIES` 开关重试
- 网络错误、408、普通 429 和 5xx 使用指数退避重试
- 认证、参数和额度不足错误不重试
- 代理 `ProxyAgent` 在进程内复用
- 新增 LLM Client 测试，自动化测试由 16 个增加到 21 个

### 补齐 Memory 与 Session 测试

状态：已完成

完成内容：

- 新增 `tests/memory.test.js` 和 `tests/session-store.test.js`
- 覆盖 memory 裁剪、回滚、清空、快照隔离和旧版本恢复
- 覆盖非法消息、Session ID、损坏 JSON 和缺失快照
- Session 测试统一使用系统临时目录，不污染真实会话数据
- 自动化测试由 5 个增加到 16 个，M2 / Phase 2 完成收口

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
