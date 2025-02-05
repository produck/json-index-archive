import * as fs from 'node:fs';
import * as path from 'node:path';
import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import PathnameDescribe from './Pathname.mjs';
import IndexTreeDescribe from './Index/Tree.mjs';
import IndexObjectDescribe from './Index/Object.mjs';
import DirentDescribe from './Dirent.mjs';
import FileHandlerDescribe from './FileHandle/index.mjs';
import ReadStreamDescribe from './ReadStream.mjs';
import StatsDescribe from './Stats.mjs';

import { FileSystem } from '../../src/FileSystem/index.mjs';
import { Dirent } from '../../src/FileSystem/Dirent.mjs';
import { FileHandle } from '../../src/FileSystem/FileHandle/index.mjs';
import { ReadStream } from '../../src/FileSystem/ReadStream.mjs';
import { Stats } from '../../src/FileSystem/Stats.mjs';

const __dirname = import.meta.dirname;
const samplePathname = path.resolve(__dirname, 'sample.jiar');

describe('::FileSystem', function () {
	describe('::Pathname', PathnameDescribe);

	describe('::Index', function () {
		describe('::Tree', IndexTreeDescribe);
		describe('::Object', IndexObjectDescribe);
	});

	describe('::Dirent', DirentDescribe);
	describe('::FileHandle', FileHandlerDescribe);
	describe('::ReadStream', ReadStreamDescribe);
	describe('::Stats', StatsDescribe);

	describe('.pathname', function () {
		it('should get pathname.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			assert.equal(jiar.pathname, samplePathname);
		});
	});

	describe('.archiveSize', function () {
		it('should get archiveSize.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.archiveSize, 643);
		});
	});

	describe('.fileSize', function () {
		it('should get fileSize.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.fileSize, 25n);
		});
	});

	describe('.indexSize', function () {
		it('should get indexSize.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.indexSize, 610);
		});
	});

	describe('.exists()', function () {
		it('should get true.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			for (const pathname of [
				'/bar',
				'/bar/foo',
				'/bar/foo/bar',
				'/bar/foo/baz',
				'/bar/baz',
				'/bar/qux',
				'/foo',
				'/baz',
			]) {
				assert.ok(jiarFS.exists(pathname));
			}
		});

		it('should get false.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.equal(jiarFS.exists('/bad'), false);
		});

		it('should throw if bad pathname.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			for (const pathname of [
				'a', 'b/c', '\\d\\b',
			]) {
				assert.throws(() => jiarFS.exists(pathname), {
					name: 'Error',
					message: 'Bad pathname, should be POSIX absolute path.',
				});
			}
		});
	});

	describe('.stat()', function () {
		it('should get a stats.', async () => {
			const jiar = await FileSystem.mount(samplePathname);

			assert.ok(await jiar.stat('/foo') instanceof Stats);
			assert.ok(await jiar.stat('/baz') instanceof Stats);
		});

		it('should throw if bad pathname.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			for (const pathname of [
				'a', 'b/c', '\\d\\b',
			]) {
				assert.throws(() => jiarFS.stat(pathname), {
					name: 'Error',
					message: 'Bad pathname, should be POSIX absolute path.',
				});
			}
		});

		it('should throw if path is NOT existed.', async () => {
			const jiar = await FileSystem.mount(samplePathname);

			assert.throws(() => jiar.stat('/not'), {
				name: 'Error',
				message: 'no such file or directory, stat \'/not\'',
			});
		});
	});

	describe('.open()', function () {
		it('should get a FileHandle.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const handle = await jiar.open('/');

			assert.ok(handle instanceof FileHandle);
			await handle.close();
		});

		it('should throw if bad pathname.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			await assert.rejects(async () => await jiar.open(null), {
				name: 'TypeError',
				message: 'Invalid "pathname", one "string" expected.',
			});

			await assert.rejects(async () => await jiar.open('bad'), {
				name: 'Error',
				message: 'Bad pathname, should be POSIX absolute path.',
			});
		});

		it('should throw if node NOT found.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			await assert.rejects(async () => await jiar.open('/not/existed'), {
				name: 'Error',
				message: 'no such file or directory, open \'/not/existed\'',
			});
		});
	});

	describe('.readdir()', function () {
		it('should get name string[].', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const list = jiar.readdir('/');

			assert.equal(list.length, 3);

			for (const name of ['bar', 'foo', 'baz']) {
				assert.ok(list.includes(name));
			}

			assert.deepEqual(jiar.readdir('/foo'), []);
		});

		it('should get pathname string[].', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const list = jiar.readdir('/', { recursive: true });

			assert.equal(list.length, 8);

			for (const pathname of [
				'/bar',
				'/bar/foo',
				'/bar/foo/bar',
				'/bar/foo/baz',
				'/bar/baz',
				'/bar/qux',
				'/foo',
				'/baz',
			]) {
				assert.ok(list.includes(pathname));
			}
		});

		it('should get dirent[].', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const list = jiar.readdir('/', { withFileTypes: true });

			assert.equal(list.length, 3);

			const types = {
				bar: dirent => dirent.isDirectory(),
				foo: dirent => dirent.isDirectory(),
				baz: dirent => dirent.isFile(),
			};

			for (const dirent of list) {
				assert.ok(dirent instanceof Dirent);
				assert.ok(types[dirent.name](dirent));
			}
		});

		it('should throw if bad pathname.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			assert.throws(() => jiar.readdir('a/b'), {
				name: 'Error',
				message: 'Bad pathname, should be POSIX absolute path.',
			});
		});

		it('should throw if bad options.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			assert.throws(() => jiar.readdir('/', 'bad'), {
				name: 'TypeError',
				message: 'Invalid "options", one "object" expected.',
			});
		});

		it('should throw if bad options.recursive.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			assert.throws(() => jiar.readdir('/', {
				recursive: 'bad',
			}), {
				name: 'TypeError',
				message: 'Invalid "options.recursive", one "boolean" expected.',
			});
		});

		it('should throw if bad options.withFileTypes.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			assert.throws(() => jiar.readdir('/', {
				withFileTypes: 'bad',
			}), {
				name: 'TypeError',
				message: 'Invalid "options.withFileTypes", one "boolean" expected.',
			});
		});
	});

	describe('.readFile()', function () {
		it('should get a buffer.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			assert.equal(await jiar.readFile('/baz', 'utf8'), 'baz5\n');
		});

		it('should throw if bad pathname.', async function () {
			const jiar = await FileSystem.mount(samplePathname);

			await assert.rejects(async () => await jiar.readFile(true), {
				name: 'TypeError',
				message: 'Invalid "pathname", one "string" expected.',
			});
		});
	});

	describe('.createReadStream()', function () {
		it('should get a read stream.', async function () {
			const jiar = await FileSystem.mount(samplePathname);
			const stream = jiar.createReadStream('/baz');

			assert.ok(stream instanceof ReadStream);
			assert.equal(stream.path, '/baz');
			assert.equal(stream.pending, true);
			assert.equal(stream.bytesRead, 0);

			await new Promise((resolve) => stream.on('ready', () => {
				assert.equal(stream.pending, false);
				stream.destroy();
				resolve();
			}));
		});
	});

	const FILE_NOT_EXISTED_REG = /^File ".*" is NOT existed.$/;

	describe('.sync()', function () {
		it('shoud ok if file is correct.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			await jiarFS.sync();
		});

		it('should throw if file NOT existed.', async function () {
			const copyPathname = path.join(__dirname, 'sample.gen.jiar');

			await fs.promises.copyFile(samplePathname, copyPathname);

			const jiarFS = await FileSystem.mount(copyPathname);

			await fs.promises.rm(copyPathname);

			await assert.rejects(() => jiarFS.sync(), {
				name: 'Error',
				message: FILE_NOT_EXISTED_REG,
			});
		});

		it('should throw if bad object.sha256.', async function () {
			const pathname = path.join(__dirname, 'sample.sha.missing.jiar');

			await assert.rejects(() => FileSystem.mount(pathname), {
				name: 'TypeError',
				message: 'Invalid "sha256", one "string" expected.',
			});
		});

		it('should throw if object.sha256 NOT matched.', async function () {
			const pathname = path.join(__dirname, 'sample.sha.wrong.jiar');

			await assert.rejects(() => FileSystem.mount(pathname), {
				name: 'Error',
				message: 'File is broken.',
			});
		});
	});

	describe('::mount()', function () {
		it('should get fs.', async function () {
			const jiarFS = await FileSystem.mount(samplePathname);

			assert.ok(jiarFS instanceof FileSystem);
		});

		it('should throw if bad pathname.', async function () {
			await assert.rejects(() => FileSystem.mount(null), {
				name: 'TypeError',
				message: 'Invalid "pathname", one "string" expected.',
			});
		});

		it('should throw if file NOT existed.', async function () {
			await assert.rejects(() => FileSystem.mount('notExisted'), {
				name: 'Error',
				message: FILE_NOT_EXISTED_REG,
			});
		});
	});
});
