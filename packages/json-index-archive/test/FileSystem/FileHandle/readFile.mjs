import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import { it } from 'mocha';

import { FileSystem } from '../../../src/FileSystem/index.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, '../sample.jiar');

export default function Describe() {
	it('should get a buffer.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		assert.deepEqual([...await handle.readFile()], [98, 97, 122, 10]);
	});

	it('should get remained bytes.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		await handle.read(Buffer.alloc(1));
		assert.deepEqual([...await handle.readFile(null)], [97, 122, 10]);
	});

	it('should throw if bad args[0].', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		await assert.rejects(async () => await handle.readFile(true), {
			name: 'TypeError',
			message: 'Invalid "args[0]", one "string | object" expected.',
		});

		await handle.close();
	});

	it('should throw if bad options.encoding.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		await assert.rejects(async () => await handle.readFile({
			encoding: true,
		}), {
			name: 'TypeError',
			message: 'Invalid "options.encoding", one "null | string" expected.',
		});

		await handle.close();
	});

	it('should throw if bad options.signal.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		await assert.rejects(async () => await handle.readFile({
			signal: true,
		}), {
			name: 'TypeError',
			message: 'Invalid "options.signal", one "AbortSignal | undefined" expected.',
		});

		await handle.close();
	});

	it('should get a string.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		assert.deepEqual(await handle.readFile('utf8'), 'baz\n');
	});
}
