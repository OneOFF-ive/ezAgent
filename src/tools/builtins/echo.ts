import { createTextToolResult, createTool } from '../tool.ts';

type EchoArguments = {
  text: string;
};

type EchoResult = {
  text: string;
};

export const echoTool = createTool<EchoArguments, EchoResult>({
  name: 'echo',
  description: 'Return the provided text unchanged. Useful for verifying the local Tool flow.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text to return.',
      },
    },
    required: ['text'],
    additionalProperties: false,
  },
  async execute({ text }) {
    return createTextToolResult(text, {
      structuredContent: { text },
    });
  },
});
