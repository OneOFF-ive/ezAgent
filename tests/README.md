# Tests

这个目录存放项目自动化测试，使用 Node.js 内置的 `node:test`。

涉及临时文件的测试统一复用 `test-support/temp-dir.js`，并在测试结束后清理系统临时目录。

当前已覆盖：

- 达到估算 Token 阈值后调用摘要函数并替换较早上下文
- Token 阈值前不发起压缩请求
- 按 Token 预算保留近期消息
- 空摘要或压缩失败时不修改原 memory
- ASCII、非 ASCII 和消息固定开销的 Token 估算
- memory 追加、回滚、清空和最大消息数裁剪
- memory 快照隔离、旧版本恢复和非法消息校验
- session 保存、加载、列表和不存在的会话
- 非法 session id、损坏 JSON 和缺失 memory 快照
- LLM 请求超时、网络错误、可重试服务端错误和永久 API 错误
- 请求重试次数、指数退避延迟和超时信号传递
- 模型默认值、模型级覆盖、非法配置和激活模型校验
- 三种协议的 endpoint、headers、请求体和响应文本映射
- Anthropic system message 归一化
- 规范 CLI 命令分发、清空保存和旧别名拒绝

后续优先补充的测试方向：

- 工具注册与调用
- Agent loop 停止条件
