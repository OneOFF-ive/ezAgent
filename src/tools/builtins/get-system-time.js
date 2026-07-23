import { createTextToolResult, createTool } from '../tool.js';

export const getSystemTimeTool = createTool({
  name: 'get-system-time',
  description: '获取运行 EZAgent 的主机当前系统时间和时区，无需参数。',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  async execute() {
    const now = new Date();
    const localTime = now.toLocaleString('zh-CN', { hour12: false });
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return createTextToolResult(`当前系统时间：${localTime}（${timeZone}）`, {
      structuredContent: {
        localTime,
        isoTime: now.toISOString(),
        timestamp: now.getTime(),
        timeZone,
      },
    });
  },
});
