const ASCII_CHARACTERS_PER_TOKEN = 4;
const MESSAGE_OVERHEAD_TOKENS = 4;

export function estimateTextTokens(text) {
  const normalizedText = typeof text === 'string' ? text : String(text ?? '');
  let asciiCharacters = 0;
  let nonAsciiCharacters = 0;

  for (const character of normalizedText) {
    if (character.codePointAt(0) <= 127) {
      asciiCharacters += 1;
    } else {
      nonAsciiCharacters += 1;
    }
  }

  return Math.ceil(asciiCharacters / ASCII_CHARACTERS_PER_TOKEN + nonAsciiCharacters);
}

export function estimateMessageTokens(message) {
  return estimateTextTokens(message.content) + MESSAGE_OVERHEAD_TOKENS;
}

export function estimateMessagesTokens(messages) {
  return messages.reduce((total, message) => total + estimateMessageTokens(message), 0);
}
