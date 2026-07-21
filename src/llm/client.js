import { fetch } from 'undici';
import { env } from '../config/env.js';
import { buildRequestConfig } from './request-config.js';
import { parseErrorResponse, buildApiError } from './errors.js';
import { extractTextByProtocol } from './protocols.js';

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function retryDelay(baseDelayMs, attempt) {
  // attempt 从 0 开始；退避时间逐次翻倍，并设置上限避免错误配置造成超长等待。
  return Math.min(baseDelayMs * 2 ** attempt, 30000);
}

function isTimeoutError(error) {
  // undici 在连接阶段和 AbortSignal.timeout 阶段可能给出不同的超时标识。
  return (
    error?.name === 'TimeoutError' ||
    error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
  );
}

function buildTransportError(error, model, timeoutMs) {
  const label = `${model.id}/${model.protocol}`;

  if (isTimeoutError(error)) {
    return new Error(`LLM request timed out for "${label}" after ${timeoutMs} ms.`, {
      cause: error,
    });
  }

  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`LLM network request failed for "${label}": ${detail}`, {
    cause: error,
  });
}

export async function generateText(messages, targetModel, runtime = {}) {
  const { model, requestUrl, fetchOptions } = buildRequestConfig(messages, targetModel);
  // runtime 依赖仅用于测试替换 fetch、计时器和等待函数；生产环境使用右侧默认实现。
  const requestPolicy = runtime.requestPolicy ?? env.llm.request;
  const fetchImpl = runtime.fetchImpl ?? fetch;
  const waitImpl = runtime.waitImpl ?? wait;
  const createTimeoutSignal = runtime.createTimeoutSignal ?? AbortSignal.timeout;

  // maxRetries 表示首次请求之后的重试次数，因此总尝试次数是 maxRetries + 1。
  for (let attempt = 0; attempt <= requestPolicy.maxRetries; attempt += 1) {
    let response;

    try {
      response = await fetchImpl(requestUrl, {
        ...fetchOptions,
        // 每次尝试都创建新信号，避免重试继承上一次已经超时的 signal。
        signal: createTimeoutSignal(requestPolicy.timeoutMs),
      });
    } catch (error) {
      if (attempt < requestPolicy.maxRetries) {
        await waitImpl(retryDelay(requestPolicy.retryDelayMs, attempt));
        continue;
      }

      throw buildTransportError(error, model, requestPolicy.timeoutMs);
    }

    if (response.ok) {
      const data = await response.json();
      return extractTextByProtocol(model.protocol, data);
    }

    // 先消费错误响应体再决定重试，便于底层连接被安全回收复用。
    const errorPayload = await parseErrorResponse(response);
    const apiError = buildApiError(response, errorPayload, model);

    if (apiError.retryable && attempt < requestPolicy.maxRetries) {
      await waitImpl(retryDelay(requestPolicy.retryDelayMs, attempt));
      continue;
    }

    throw apiError;
  }

  throw new Error('LLM request failed after exhausting all attempts.');
}
