function fallbackErrorPayload(message = 'Unknown API error', code = 'unknown_error') {
  return {
    error: {
      message,
      code,
    },
  };
}

export async function parseErrorResponse(response) {
  const rawText = await response.text();

  if (!rawText) {
    return fallbackErrorPayload();
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return fallbackErrorPayload(rawText);
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

function createApiError(message, response, code, retryable) {
  const error = new Error(message);
  // client 只依赖统一元数据决定重试，不需要再次理解供应商错误结构。
  error.status = response.status;
  error.code = code;
  error.retryable = retryable;
  return error;
}

export function buildApiError(response, errorPayload, model) {
  const { message, code } = extractErrorInfo(errorPayload);
  const label = `${model.id}/${model.protocol}`;

  if (response.status === 401) {
    return createApiError(
      `LLM authentication failed for "${label}": 请检查 API Key 是否正确。`,
      response,
      code,
      false,
    );
  }

  if (response.status === 429 && code === 'insufficient_quota') {
    // 额度不足不会随着短暂等待恢复，重试只会产生额外请求。
    return createApiError(
      `LLM quota exceeded for "${label}": 当前账户额度不足，请检查 billing 和 usage。`,
      response,
      code,
      false,
    );
  }

  if (response.status === 429) {
    return createApiError(`LLM rate limited for "${label}": ${message}`, response, code, true);
  }

  if (response.status >= 500) {
    return createApiError(
      `LLM server error for "${label}" (${response.status}): ${message}`,
      response,
      code,
      true,
    );
  }

  return createApiError(
    `LLM request failed for "${label}" (${response.status}/${code}): ${message}`,
    response,
    code,
    response.status === 408,
  );
}
