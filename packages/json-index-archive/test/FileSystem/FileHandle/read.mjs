import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import { FileSystem } from '../../../src/FileSystem/index.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, '../sample.jiar');

export default function Describe() {
	it('should throw EISDIR if open directory.', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/foo');

		await assert.rejects(async () => await handle.read(), {
			name: 'Error',
			message: 'EISDIR: illegal operation on a directory, read',
		});

		await handle.close();
	});

	it('should throw if bad args[0].', async function () {
		const jiar = await FileSystem.mount(samplePathname);
		const handle = await jiar.open('/baz');

		await assert.rejects(() => handle.read('bad'), {
			name: 'TypeError',
			message: 'Invalid "args[0]", one "Buffer | object" expected.',
		});

		await handle.close();
	});

	describe('()', function () {
		it('should get whole file in buffer.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');
			const { bytesRead, buffer } = await handle.read();

			assert.equal(bytesRead, 4);
			assert.deepEqual([...buffer.slice(0, 4)], [98, 97, 122, 10]);
			await handle.close();
		});

		it('should get a buffer filled 0x00 if again.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await handle.read();

			const { bytesRead, buffer } = await handle.read();

			assert.equal(bytesRead, 0);
			assert.deepEqual(buffer.length, 1 << 14);

			for (const byte of buffer) {
				assert.equal(byte, 0);
			}

			await handle.close();
		});
	});

	describe('(buffer)', function () {
		it('should get all data.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');
			const { buffer, bytesRead } = await handle.read(Buffer.alloc(4));

			assert.equal(bytesRead, 4);
			assert.deepEqual([...buffer], [98, 97, 122, 10]);

			await handle.close();
		});

		it('should get [0, 0, 0, 0] if again.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await handle.read(Buffer.alloc(4));

			const { buffer, bytesRead } = await handle.read(Buffer.alloc(4));

			assert.equal(bytesRead, 0);
			assert.deepEqual([...buffer], [0, 0, 0, 0]);

			await handle.close();
		});

		it('should get bytes one by one.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			for (const expected of [98, 97, 122, 10]) {
				const { bytesRead, buffer } = await handle.read(Buffer.alloc(1));

				assert.equal(bytesRead, 1);
				assert.deepEqual([...buffer], [expected]);
			}

			const { buffer, bytesRead } = await handle.read(Buffer.alloc(1));

			assert.equal(bytesRead, 0);
			assert.deepEqual([...buffer], [0]);
			await handle.close();
		});
	});

	describe('(options)', function () {
		it('should throw if bad options.buffer type', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read({
				buffer: [],
			}), {
				name: 'TypeError',
				message: 'Invalid "options.buffer", one "Buffer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad options.offset type', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read({
				offset: 'bad',
			}), {
				name: 'TypeError',
				message: 'Invalid "options.offset", one "Integer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad options.length type', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read({
				length: 'bad',
			}), {
				name: 'TypeError',
				message: 'Invalid "options.length", one "Integer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad options.position type', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read({
				position: 'bad',
			}), {
				name: 'TypeError',
				message: 'Invalid "options.position", one "null | Integer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad options.offset range', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			for (const offset of [-1, Number.MAX_SAFE_INTEGER + 1]) {
				await assert.rejects(async () => await handle.read({ offset }), {
					name: 'RangeError',
					message: /The value of "offset" is out of range. It must be >= 0 && <= 9007199254740991. Received/,
				});
			}

			await handle.close();
		});

		it('should throw if bad options.length range', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			for (const [length, message] of [
				[-1, /The value of "length" is out of range. It must be >= 0. Received/],
				[1 << 15, /The value of "length" is out of range. It must be <= /],
			]) {
				await assert.rejects(async () => await handle.read({ length }), {
					name: 'RangeError', message,
				});
			}

			await handle.close();
		});

		it('should throw if bad options.position range', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			for (const [length, message] of [
				[-1, /The value of "length" is out of range. It must be >= 0. Received/],
				[1 << 15, /The value of "length" is out of range. It must be <= /],
			]) {
				await assert.rejects(async () => await handle.read({ length }), {
					name: 'RangeError', message,
				});
			}

			await handle.close();
		});

		it('should ok', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			const { buffer, bytesRead } = await handle.read({
				buffer: Buffer.alloc(6),
				offset: 1,
				length: 3,
				position: 1,
			});

			assert.equal(bytesRead, 3);
			assert.deepEqual([...buffer], [0, 97, 122, 10, 0, 0]);
			await handle.close();
		});
	});

	describe('(buffer, arg1)', function () {
		it('should throw if bad arg1.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read(Buffer.alloc(1), null), {
				name: 'TypeError',
				message: 'Invalid "args[1]", one "object | Integer" expected.',
			});

			await handle.close();
		});

		describe('(buffer, options)', function () {
			it('should throw if bad buffer.', async function () {
				const jiar = await FileSystem.mount(samplePathname);
				const handle = await jiar.open('/baz');

				await assert.rejects(async () => await handle.read([], {}), {
					name: 'TypeError',
					message: 'Invalid "args[0] as buffer", one "Buffer" expected.',
				});

				await handle.close();
			});

			it('should get a buffer by specific options.', async function () {
				const jiar = await FileSystem.mount(samplePathname);
				const handle = await jiar.open('/baz');

				const { buffer, bytesRead } = await handle.read(Buffer.alloc(6), {
					offset: 1, length: 3, position: -1,
				});

				assert.equal(bytesRead, 3);
				assert.deepEqual([...buffer], [0, 98, 97, 122, 0, 0]);
				await handle.close();
			});
		});

		describe('(buffer, offset)', function () {
			it('should get a buffer by specific options.', async function () {
				const jiar = await FileSystem.mount(samplePathname);
				const handle = await jiar.open('/baz');

				const { buffer, bytesRead } = await handle.read(Buffer.alloc(6), 1);

				assert.equal(bytesRead, 4);
				assert.deepEqual([...buffer], [0, 98, 97, 122, 10, 0]);
				await handle.close();
			});
		});
	});

	describe('(buffer, offset, length)', function () {
		it('should throw if bad buffer type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read([], 1, 1), {
				name: 'TypeError',
				message: 'Invalid "args[0] as buffer", one "Buffer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad offset type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => {
				await handle.read(Buffer.alloc(1), 'bad', 1);
			}, {
				name: 'TypeError',
				message: 'Invalid "args[1] as offset", one "Integer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad length type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => {
				await handle.read(Buffer.alloc(1), 1, 'bad');
			}, {
				name: 'TypeError',
				message: 'Invalid "args[2] as length", one "Integer" expected.',
			});

			await handle.close();
		});

		it('should get a buffer', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			const {
				buffer, bytesRead,
			} = await handle.read(Buffer.alloc(6), 1, 2);

			assert.equal(bytesRead, 2);
			assert.deepEqual([...buffer], [0, 98, 97, 0, 0, 0]);
			await handle.close();
		});
	});

	describe('(buffer, offset, length, position)', function () {
		it('should throw if bad buffer type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => await handle.read([], 1, 1, 1), {
				name: 'TypeError',
				message: 'Invalid "args[0] as buffer", one "Buffer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad offset type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => {
				await handle.read(Buffer.alloc(1), 'bad', 1, 1);
			}, {
				name: 'TypeError',
				message: 'Invalid "args[1] as offset", one "Integer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad length type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => {
				await handle.read(Buffer.alloc(1), 1, 'bad', 1);
			}, {
				name: 'TypeError',
				message: 'Invalid "args[2] as length", one "Integer" expected.',
			});

			await handle.close();
		});

		it('should throw if bad position type.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			await assert.rejects(async () => {
				await handle.read(Buffer.alloc(1), 1, 1, 'bad');
			}, {
				name: 'TypeError',
				message: 'Invalid "args[3] as position", one "Integer | bigint | null" expected.',
			});

			await handle.close();
		});

		it('should get a buffer.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/baz');

			const {
				buffer, bytesRead,
			} = await handle.read(Buffer.alloc(6), 1, 4, null);

			assert.equal(bytesRead, 4);
			assert.deepEqual([...buffer], [0, 98, 97, 122, 10, 0]);
			await handle.close();
		});
	});
}
