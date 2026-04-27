import { fetch, ProxyAgent } from 'undici';
import { env } from '../config/env.js';

function createDispatcher() {
  if (!env.httpProxyUrl) {
    return undefined;
  }

  return new ProxyAgent(env.httpProxyUrl);
}

function buildRequestBody(messages) {
  if (env.llm.apiStyle === 'responses') {
    return {
      model: env.llm.model,
      input: messages,
      temperature: 0.7,
    };
  }

  if (env.llm.apiStyle === 'chat-completions') {
    return {
      model: env.llm.model,
      messages,
      temperature: 0.7,
    };
  }

  throw new Error(`Unsupported LLM_API_STYLE "${env.llm.apiStyle}".`);
}

function buildEndpoint() {
  if (env.llm.apiStyle === 'responses') {
    return `${env.llm.baseUrl}/responses`;
  }

  if (env.llm.apiStyle === 'chat-completions') {
    return `${env.llm.baseUrl}/chat/completions`;
  }

  throw new Error(`Unsupported LLM_API_STYLE "${env.llm.apiStyle}".`);
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

function extractText(data) {
  if (env.llm.apiStyle === 'responses') {
    return data.output_text ?? '';
  }

  if (env.llm.apiStyle === 'chat-completions') {
    return data.choices?.[0]?.message?.content ?? '';
  }

  return '';
}

function buildApiError(response, errorPayload) {
  const apiMessage = errorPayload?.error?.message || 'Unknown API error';
  const apiCode = errorPayload?.error?.code || 'unknown_error';

  if (response.status === 401) {
    return new Error(
      `LLM authentication failed for provider "${env.llm.provider}": 请检查 API Key 是否正确。`,
    );
  }

  if (response.status === 429 && apiCode === 'insufficient_quota') {
    return new Error(
      `LLM quota exceeded for provider "${env.llm.provider}": 当前账户额度不足，请检查 billing 和 usage。`,
    );
  }

  if (response.status === 429) {
    return new Error(`LLM rate limited for provider "${env.llm.provider}": ${apiMessage}`);
  }

  if (response.status >= 500) {
    return new Error(
      `LLM server error for provider "${env.llm.provider}" (${response.status}): ${apiMessage}`,
    );
  }

  return new Error(
    `LLM request failed for provider "${env.llm.provider}" (${response.status}/${apiCode}): ${apiMessage}`,
  );
}

export async function generateText(messages) {
  try {
    const response = await fetch(buildEndpoint(), {
      dispatcher: createDispatcher(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.llm.apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(messages)),
    });

    if (!response.ok) {
      const errorPayload = await parseErrorResponse(response);
      throw buildApiError(response, errorPayload);
    }

    const data = await response.json();
    return extractText(data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`LLM network request failed: ${String(error)}`, {
      cause: error,
    });
  }
}
