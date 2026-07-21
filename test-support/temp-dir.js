import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function createTempDir(t, prefix = 'ezagent-test-') {
  const tempRoot = path.resolve(os.tmpdir());
  const tempDir = fs.mkdtempSync(path.join(tempRoot, prefix));

  t.after(() => {
    const resolvedTempDir = path.resolve(tempDir);

    if (!resolvedTempDir.startsWith(`${tempRoot}${path.sep}`)) {
      throw new Error(`Refusing to remove unexpected test directory: ${resolvedTempDir}`);
    }

    fs.rmSync(resolvedTempDir, { recursive: true, force: true });
  });

  return tempDir;
}
