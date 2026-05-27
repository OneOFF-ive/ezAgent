# LLM 接入层说明

这个目录负责项目中的大模型接入能力。

这次结构的核心目标是：

- 不再内置固定供应商预设
- 只保留三种接口协议类型
- 支持在用户配置文件里声明多个模型
- 运行时只选择其中一个激活模型来调用

## 当前支持的协议

- `openai-responses`
- `openai-completions`
- `anthropic-messages`

这里的“协议”只关心接口形态，不关心是哪一家供应商。

这意味着：

- 只要某个服务兼容 OpenAI Responses API，就可以用 `openai-responses`
- 只要某个服务兼容 OpenAI Chat Completions API，就可以用 `openai-completions`
- 只要某个服务兼容 Anthropic Messages API，就可以用 `anthropic-messages`

## 文件说明

### `protocols.js`

协议适配层。

职责：

- 定义当前支持的协议常量
- 根据协议决定 endpoint path
- 根据协议构造请求体
- 根据协议构造请求头
- 根据协议提取返回文本
- 处理 Anthropic 与 OpenAI 消息结构差异

### `client.js`

统一请求主流程入口。

职责：

- 调用请求配置模块生成请求参数
- 发起 HTTP 请求
- 调用错误模块处理失败响应
- 调用协议模块提取统一文本结果

这里不再关心“这是哪家模型”，只关心：

- 当前激活模型是什么
- 当前激活模型走哪种协议

### `request-config.js`

请求配置层。

职责：

- 解析目标模型
- 拼接完整请求地址
- 生成 `fetch` 所需参数
- 处理代理 dispatcher

### `errors.js`

错误处理层。

职责：

- 解析接口错误响应
- 兼容不同供应商的错误结构
- 构造统一错误对象

## 配置方式

配置分成两层：

- `.env`
  保存系统级配置，例如运行环境、代理、全局默认参数、用户配置文件路径
- `user-config.json`
  保存用户模型配置，例如默认激活模型、自定义模型列表、每个模型的协议和地址

默认情况下，项目会读取根目录：

- `.env`
- `user-config.json`

### `.env`

最小系统级配置示例：

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
HTTP_PROXY_URL=http://127.0.0.1:7890
USER_CONFIG_PATH=./user-config.json
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1024
ANTHROPIC_VERSION=2023-06-01
```

### `user-config.json`

用户模型配置示例：

```json
{
  "activeModelId": "my_code",
  "models": {
    "my_openai": {
      "protocol": "openai-responses",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "your_openai_key",
      "model": "gpt-4o-mini"
    },
    "my_code": {
      "protocol": "openai-completions",
      "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
      "apiKey": "your_volcengine_key",
      "model": "ark-code-latest"
    },
    "my_claude": {
      "protocol": "anthropic-messages",
      "baseUrl": "https://api.anthropic.com/v1",
      "apiKey": "your_anthropic_key",
      "model": "claude-sonnet-4-20250514",
      "anthropicVersion": "2023-06-01",
      "maxTokens": 1024
    }
  }
}
```

字段说明：

- `activeModelId`
  默认激活模型
- `models`
  用户自定义模型注册表
- `models.<id>.protocol`
  必填，必须是三种协议之一
- `models.<id>.baseUrl`
  必填
- `models.<id>.apiKey`
  必填
- `models.<id>.model`
  可选；不写时默认使用模型别名
- `models.<id>.temperature`
  可选
- `models.<id>.maxTokens`
  可选
- `models.<id>.anthropicVersion`
  Anthropic 协议可选覆盖

## 当前调用链路

整体流程如下：

1. `src/config/env.js` 读取 `.env`
2. 根据 `.env` 里的 `USER_CONFIG_PATH` 读取 `user-config.json`
3. 解析 `models` 注册表
4. 根据 `activeModelId` 选出当前激活模型
5. `request-config.js` 生成请求 URL 和 `fetch` 参数
6. `client.js` 发起请求
7. `errors.js` 负责失败响应解析
8. `protocols.js` 负责协议差异处理和文本提取
9. 返回统一纯文本结果

## 扩展建议

以后新增模型时，不需要再改代码层结构，优先只做配置：

1. 在 `user-config.json` 的 `models` 里新增一个模型别名
2. 写该模型的 `protocol / baseUrl / apiKey`
3. 按需要修改 `activeModelId`

只有在遇到一种全新的接口协议时，才需要扩展 `protocols.js`。
