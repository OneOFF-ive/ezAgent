export const LLM_PROTOCOLS = {
  OPENAI_RESPONSES: 'openai-responses',
  OPENAI_COMPLETIONS: 'openai-completions',
  ANTHROPIC_MESSAGES: 'anthropic-messages',
};

export function normalizeMessagesForAnthropic(messages) {
  const systemParts = [];
  const anthropicMessages = [];

  for (const message of messages) {
    // Anthropic 的 system / developer 指令不放在 messages 数组里，
    // 这里先抽出来，后面合并成顶层 system 字段。
    if (message.role === 'system' || message.role === 'developer') {
      systemParts.push(message.content);
      continue;
    }

    anthropicMessages.push({
      role: message.role,
      content: message.content,
    });
  }

  return {
    system: systemParts.join('\n\n').trim() || undefined,
    messages: anthropicMessages,
  };
}

export function extractTextByProtocol(protocol, data) {
  // 不同协议的返回结构不同，这里统一收敛成“纯文本输出”。
  if (protocol === LLM_PROTOCOLS.OPENAI_RESPONSES) {
    return data.output_text ?? '';
  }

  if (protocol === LLM_PROTOCOLS.OPENAI_COMPLETIONS) {
    return data.choices?.[0]?.message?.content ?? '';
  }

  if (protocol === LLM_PROTOCOLS.ANTHROPIC_MESSAGES) {
    return (
      data.content
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('') ?? ''
    );
  }

  return '';
}

export function endpointPathByProtocol(protocol) {
  // 协议层只返回路径，base URL 交给配置层控制，避免写死供应商地址。
  if (protocol === LLM_PROTOCOLS.OPENAI_RESPONSES) {
    return '/responses';
  }

  if (protocol === LLM_PROTOCOLS.OPENAI_COMPLETIONS) {
    return '/chat/completions';
  }

  if (protocol === LLM_PROTOCOLS.ANTHROPIC_MESSAGES) {
    return '/messages';
  }

  throw new Error(`Unsupported LLM protocol "${protocol}".`);
}

export function buildRequestBodyByProtocol(protocol, config, messages) {
  if (protocol === LLM_PROTOCOLS.OPENAI_RESPONSES) {
    return {
      model: config.model,
      input: messages,
      temperature: config.temperature,
    };
  }

  if (protocol === LLM_PROTOCOLS.OPENAI_COMPLETIONS) {
    return {
      model: config.model,
      messages,
      temperature: config.temperature,
    };
  }

  if (protocol === LLM_PROTOCOLS.ANTHROPIC_MESSAGES) {
    const normalized = normalizeMessagesForAnthropic(messages);

    // Anthropic 的 Messages API 要求显式提供 max_tokens。
    return {
      model: config.model,
      max_tokens: config.maxTokens,
      messages: normalized.messages,
      system: normalized.system,
      temperature: config.temperature,
    };
  }

  throw new Error(`Unsupported LLM protocol "${protocol}".`);
}

export function buildHeadersByProtocol(protocol, config) {
  if (
    protocol === LLM_PROTOCOLS.OPENAI_RESPONSES ||
    protocol === LLM_PROTOCOLS.OPENAI_COMPLETIONS
  ) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
  }

  if (protocol === LLM_PROTOCOLS.ANTHROPIC_MESSAGES) {
    // Anthropic 使用 x-api-key + anthropic-version，而不是 Bearer Token。
    return {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': config.anthropicVersion,
    };
  }

  throw new Error(`Unsupported LLM protocol "${protocol}".`);
}
