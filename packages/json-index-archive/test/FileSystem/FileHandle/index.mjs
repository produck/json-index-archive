import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import * as Consumer from 'node:stream/consumers';
import { describe, it } from 'mocha';

import { FileSystem } from '../../../src/FileSystem/index.mjs';
import { FileHandle } from '../../../src/FileSystem/FileHandle/index.mjs';
import { ReadStream } from '../../../src/FileSystem/ReadStream.mjs';

import ReadDescribe from './read.mjs';
import ReadFileDescribe from './readFile.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, '../sample.jiar');

export default function Describe() {
	describe('.close()', function () {
		it('should close.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/');

			assert.ok(handle instanceof FileHandle);
			await handle.close();
		});
	});

	describe('.read()', ReadDescribe);

	describe('.createReadStream()', function () {
		it('should get a stream', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');
			const stream = handle.createReadStream();

			assert.ok(stream instanceof ReadStream);
			assert.equal(stream.closed, false);

			await new Promise((resolve) => {
				stream.on('ready', async () => {
					await handle.close();
					resolve();
				});
			});

			assert.equal(stream.closed, true);
		});

		it('should close when stream end.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');
			const stream = handle.createReadStream();

			assert.notEqual(handle.fd, -1);
			assert.ok(stream instanceof ReadStream);
			assert.equal(stream.closed, false);
			assert.deepEqual([...await Consumer.buffer(stream)], [98, 97, 122, 10]);
			assert.equal(handle.fd, -1);
		});

		it('should get Buffer(0) when stream end.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');
			const stream = handle.createReadStream({ autoClose: false });

			assert.notEqual(handle.fd, -1);
			assert.ok(stream instanceof ReadStream);
			assert.equal(stream.closed, false);
			assert.deepEqual([...await Consumer.buffer(stream)], [98, 97, 122, 10]);

			const { bytesRead } = await handle.read();

			assert.equal(bytesRead, 0);
			assert.notEqual(handle.fd, -1);
			await handle.close();
			assert.equal(handle.fd, -1);
			assert.equal(stream.closed, true);
		});

		it('should get Buffer(3) with end=3.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');
			const stream = handle.createReadStream({ end: 3 });

			assert.equal(stream.closed, false);
			assert.deepEqual([...await Consumer.buffer(stream)], [98, 97, 122]);
			assert.equal(stream.closed, true);
		});

		it('should get Buffer(1) with end=3 twice.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			assert.deepEqual([...await Consumer.buffer(
				handle.createReadStream({
					autoClose: false,
					end: 3,
				}),
			)], [98, 97, 122]);

			assert.deepEqual([...await Consumer.buffer(
				handle.createReadStream({
					autoClose: false,
					end: 3,
				}),
			)], [10]);

			await handle.close();
		});
	});

	describe('.readFile()', ReadFileDescribe);
}
