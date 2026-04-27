import { env } from '../config/env.js';
import { fetch, ProxyAgent } from 'undici';

export async function generateText(messages) {
  const response = await fetch(`${env.openaiBaseUrl}/responses`, {
    dispatcher: env.httpProxyUrl ? new ProxyAgent(env.httpProxyUrl) : undefined,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      input: messages,
      temperature: 0.7,
    }),
  });

if (!response.ok) {
  let errorPayload = null;

  try {
    errorPayload = await response.json();
  } catch {}

  const apiMessage = errorPayload?.error?.message || 'Unknown API error';
  const apiCode = errorPayload?.error?.code || 'unknown_error';

  if (response.status === 401) {
    throw new Error('OpenAI authentication failed: 请检查 OPENAI_API_KEY 是否正确。');
  }

  if (response.status === 429 && apiCode === 'insufficient_quota') {
    throw new Error('OpenAI quota exceeded: 当前账户额度不足，请检查 billing 和 usage。');
  }

  if (response.status === 429) {
    throw new Error(`OpenAI rate limited: ${apiMessage}`);
  }

  if (response.status >= 500) {
    throw new Error(`OpenAI server error (${response.status}): ${apiMessage}`);
  }

  throw new Error(`LLM request failed (${response.status}/${apiCode}): ${apiMessage}`);
}


  const data = await response.json();
  return data.output_text ?? '';
}
