import * as StreamConsumers from 'node:stream/consumers';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'mocha';

import { FileSystem } from '../../src/FileSystem/index.mjs';
import { ReadStream } from '../../src/FileSystem/ReadStream.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, 'sample.jiar');

export default function Describe() {
	it('should throw if bad options.encoding type.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			encoding: true,
		}), {
			name: 'TypeError',
			message: 'Invalid "options.encoding", one "null | string" expected.',
		});
	});

	it('should throw if bad options.autoClose type.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			autoClose: 'bad',
		}), {
			name: 'TypeError',
			message: 'Invalid "options.autoClose", one "boolean" expected.',
		});
	});

	it('should throw if bad options.emitClose type.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			emitClose: 'bad',
		}), {
			name: 'TypeError',
			message: 'Invalid "options.emitClose", one "boolean" expected.',
		});
	});

	it('should throw if bad options.start type.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			start: 'bad',
		}), {
			name: 'TypeError',
			message: 'Invalid "options.start", one "Integer | undefined" expected.',
		});
	});

	it('should throw if bad options.end type.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			end: 'bad',
		}), {
			name: 'TypeError',
			message: 'Invalid "options.end", one "Integer | Infinity" expected.',
		});
	});

	it('should throw if bad options.highWaterMark.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			highWaterMark: 'bad',
		}), {
			name: 'TypeError',
			message: 'Invalid "options.highWaterMark", one "Integer" expected.',
		});
	});

	it('should throw if bad options.signal.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			signal: 'bad',
		}), {
			name: 'TypeError',
			message: 'Invalid "options.signal", one "undefined | AbortSignal" expected.',
		});
	});

	it('should throw if bad options.start range.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		for (const badValue of [-1, Number.MAX_SAFE_INTEGER + 10]) {
			assert.throws(() => jiar.createReadStream('/baz', { start: badValue }), {
				name: 'RangeError',
				message: /The value of "start" is out of range. It must be >= 0 && <= 9007199254740991. Received/,
			});
		}
	});

	it('should throw if bad options.highWaterMark range.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		for (const badValue of [-1]) {
			assert.throws(() => jiar.createReadStream('/baz', {
				highWaterMark: badValue,
			}), {
				name: 'RangeError',
				message: /The value of "highWaterMark" is out of range. It must be >= 0. Received/,
			});
		}
	});

	it('should throw if bad options.start range.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		for (const badValue of [-1, Number.MAX_SAFE_INTEGER + 10]) {
			assert.throws(() => jiar.createReadStream('/baz', { end: badValue }), {
				name: 'RangeError',
				message: /The value of "end" is out of range. It must be >= 0 && <= 9007199254740991. Received/,
			});
		}
	});

	it('should throw start > end.', async function () {
		const jiar = await FileSystem.mount(samplePathname);

		assert.throws(() => jiar.createReadStream('/baz', {
			start: 10, end: 1,
		}), {
			name: 'RangeError',
			message: /The value of "start" is out of range. It must be <= "end" \(here: /,
		});
	});

	describe('constructor()', function () {
		it('should throw if bad path.', function () {
			assert.throws(() => new ReadStream({
				path: true,
				fetchFileHandle: () => {},
			}), {
				name: 'TypeError',
				message: 'Invalid "descriptor.path", one "string | undefined" expected.',
			});
		});

		it('should throw if catch in _constructor()', async function () {
			const stream = new ReadStream({
				fetchFileHandle: async () => {
					throw new Error('foo');
				},
			});

			await new Promise((resolve) => {
				stream.on('error', () => resolve());
			});
		});
	});

	describe('({ start: null })', function () {
		it('should get a buffer from stream.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const stream = jiar.createReadStream('/baz');
			const buffer = await StreamConsumers.buffer(stream);

			assert.deepEqual([...buffer], [98, 97, 122, 10]);
		});

		it('should get a EOF from stream if comsuming again.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const stream = jiar.createReadStream('/baz');

			assert.deepEqual([...await StreamConsumers.buffer(stream)], [98, 97, 122, 10]);
			assert.deepEqual([...await StreamConsumers.buffer(stream)], []);
			assert.equal(stream.read(), null);
		});

		it('should throw if catch in _read().', async function () {
			const stream = new ReadStream({
				fetchFileHandle: async () => {
					const jiar = await FileSystem.mount(samplePathname);
					const handle = await jiar.open('/foo');

					return handle;
				},
			});

			await assert.rejects(async () => {
				await new Promise((resolve, reject) => {
					stream.read();
					stream.on('error', reject);
				});
			}, {
				name: 'Error',
				message: 'EISDIR: illegal operation on a directory, read',
			});
		});

		it('should throw if catch in _destroy().', async function () {
			const stream = new ReadStream({
				fetchFileHandle: async () => {
					const jiar = await FileSystem.mount(samplePathname);
					const handle = await jiar.open('/foo');

					handle.close = () => {
						throw new Error('bar');
					};

					return handle;
				},
			});

			await assert.rejects(async () => {
				await new Promise((resolve, reject) => {
					stream.read();
					stream.on('error', reject);
				});
			}, {
				name: 'Error',
				message: 'bar',
			});
		});
	});

	describe('({ start: integer })', function () {
		it('should get a buffer [97, 122]', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const stream = jiar.createReadStream('/baz', { start: 1, end: 2 });

			assert.deepEqual([...await StreamConsumers.buffer(stream)], [97, 122]);
			assert.equal(stream.read(), null);
		});

		it('should get a buffer, start=1 highWaterMark=2', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			const stream = jiar.createReadStream('/baz', {
				start: 1, highWaterMark: 2,
			});

			assert.deepEqual([...await StreamConsumers.buffer(stream)], [97, 122, 10]);
		});

		it('should get a buffer(0), start=3 highWaterMark=2', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			const stream = jiar.createReadStream('/baz', {
				start: 4, highWaterMark: 2,
			});

			assert.deepEqual([...await StreamConsumers.buffer(stream)], []);
		});
	});
}
