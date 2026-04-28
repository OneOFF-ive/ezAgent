# LLM 接入层说明

这个目录负责项目中的大模型接入能力。

这次结构的核心目标是：

- 不再内置固定供应商预设
- 只保留三种接口协议类型
- 支持在配置文件里声明多个模型
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

统一请求入口。

职责：

- 读取当前激活模型配置
- 组装完整请求地址
- 发起 HTTP 请求
- 解析错误
- 返回统一文本结果

这里不再关心“这是哪家模型”，只关心：

- 当前激活模型是什么
- 当前激活模型走哪种协议

## 配置方式

LLM 配置在项目根目录的 `.env` 中完成。

### 1. 声明有哪些模型

```env
LLM_MODELS=my_openai,my_claude,my_code
```

### 2. 选择当前激活模型

```env
LLM_ACTIVE_MODEL=my_code
```

### 3. 为每个模型分别配置参数

每个模型的配置格式是：

```env
LLM_MODEL_<MODEL_ID>_PROTOCOL=
LLM_MODEL_<MODEL_ID>_BASE_URL=
LLM_MODEL_<MODEL_ID>_API_KEY=
```

可选项：

```env
LLM_MODEL_<MODEL_ID>_MODEL=
LLM_MODEL_<MODEL_ID>_TEMPERATURE=
LLM_MODEL_<MODEL_ID>_MAX_TOKENS=
LLM_MODEL_<MODEL_ID>_ANTHROPIC_VERSION=
```

其中：

- `PROTOCOL`、`BASE_URL`、`API_KEY` 是必填
- `MODEL` 是可选
  如果不写，默认直接使用你注册时的模型名称 `MODEL_ID`

代码会把 `MODEL_ID` 转成大写，并把非字母数字字符替换成下划线。

例如：

- `openai-main` -> `LLM_MODEL_OPENAI_MAIN_*`
- `claude.main` -> `LLM_MODEL_CLAUDE_MAIN_*`

## 示例

```env
LLM_MODELS=my_openai,my_code,my_claude
LLM_ACTIVE_MODEL=my_code

LLM_MODEL_MY_OPENAI_PROTOCOL=openai-responses
LLM_MODEL_MY_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL_MY_OPENAI_API_KEY=your_openai_key
LLM_MODEL_MY_OPENAI_MODEL=gpt-4o-mini

LLM_MODEL_MY_CODE_PROTOCOL=openai-completions
LLM_MODEL_MY_CODE_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
LLM_MODEL_MY_CODE_API_KEY=your_volcengine_key
LLM_MODEL_MY_CODE_MODEL=ark-code-latest

LLM_MODEL_MY_CLAUDE_PROTOCOL=anthropic-messages
LLM_MODEL_MY_CLAUDE_BASE_URL=https://api.anthropic.com/v1
LLM_MODEL_MY_CLAUDE_API_KEY=your_anthropic_key
LLM_MODEL_MY_CLAUDE_MODEL=claude-sonnet-4-20250514
LLM_MODEL_MY_CLAUDE_ANTHROPIC_VERSION=2023-06-01
LLM_MODEL_MY_CLAUDE_MAX_TOKENS=1024
```

## 当前调用链路

整体流程如下：

1. `src/config/env.js` 读取 `.env`
2. 解析 `LLM_MODELS`
3. 为每个模型生成独立配置
4. 根据 `LLM_ACTIVE_MODEL` 选出当前激活模型
5. `client.js` 使用激活模型的协议和参数发起请求
6. `protocols.js` 负责协议差异处理
7. 返回统一纯文本结果

## 扩展建议

以后新增模型时，不需要再改代码层结构，优先只做配置：

1. 自定义一个模型别名并加进 `LLM_MODELS`
2. 写对应的 `LLM_MODEL_<ID>_*` 配置
3. 切换 `LLM_ACTIVE_MODEL`

只有在遇到一种全新的接口协议时，才需要扩展 `protocols.js`。
