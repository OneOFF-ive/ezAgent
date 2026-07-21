# Tests

这个目录存放项目自动化测试，使用 Node.js 内置的 `node:test`。

当前已覆盖 AI 上下文压缩的关键行为：

- 达到估算 Token 阈值后调用摘要函数并替换较早上下文
- Token 阈值前不发起压缩请求
- 按 Token 预算保留近期消息
- 空摘要或压缩失败时不修改原 memory
- ASCII、非 ASCII 和消息固定开销的 Token 估算

后续优先补充的测试方向：

- memory 裁剪、快照与恢复
- session-store 保存与加载
- 环境变量和模型配置解析
- LLM 协议适配
- CLI 命令分发
- 工具注册与调用
- Agent loop 停止条件
