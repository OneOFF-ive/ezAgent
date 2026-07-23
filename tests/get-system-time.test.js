import assert from 'node:assert/strict';
import test from 'node:test';
import { getSystemTimeTool } from '../src/tools/builtins/get-system-time.js';
import { executeTool } from '../src/tools/tool.js';

test('returns the current system time in display and structured formats', async () => {
  const beforeExecution = Date.now();
  const result = await executeTool(getSystemTimeTool, {});
  const afterExecution = Date.now();
  const { isoTime, localTime, timestamp, timeZone } = result.structuredContent;

  assert.equal(result.isError, false);
  assert.equal(typeof localTime, 'string');
  assert.ok(localTime.length > 0);
  assert.equal(typeof timeZone, 'string');
  assert.ok(timeZone.length > 0);
  assert.equal(new Date(isoTime).getTime(), timestamp);
  assert.ok(timestamp >= beforeExecution && timestamp <= afterExecution);
  assert.match(result.content[0].text, /^当前系统时间：/);
  assert.ok(result.content[0].text.includes(timeZone));
});

test('rejects arguments because get-system-time takes no parameters', async () => {
  const result = await executeTool(getSystemTimeTool, { timeZone: 'UTC' });

  assert.equal(result.isError, true);
  assert.equal(result._meta.error.code, 'INVALID_ARGUMENTS');
  assert.equal(result._meta.error.details[0].code, 'UNEXPECTED_PROPERTY');
});
