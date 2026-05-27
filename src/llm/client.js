import { fetch } from 'undici';
import { buildRequestConfig } from './request-config.js';
import { parseErrorResponse, buildApiError } from './errors.js';
import { extractTextByProtocol } from './protocols.js';

export async function generateText(messages, targetModel) {
  try {
    const { model, requestUrl, fetchOptions } = buildRequestConfig(messages, targetModel);

    // client 层只负责统一调度：拿到请求配置后发起请求并串起响应处理流程。
    const response = await fetch(requestUrl, fetchOptions);

    if (!response.ok) {
      const errorPayload = await parseErrorResponse(response);
      throw buildApiError(response, errorPayload, model);
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
