import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('HACS loads the reproducible standalone bundle from the repository root', async () => {
  const config = JSON.parse(await readFile(path.join(root, 'hacs.json'), 'utf8'));
  assert.equal(config.content_in_root, true);
  assert.equal(config.filename, 'mediarr-card.js');
  const sandbox = await mkdtemp(path.join(tmpdir(), 'mediarr-hacs-'));
  try {
    await mkdir(path.join(sandbox, 'scripts'));
    const script = 'scripts/build-single-file.sh';
    await cp(path.join(root, script), path.join(sandbox, script));
    for (const file of await readdir(root)) {
      if (file.endsWith('.js') && file !== config.filename) {
        await cp(path.join(root, file), path.join(sandbox, file));
      }
    }
    const bash = process.platform === 'win32'
      ? path.resolve(execFileSync('git', ['--exec-path'], {encoding:'utf8'}).trim(), '../../../bin/bash.exe')
      : 'bash';
    const bundle = path.join(sandbox, config.filename);
    const build = () => execFileSync(bash, [script], {cwd:sandbox});
    build();
    const first = await readFile(bundle);
    await unlink(bundle);
    build();
    assert.deepEqual(await readFile(bundle), first);
    const shipped = await readFile(path.join(root, config.filename), 'utf8');
    assert.equal(first.toString().replaceAll('\r\n','\n'), shipped.replaceAll('\r\n','\n'));
    assert.doesNotMatch(shipped, /^\s*(?:import|export)\s/m);
    execFileSync(process.execPath, ['--check', bundle]);
  } finally {
    await rm(sandbox, {recursive:true, force:true});
  }
});
