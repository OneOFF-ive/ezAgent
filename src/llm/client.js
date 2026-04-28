import { fetch, ProxyAgent } from 'undici';
import { env } from '../config/env.js';
import {
  buildHeadersByProtocol,
  buildRequestBodyByProtocol,
  endpointPathByProtocol,
  extractTextByProtocol,
} from './protocols.js';

function createDispatcher() {
  if (!env.httpProxyUrl) {
    return undefined;
  }

  return new ProxyAgent(env.httpProxyUrl);
}

function activeModel() {
  return env.llm.activeModel;
}

function buildEndpoint() {
  // endpointPathByProtocol 只关心协议路径，这里再与当前激活模型的 base URL 拼起来。
  const model = activeModel();
  return `${model.baseUrl}${endpointPathByProtocol(model.protocol)}`;
}

async function parseErrorResponse(response) {
  const rawText = await response.text();

  if (!rawText) {
    return {
      error: {
        message: 'Unknown API error',
        code: 'unknown_error',
      },
    };
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      error: {
        message: rawText,
        code: 'unknown_error',
      },
    };
  }
}

function extractErrorInfo(errorPayload) {
  // OpenAI 风格一般放在 error 对象里，Anthropic 更常见的是顶层 type/message。
  if (errorPayload?.error) {
    return {
      message: errorPayload.error.message || 'Unknown API error',
      code: errorPayload.error.code || errorPayload.error.type || 'unknown_error',
    };
  }

  if (errorPayload?.type && errorPayload?.message) {
    return {
      message: errorPayload.message,
      code: errorPayload.type,
    };
  }

  return {
    message: 'Unknown API error',
    code: 'unknown_error',
  };
}

function buildApiError(response, errorPayload) {
  const { message, code } = extractErrorInfo(errorPayload);
  const model = activeModel();
  const label = `${model.id}/${model.protocol}`;

  if (response.status === 401) {
    return new Error(`LLM authentication failed for "${label}": 请检查 API Key 是否正确。`);
  }

  if (response.status === 429 && code === 'insufficient_quota') {
    return new Error(
      `LLM quota exceeded for "${label}": 当前账户额度不足，请检查 billing 和 usage。`,
    );
  }

  if (response.status === 429) {
    return new Error(`LLM rate limited for "${label}": ${message}`);
  }

  if (response.status >= 500) {
    return new Error(`LLM server error for "${label}" (${response.status}): ${message}`);
  }

  return new Error(`LLM request failed for "${label}" (${response.status}/${code}): ${message}`);
}

export async function generateText(messages) {
  try {
    const model = activeModel();

    // client 层只负责统一调度：基于当前激活模型构造请求、发起请求、解析响应。
    const response = await fetch(buildEndpoint(), {
      dispatcher: createDispatcher(),
      method: 'POST',
      headers: buildHeadersByProtocol(model.protocol, model),
      body: JSON.stringify(buildRequestBodyByProtocol(model.protocol, model, messages)),
    });

    if (!response.ok) {
      const errorPayload = await parseErrorResponse(response);
      throw buildApiError(response, errorPayload);
    }

    const data = await response.json();
    return extractTextByProtocol(model.protocol, data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`LLM network request failed: ${String(error)}`, {
      cause: error,
    });
  }
}
